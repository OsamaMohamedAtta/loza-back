const crypto = require('crypto')
const userModel = require('../../../DB/models/user.model')
const paymentModel = require('../../../DB/models/payment.model')
const { getPlan, getConfigProblems, getPaytabsConfig } = require('./payment.config')
const paytabs = require('./paytabs.client')
const { activateSubscription, isSubscriptionActive, isLifetimeEndDate } = require('../subscription/subscription.service')

// PayTabs payment_result.response_status values. Only "A" is a successful payment.
const STATUS_MAP = {
    A: 'paid',      // Authorized
    H: 'pending',   // Hold
    P: 'pending',   // Pending
    D: 'failed',    // Declined
    E: 'failed',    // Error
    V: 'failed',    // Voided
    C: 'cancelled', // Cancelled
    X: 'expired'    // Expired
};

const ACTIVATION_LOCK_MS = 2 * 60 * 1000; // A crashed activation is retried after this
const RECHECK_INTERVAL_MS = 10 * 1000; // Minimum delay between two PayTabs queries from the dashboard
const pendingExpiryMs = () => Number(process.env.PAYMENT_PENDING_EXPIRY_MINUTES || 120) * 60 * 1000;

const httpError = (status, message, code) => {
    const error = new Error(message);
    error.status = status;
    if (code) error.code = code;
    return error;
}

// Only references and statuses are logged, never keys, card data or full PayTabs responses
const log = (event, payment, extra = {}) => {
    console.log(`[payment] ${event}`, JSON.stringify({ orderId: String(payment._id), cartId: payment.cartId, tranRef: payment.tranRef, status: payment.status, ...extra }));
}

const toPublic = (payment) => ({
    orderId: String(payment._id),
    plan: payment.subscriptionType,
    amount: (payment.amountMinor / 100).toFixed(2),
    currency: payment.currency,
    status: payment.status,
    subscriptionActivated: payment.activation?.status === 'done',
    createdAt: payment.createdAt,
    paidAt: payment.paidAt || null
});

const createCheckout = async (userId, planId) => {
    const plan = getPlan(planId);
    if (!plan) throw httpError(400, 'Invalid plan.', 'INVALID_PLAN');

    const problems = getConfigProblems().concat(plan.available ? [] : [`${plan.id} price`]);
    if (problems.length) {
        console.error('[payment] checkout unavailable, missing config:', problems.join(', '));
        throw httpError(503, 'Online payment is not available right now. Please try again later.', 'PAYMENTS_UNAVAILABLE');
    }

    const user = await userModel.findById(userId);
    if (!user) throw httpError(404, 'User not found');
    if (isSubscriptionActive(user) && isLifetimeEndDate(user.endDate)) {
        throw httpError(409, 'You already have an active lifetime subscription.', 'ALREADY_LIFETIME');
    }

    const payment = await paymentModel.create({
        userId: user._id,
        cartId: `LTV-${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}`.toUpperCase(),
        subscriptionType: plan.id,
        amountMinor: plan.amountMinor,
        currency: plan.currency,
        referencePriceUsd: plan.referencePriceUsd
    });

    let result;
    try {
        result = await paytabs.createPaymentPage({
            cartId: payment.cartId,
            amount: plan.amount,
            currency: plan.currency,
            description: `LozaTV ${plan.name}`
        });
    } catch (error) {
        result = null;
        log('initiate_error', payment, { error: error.message });
    }

    if (!result || !result.redirect_url || !result.tran_ref) {
        payment.status = 'failed';
        payment.responseMessage = 'Could not start payment';
        await payment.save();
        log('initiate_failed', payment);
        throw httpError(502, 'Could not start the payment. Please try again.', 'PAYTABS_ERROR');
    }

    payment.tranRef = String(result.tran_ref);
    payment.redirectUrl = String(result.redirect_url);
    await payment.save();
    log('initiated', payment);
    return { ...toPublic(payment), redirectUrl: payment.redirectUrl };
}

const sameAmount = (value, expectedMinor) => {
    if (value === undefined || value === null || value === '') return false;
    const number = Number(value);
    return Number.isFinite(number) && Math.round(number * 100) === expectedMinor;
}

// Checks a PayTabs query response against our order. status is null when it can't be trusted.
const evaluateQueryResult = (payment, data) => {
    const result = data && data.payment_result;
    if (!result || typeof result.response_status !== 'string') return { status: null, reason: 'no_result' };
    if (String(data.tran_ref) !== payment.tranRef) return { status: null, reason: 'tran_ref_mismatch' };
    if (String(data.cart_id) !== payment.cartId) return { status: null, reason: 'cart_id_mismatch' };

    const status = STATUS_MAP[result.response_status.toUpperCase()] || null;
    if (!status) return { status: null, reason: 'unknown_status' };
    if (status !== 'paid') return { status, result };

    // A successful payment must match exactly what we asked PayTabs to charge
    if (data.tran_type && String(data.tran_type).toLowerCase() !== 'sale') return { status: null, reason: 'tran_type_mismatch' };
    if (String(data.cart_currency || '').toUpperCase() !== payment.currency) return { status: null, reason: 'currency_mismatch' };
    if (!sameAmount(data.cart_amount, payment.amountMinor)) return { status: null, reason: 'amount_mismatch' };
    if (data.tran_currency !== undefined && String(data.tran_currency).toUpperCase() !== payment.currency) return { status: null, reason: 'currency_mismatch' };
    if (data.tran_total !== undefined && !sameAmount(data.tran_total, payment.amountMinor)) return { status: null, reason: 'amount_mismatch' };
    return { status, result };
}

const resultFields = (result) => ({
    responseStatus: result.response_status,
    responseCode: String(result.response_code || ''),
    responseMessage: String(result.response_message || '').slice(0, 200)
});

const activate = async (paymentId) => {
    const now = new Date();
    // Claim the activation atomically, so only one caller (callback, return or dashboard) runs it
    const claimed = await paymentModel.findOneAndUpdate(
        {
            _id: paymentId,
            status: 'paid',
            'activation.status': { $ne: 'done' },
            $or: [{ 'activation.lockedAt': null }, { 'activation.lockedAt': { $lt: new Date(now - ACTIVATION_LOCK_MS) } }]
        },
        { $set: { 'activation.lockedAt': now } },
        { new: true }
    );
    if (!claimed) return paymentModel.findById(paymentId);

    try {
        const { subscription } = await activateSubscription({
            userId: claimed.userId,
            subscriptionType: claimed.subscriptionType,
            cost: claimed.referencePriceUsd,
            paymentId: claimed._id,
            amountPaid: claimed.amountMinor / 100,
            currency: claimed.currency,
            extendActive: true
        });
        const done = await paymentModel.findOneAndUpdate(
            { _id: claimed._id },
            { $set: { 'activation.status': 'done', 'activation.subscription': subscription._id, 'activation.activatedAt': new Date(), 'activation.lockedAt': null } },
            { new: true }
        );
        log('subscription_activated', done, { plan: done.subscriptionType });
        return done;
    } catch (error) {
        await paymentModel.updateOne({ _id: claimed._id }, { $set: { 'activation.lockedAt': null } });
        log('activation_error', claimed, { error: error.message });
        throw error;
    }
}

/**
 * Asks PayTabs for the real status of an order and applies it.
 * Safe to call any number of times, concurrently, from any entry point.
 */
const verifyPayment = async (payment) => {
    if (!payment.tranRef) return payment;
    if (payment.status === 'paid') {
        return payment.activation?.status === 'done' ? payment : activate(payment._id);
    }

    let data;
    try {
        data = await paytabs.queryTransaction(payment.tranRef);
    } catch (error) {
        // Temporary problem: leave the payment pending, it will be checked again later
        log('verify_unavailable', payment, { error: error.message });
        await paymentModel.updateOne({ _id: payment._id }, { $set: { lastCheckedAt: new Date() } });
        return paymentModel.findById(payment._id);
    }

    const { status, result, reason } = evaluateQueryResult(payment, data);
    const now = new Date();

    if (status === 'paid') {
        // Any non-paid state can become paid: PayTabs captured the money
        await paymentModel.updateOne(
            { _id: payment._id, status: { $ne: 'paid' } },
            { $set: { status: 'paid', paidAt: now, lastCheckedAt: now, ...resultFields(result) } }
        );
        log('verified_paid', payment);
        return activate(payment._id);
    }

    const set = { lastCheckedAt: now };
    if (status && status !== 'pending') {
        Object.assign(set, { status, ...resultFields(result) });
    } else if (!status && reason !== 'no_result') {
        // The answer does not match our order (amount, currency, reference...): never activate
        console.warn('[payment] verification mismatch', JSON.stringify({ orderId: String(payment._id), cartId: payment.cartId, reason }));
    } else if (now - payment.createdAt > pendingExpiryMs()) {
        set.status = 'expired';
    }
    // Never downgrade a paid payment
    await paymentModel.updateOne({ _id: payment._id, status: { $ne: 'paid' } }, { $set: set });
    const updated = await paymentModel.findById(payment._id);
    if (set.status && set.status !== payment.status) log(`verified_${set.status}`, updated);
    return updated;
}

// Server-to-server PayTabs callback (no browser session or user token involved)
const handleCallback = async ({ rawBody, signature, body }) => {
    if (!paytabs.isValidCallbackSignature(rawBody, signature)) throw httpError(401, 'Invalid signature');
    const cartId = body && typeof body.cart_id === 'string' ? body.cart_id : null;
    const tranRef = body && typeof body.tran_ref === 'string' ? body.tran_ref : null;
    if (!cartId || !tranRef) throw httpError(400, 'Invalid payload');

    const payment = await paymentModel.findOne({ cartId });
    if (!payment) throw httpError(404, 'Unknown order');
    if (payment.tranRef !== tranRef) {
        console.warn('[payment] callback tran_ref mismatch', JSON.stringify({ orderId: String(payment._id), cartId }));
        throw httpError(400, 'Invalid payload');
    }
    // The callback body is never trusted for the result: PayTabs is always queried again
    return verifyPayment(payment);
}

// The customer's browser coming back from PayTabs. It never activates by itself,
// it only runs the same server-side verification and then redirects to the dashboard.
const handleReturn = async (params) => {
    const cartId = [params.cartId, params.cart_id].find(value => typeof value === 'string') || null;
    const payment = cartId ? await paymentModel.findOne({ cartId }) : null;
    if (payment) {
        try {
            await verifyPayment(payment);
        } catch (error) {
            log('return_verify_error', payment, { error: error.message });
        }
    }
    const url = new URL(getPaytabsConfig().dashboardUrl);
    if (payment) url.searchParams.set('payment', String(payment._id));
    return url.toString();
}

const getOrderForUser = async (userId, orderId) => {
    if (!/^[a-f0-9]{24}$/i.test(String(orderId))) throw httpError(404, 'Payment not found');
    // Scoped to the logged in user: other users' payments are invisible
    let payment = await paymentModel.findOne({ _id: orderId, userId });
    if (!payment) throw httpError(404, 'Payment not found');

    const needsCheck = payment.status === 'pending' || (payment.status === 'paid' && payment.activation?.status !== 'done');
    if (needsCheck && (!payment.lastCheckedAt || Date.now() - payment.lastCheckedAt > RECHECK_INTERVAL_MS)) {
        payment = await verifyPayment(payment);
    }
    return toPublic(payment);
}

const listOrdersForUser = async (userId) => {
    const payments = await paymentModel.find({ userId }).sort({ createdAt: -1 }).limit(10);
    return payments.map(toPublic);
}

module.exports = { createCheckout, verifyPayment, handleCallback, handleReturn, getOrderForUser, listOrdersForUser, evaluateQueryResult, STATUS_MAP };
