// PayTabs payment + subscription tests.
// Runs the real app (routes, auth middleware, models) against an in-memory MongoDB.
// PayTabs itself is replaced by a local mock server: no real payment is made.
const { test, before, after, beforeEach, describe } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const moment = require('moment-timezone');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const SERVER_KEY = 'S_TEST_SERVER_KEY';
const TZ = 'Africa/Cairo';
const day = (offset = 0) => moment.tz(TZ).add(offset, 'days').format('YYYY-MM-DD');
const inYears = (years, from = moment.tz(TZ)) => moment.tz(from, TZ).add(years, 'years').format('YYYY-MM-DD');

// ---------- mock PayTabs ----------
const mock = { transactions: new Map(), requests: [], queries: 0, failQuery: false, nextRef: 1 };
const paytabsServer = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
        const send = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
        if (req.headers.authorization !== SERVER_KEY) return send(401, { code: 1, message: 'Authentication failed' });
        const data = JSON.parse(body);
        if (req.url === '/payment/request') {
            mock.requests.push(data);
            const tranRef = `TST${String(mock.nextRef++).padStart(10, '0')}`;
            const amount = Number(data.cart_amount).toFixed(2);
            mock.transactions.set(tranRef, { tran_ref: tranRef, cart_id: data.cart_id, cart_currency: data.cart_currency, cart_amount: amount, tran_type: 'Sale', tran_currency: data.cart_currency, tran_total: amount });
            return send(200, { tran_ref: tranRef, cart_id: data.cart_id, redirect_url: `https://secure-egypt.paytabs.com/payment/page/${tranRef}` });
        }
        if (req.url === '/payment/query') {
            mock.queries++;
            if (mock.failQuery) return send(500, { message: 'down' });
            const tx = mock.transactions.get(data.tran_ref);
            return tx ? send(200, tx) : send(400, { code: 2, message: 'Transaction not found' });
        }
        send(404, {});
    });
});
const setResult = (tranRef, status, overrides = {}) => {
    Object.assign(mock.transactions.get(tranRef), {
        payment_result: { response_status: status, response_code: status === 'A' ? 'G12345' : '400', response_message: status === 'A' ? 'Authorised' : 'Declined' }
    }, overrides);
}

// ---------- app setup ----------
let mongod, app, userModel, subscriptionModel, paymentModel;

const setEnv = () => {
    Object.assign(process.env, {
        TOKEN_SECRET_KEY: 'test-secret',
        RATE_LIMIT_MAX: '100000',
        PAYTABS_PROFILE_ID: '123456',
        PAYTABS_SERVER_KEY: SERVER_KEY,
        PAYTABS_REGION: 'EGY',
        PAYTABS_API_URL: `http://127.0.0.1:${paytabsServer.address().port}`,
        PAYTABS_CURRENCY: 'EGP',
        PAYTABS_CALLBACK_URL: 'https://lozatv-back-app.onrender.com/payment/callback',
        PAYTABS_RETURN_URL: 'https://lozatv-back-app.onrender.com/payment/return',
        FRONTEND_DASHBOARD_URL: 'https://lozatv.com/dashboard.html',
        ANNUAL_PRICE_EGP: '250',
        LIFETIME_PRICE_EGP: '500.50'
    });
    delete process.env.SUBSCRIPTION_START_ENABLED;
}

before(async () => {
    await new Promise((resolve) => paytabsServer.listen(0, '127.0.0.1', resolve));
    setEnv();
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    app = require('../app');
    userModel = require('../DB/models/user.model');
    subscriptionModel = require('../DB/models/subscription.model');
    paymentModel = require('../DB/models/payment.model');
    await Promise.all([userModel.init(), subscriptionModel.init(), paymentModel.init()]);
    console.log = () => {}; // keep the test output readable
    console.warn = () => {};
});

after(async () => {
    await mongoose.disconnect();
    await mongod.stop();
    paytabsServer.close();
});

beforeEach(async () => {
    setEnv();
    mock.transactions.clear(); mock.requests = []; mock.queries = 0; mock.failQuery = false;
    await Promise.all([userModel.deleteMany({}), subscriptionModel.deleteMany({}), paymentModel.deleteMany({})]);
});

let macCounter = 0;
// Default: a user whose 1-week trial is running (what checkMac creates)
const makeUser = async (fields = {}) => {
    const user = await userModel.create({ macAddress: `aa:bb:cc:00:00:${String(++macCounter).padStart(2, '0')}`, deviceKey: '123456', startDate: day(0), endDate: day(7), ...fields });
    return { user, token: jwt.sign({ id: user._id }, process.env.TOKEN_SECRET_KEY) };
}
const expiredFields = { isSubscribed: false, isTrialActive: false, startDate: day(-400), endDate: day(-35) };
const authed = (token) => ({ Authorization: `Bearer ${token}` });
const checkout = (token, planId = 'yearly', extra = {}) => request(app).post('/payment/checkout').set(authed(token)).send({ planId, ...extra });
const sign = (body) => crypto.createHmac('sha256', SERVER_KEY).update(body).digest('hex');

const callback = (payment, status = 'A', { signature, bodyOverrides = {} } = {}) => {
    const tx = mock.transactions.get(payment.tranRef);
    const body = JSON.stringify({ tran_ref: payment.tranRef, cart_id: payment.cartId, cart_currency: tx.cart_currency, cart_amount: tx.cart_amount, payment_result: { response_status: status }, ...bodyOverrides });
    return request(app).post('/payment/callback').set('Content-Type', 'application/json').set('signature', signature ?? sign(body)).send(body);
}

const startPayment = async (plan = 'yearly', userFields = {}) => {
    const { user, token } = await makeUser(userFields);
    const res = await checkout(token, plan);
    assert.equal(res.status, 201, JSON.stringify(res.body));
    const payment = await paymentModel.findById(res.body.payment.orderId);
    return { user, token, payment };
}

// ---------- tests ----------
describe('plans and pricing', () => {
    test('plans expose the configured EGP prices and hide internal fields', async () => {
        const res = await request(app).get('/payment/plans');
        assert.equal(res.status, 200);
        assert.equal(res.body.available, true);
        const yearly = res.body.plans.find((p) => p.id === 'yearly');
        const lifetime = res.body.plans.find((p) => p.id === 'lifetime');
        assert.deepEqual([yearly.amount, yearly.currency, yearly.referencePriceUsd], ['250.00', 'EGP', 5]);
        assert.deepEqual([lifetime.amount, lifetime.currency, lifetime.referencePriceUsd], ['500.50', 'EGP', 10]);
        assert.equal(yearly.amountMinor, undefined);
        assert.ok(!JSON.stringify(res.body).includes(SERVER_KEY));
    });

    test('missing or invalid price configuration disables checkout (no invented exchange rate)', async () => {
        delete process.env.ANNUAL_PRICE_EGP;
        process.env.LIFETIME_PRICE_EGP = '-5';
        assert.equal((await request(app).get('/payment/plans')).body.available, false);
        const { token } = await makeUser();
        assert.equal((await checkout(token, 'yearly')).status, 503);
        assert.equal((await checkout(token, 'lifetime')).status, 503);
        assert.equal(mock.requests.length, 0);
        assert.equal(await paymentModel.countDocuments(), 0);
    });

    test('missing PayTabs credentials disable checkout', async () => {
        delete process.env.PAYTABS_SERVER_KEY;
        const { token } = await makeUser();
        assert.equal((await checkout(token, 'yearly')).status, 503);
        assert.equal(mock.requests.length, 0);
    });
});

describe('checkout', () => {
    test('annual plan creates a pending order and a PayTabs EGP payment page', async () => {
        const { user, token } = await makeUser();
        const res = await checkout(token, 'yearly');
        assert.equal(res.status, 201);
        assert.match(res.body.redirectUrl, /^https:\/\/secure-egypt\.paytabs\.com\//);
        assert.deepEqual([res.body.payment.amount, res.body.payment.currency, res.body.payment.status], ['250.00', 'EGP', 'pending']);
        const sent = mock.requests[0];
        assert.deepEqual(
            { profile_id: sent.profile_id, tran_type: sent.tran_type, tran_class: sent.tran_class, cart_currency: sent.cart_currency, cart_amount: sent.cart_amount, callback: sent.callback, return: sent.return },
            { profile_id: 123456, tran_type: 'sale', tran_class: 'ecom', cart_currency: 'EGP', cart_amount: 250, callback: 'https://lozatv-back-app.onrender.com/payment/callback', return: 'https://lozatv-back-app.onrender.com/payment/return' }
        );
        const payment = await paymentModel.findById(res.body.payment.orderId);
        assert.equal(String(payment.userId), String(user._id));
        assert.deepEqual([payment.cartId, payment.amountMinor, payment.subscriptionType], [sent.cart_id, 25000, 'yearly']);
        assert.ok(payment.tranRef);
        const fresh = await userModel.findById(user._id);
        assert.equal(fresh.isSubscribed, false, 'checkout alone must not activate anything');
        assert.equal(await subscriptionModel.countDocuments(), 0);
    });

    test('lifetime plan uses the lifetime EGP price', async () => {
        const { token } = await makeUser();
        const res = await checkout(token, 'lifetime');
        assert.equal(res.status, 201);
        assert.equal(mock.requests[0].cart_amount, 500.5);
        assert.equal(res.body.payment.amount, '500.50');
    });

    test('invalid plan ids are rejected', async () => {
        const { token } = await makeUser();
        for (const planId of ['monthly', undefined, 5, { $ne: null }, 'YEARLY_']) {
            const res = await request(app).post('/payment/checkout').set(authed(token)).send({ planId });
            assert.equal(res.status, 400, `planId=${JSON.stringify(planId)}`);
        }
        assert.equal(mock.requests.length, 0);
    });

    test('manipulated client price, currency and duration are ignored', async () => {
        const { token } = await makeUser();
        const res = await checkout(token, 'yearly', { cost: 1, amount: '1.00', cart_amount: 1, currency: 'USD', subscriptionType: 'lifetime', endDate: '2999-01-01' });
        assert.equal(res.status, 201);
        assert.equal(mock.requests[0].cart_amount, 250);
        assert.equal(mock.requests[0].cart_currency, 'EGP');
        assert.equal((await paymentModel.findById(res.body.payment.orderId)).subscriptionType, 'yearly');
    });

    test('requires the login token; a MAC address or device key in the body is not proof of ownership', async () => {
        const { user: other } = await makeUser();
        assert.equal((await request(app).post('/payment/checkout').send({ planId: 'yearly', macAddress: other.macAddress, deviceKey: '123456' })).status, 401);
        assert.equal((await request(app).post('/payment/checkout').set('Authorization', 'Bearer forged').send({ planId: 'yearly' })).status, 401);
        const { user: me, token } = await makeUser();
        const res = await checkout(token, 'yearly', { macAddress: other.macAddress, userId: String(other._id) });
        assert.equal(String((await paymentModel.findById(res.body.payment.orderId)).userId), String(me._id));
    });

    test('users whose trial or subscription ended can still pay (unlike isUser routes)', async () => {
        const { token } = await makeUser(expiredFields);
        assert.equal((await request(app).get('/user/userInfo').set(authed(token))).status, 403, 'existing isUser behaviour unchanged');
        assert.equal((await checkout(token, 'yearly')).status, 201);
        const summary = (await request(app).get('/payment/subscription').set(authed(token))).body.subscription;
        assert.deepEqual([summary.active, summary.expired], [false, true]);
    });

    test('PayTabs failure at initiation marks the order failed without leaking details', async () => {
        process.env.PAYTABS_SERVER_KEY = 'wrong-key';
        const { token } = await makeUser();
        const res = await checkout(token, 'yearly');
        assert.equal(res.status, 502);
        assert.ok(!/Authentication failed|wrong-key/.test(JSON.stringify(res.body)));
        assert.equal((await paymentModel.findOne()).status, 'failed');
    });

    test('checkout is rate limited per user', async () => {
        const { token } = await makeUser();
        const statuses = [];
        for (let i = 0; i < 6; i++) statuses.push((await checkout(token, 'yearly')).status);
        assert.deepEqual(statuses, [201, 201, 201, 201, 201, 429]);
        const { token: otherToken } = await makeUser();
        assert.equal((await checkout(otherToken, 'yearly')).status, 201, 'other users are not affected');
    });
});

describe('verification and activation', () => {
    test('a verified successful callback activates an annual subscription the TV app accepts', async () => {
        const { user, payment } = await startPayment('yearly');
        setResult(payment.tranRef, 'A');
        assert.equal((await callback(payment)).status, 200);
        const p = await paymentModel.findById(payment._id);
        assert.deepEqual([p.status, p.activation.status], ['paid', 'done']);
        const u = await userModel.findById(user._id);
        assert.deepEqual([u.isSubscribed, u.isTrialActive, u.startDate, u.endDate], [true, false, day(0), inYears(1)]);
        const subs = await subscriptionModel.find({ userId: user._id });
        assert.equal(subs.length, 1);
        assert.deepEqual([subs[0].subscriptionType, subs[0].cost, subs[0].amountPaid, subs[0].currency, subs[0].subscriptionStartDate, subs[0].subscriptionEndDate], ['yearly', 5, 250, 'EGP', day(0), inYears(1)]);
        assert.match(subs[0].time, /^\d{2}:\d{2}:\d{2}$/);
        assert.equal(u.macAddress, user.macAddress, 'unrelated fields untouched');
        assert.equal(u.deviceKey, user.deviceKey);
        // The TV app's own check (checkMac) accepts the new subscription
        const app_ = await request(app).post('/user/checkMac').send({ macAddress: user.macAddress });
        assert.equal(app_.status, 200);
        assert.equal(app_.body.isSubscribed, true);
    });

    for (const [code, expected] of [['D', 'failed'], ['E', 'failed'], ['V', 'failed'], ['C', 'cancelled'], ['X', 'expired'], ['P', 'pending'], ['H', 'pending']]) {
        test(`PayTabs status ${code} -> ${expected}, never activates`, async () => {
            const { user, payment } = await startPayment('yearly');
            setResult(payment.tranRef, code);
            await callback(payment, code);
            const p = await paymentModel.findById(payment._id);
            assert.deepEqual([p.status, p.activation.status], [expected, 'none']);
            assert.equal((await userModel.findById(user._id)).isSubscribed, false);
            assert.equal(await subscriptionModel.countDocuments(), 0);
        });
    }

    test('a callback body claiming success is not trusted: the PayTabs query decides', async () => {
        const { user, payment } = await startPayment('yearly');
        setResult(payment.tranRef, 'D');
        await callback(payment, 'A');
        assert.equal((await paymentModel.findById(payment._id)).status, 'failed');
        assert.equal((await userModel.findById(user._id)).isSubscribed, false);
    });

    for (const [name, overrides] of [
        ['amount', { cart_amount: '1.00', tran_total: '1.00' }],
        ['currency', { cart_currency: 'USD', tran_currency: 'USD' }],
        ['tran_total', { tran_total: '249.99' }],
        ['cart_id', { cart_id: 'SOMEONE-ELSES-CART' }],
        ['transaction type', { tran_type: 'Auth' }]
    ]) {
        test(`an incorrect ${name} in a successful transaction is rejected`, async () => {
            const { user, payment } = await startPayment('yearly');
            setResult(payment.tranRef, 'A', overrides);
            await callback(payment);
            assert.equal((await paymentModel.findById(payment._id)).status, 'pending');
            assert.equal((await userModel.findById(user._id)).isSubscribed, false);
            assert.equal(await subscriptionModel.countDocuments(), 0);
        });
    }

    test('invalid or missing signatures are rejected without querying PayTabs', async () => {
        const { payment } = await startPayment('yearly');
        setResult(payment.tranRef, 'A');
        assert.equal((await callback(payment, 'A', { signature: 'deadbeef' })).status, 401);
        assert.equal((await callback(payment, 'A', { signature: '' })).status, 401);
        const wrongKey = crypto.createHmac('sha256', 'other').update('{}').digest('hex');
        assert.equal((await callback(payment, 'A', { signature: wrongKey })).status, 401);
        assert.equal(mock.queries, 0);
        assert.equal((await paymentModel.findById(payment._id)).status, 'pending');
    });

    test('callbacks for unknown orders or with a different tran_ref are rejected', async () => {
        const { payment } = await startPayment('yearly');
        setResult(payment.tranRef, 'A');
        assert.equal((await callback(payment, 'A', { bodyOverrides: { cart_id: 'NOPE' } })).status, 404);
        assert.equal((await callback(payment, 'A', { bodyOverrides: { tran_ref: 'TST9999999999' } })).status, 400);
        assert.equal((await callback(payment, 'A', { bodyOverrides: { cart_id: { $ne: null } } })).status, 400);
        assert.equal((await paymentModel.findById(payment._id)).status, 'pending');
    });

    test('PayTabs unavailable during verification leaves the payment pending; a later check succeeds', async () => {
        const { user, token, payment } = await startPayment('yearly');
        setResult(payment.tranRef, 'A');
        mock.failQuery = true;
        assert.equal((await callback(payment)).status, 200);
        assert.equal((await paymentModel.findById(payment._id)).status, 'pending');
        mock.failQuery = false;
        await paymentModel.updateOne({ _id: payment._id }, { $unset: { lastCheckedAt: 1 } });
        const res = await request(app).get(`/payment/orders/${payment._id}`).set(authed(token));
        assert.deepEqual([res.body.payment.status, res.body.payment.subscriptionActivated], ['paid', true]);
        assert.equal((await userModel.findById(user._id)).isSubscribed, true);
    });

    test('duplicate callbacks do not extend the period or create duplicate records', async () => {
        const { user, payment } = await startPayment('yearly');
        setResult(payment.tranRef, 'A');
        await callback(payment);
        for (let i = 0; i < 3; i++) assert.equal((await callback(payment)).status, 200);
        assert.equal((await userModel.findById(user._id)).endDate, inYears(1));
        assert.equal(await subscriptionModel.countDocuments(), 1);
    });

    test('concurrent callbacks, returns and dashboard polls activate exactly once', async () => {
        const { user, token, payment } = await startPayment('yearly', { isSubscribed: true, isTrialActive: false, startDate: day(-10), endDate: day(30) });
        setResult(payment.tranRef, 'A');
        const calls = [];
        for (let i = 0; i < 8; i++) calls.push(callback(payment));
        for (let i = 0; i < 3; i++) calls.push(request(app).post('/payment/return').type('form').send({ cartId: payment.cartId, tranRef: payment.tranRef, respStatus: 'A' }));
        for (let i = 0; i < 3; i++) calls.push(request(app).get(`/payment/orders/${payment._id}`).set(authed(token)));
        await Promise.all(calls);
        assert.equal(await subscriptionModel.countDocuments(), 1);
        assert.equal((await userModel.findById(user._id)).endDate, inYears(1, moment.tz(day(30), TZ)), 'extended exactly once');
        assert.equal((await paymentModel.findById(payment._id)).activation.status, 'done');
    });

    test('a stale activation lock (crash mid-activation) is recovered without duplicates', async () => {
        const { user, token, payment } = await startPayment('yearly');
        await paymentModel.updateOne({ _id: payment._id }, { $set: { status: 'paid', 'activation.lockedAt': new Date(Date.now() - 10 * 60 * 1000) } });
        const res = await request(app).get(`/payment/orders/${payment._id}`).set(authed(token));
        assert.equal(res.body.payment.subscriptionActivated, true);
        assert.equal((await userModel.findById(user._id)).isSubscribed, true);
        assert.equal(await subscriptionModel.countDocuments(), 1);
    });

    test('the return URL never activates by itself and redirects to the dashboard', async () => {
        const { user, payment } = await startPayment('yearly');
        setResult(payment.tranRef, 'P');
        const res = await request(app).post('/payment/return').type('form').send({ cartId: payment.cartId, tranRef: payment.tranRef, respStatus: 'A', respMessage: 'Authorised' });
        assert.equal(res.status, 303);
        assert.equal(res.headers.location, `https://lozatv.com/dashboard.html?payment=${payment._id}`);
        assert.equal((await paymentModel.findById(payment._id)).status, 'pending');
        assert.equal((await userModel.findById(user._id)).isSubscribed, false);
        const unknown = await request(app).get('/payment/return');
        assert.deepEqual([unknown.status, unknown.headers.location], [303, 'https://lozatv.com/dashboard.html']);
    });

    test('a late successful payment on an expired order still activates (the money was taken)', async () => {
        const { user, payment } = await startPayment('yearly');
        await paymentModel.updateOne({ _id: payment._id }, { $set: { status: 'expired' } });
        setResult(payment.tranRef, 'A');
        await callback(payment);
        assert.equal((await paymentModel.findById(payment._id)).status, 'paid');
        assert.equal((await userModel.findById(user._id)).isSubscribed, true);
    });

    test('pending orders without a PayTabs result expire after the configured time', async () => {
        const { token, payment } = await startPayment('yearly');
        await paymentModel.collection.updateOne({ _id: payment._id }, { $set: { createdAt: new Date(Date.now() - 3 * 3600 * 1000) } });
        const res = await request(app).get(`/payment/orders/${payment._id}`).set(authed(token));
        assert.equal(res.body.payment.status, 'expired');
    });
});

describe('subscription lifecycle', () => {
    test('an expired annual subscription becomes active again after a new verified payment', async () => {
        const { user, token, payment } = await startPayment('yearly', expiredFields);
        assert.equal((await request(app).post('/user/checkMac').send({ macAddress: user.macAddress })).status, 400);
        setResult(payment.tranRef, 'A');
        await callback(payment);
        const summary = (await request(app).get('/payment/subscription').set(authed(token))).body.subscription;
        assert.deepEqual([summary.active, summary.plan, summary.startDate, summary.endDate], [true, 'yearly', day(0), inYears(1)]);
        assert.equal((await request(app).post('/user/checkMac').send({ macAddress: user.macAddress })).status, 200);
    });

    test('renewing an active annual plan extends from the current end date', async () => {
        const { user, payment } = await startPayment('yearly', { isSubscribed: true, isTrialActive: false, startDate: day(-300), endDate: day(30) });
        setResult(payment.tranRef, 'A');
        await callback(payment);
        const u = await userModel.findById(user._id);
        assert.deepEqual([u.startDate, u.endDate], [day(0), inYears(1, moment.tz(day(30), TZ))]);
    });

    test('paying during the free trial starts a full year from today', async () => {
        const { user, payment } = await startPayment('yearly'); // trial ends in 7 days
        setResult(payment.tranRef, 'A');
        await callback(payment);
        assert.equal((await userModel.findById(user._id)).endDate, inYears(1));
    });

    test('lifetime payment gives non-expiring access and blocks further purchases', async () => {
        const { user, token, payment } = await startPayment('lifetime', { isSubscribed: true, isTrialActive: false, startDate: day(-5), endDate: day(10) });
        setResult(payment.tranRef, 'A');
        await callback(payment);
        const u = await userModel.findById(user._id);
        assert.equal(u.endDate, inYears(100));
        const sub = await subscriptionModel.findOne({ userId: user._id });
        assert.deepEqual([sub.subscriptionType, sub.cost, sub.amountPaid], ['lifetime', 10, 500.5]);
        const summary = (await request(app).get('/payment/subscription').set(authed(token))).body.subscription;
        assert.deepEqual([summary.active, summary.plan, summary.isLifetime, summary.endDate], [true, 'lifetime', true, null]);
        assert.equal((await checkout(token, 'yearly')).status, 409);
        assert.equal((await request(app).post('/user/checkMac').send({ macAddress: user.macAddress })).status, 200);
    });

    test('existing reseller lifetime users (end date 3025) are recognised as lifetime', async () => {
        const { token } = await makeUser({ isSubscribed: true, isTrialActive: false, startDate: day(-100), endDate: '3025-04-25' });
        const summary = (await request(app).get('/payment/subscription').set(authed(token))).body.subscription;
        assert.deepEqual([summary.plan, summary.isLifetime], ['lifetime', true]);
        assert.equal((await checkout(token, 'lifetime')).status, 409);
    });

    test('a yearly activation never shortens an existing lifetime', async () => {
        const { user, payment } = await startPayment('yearly');
        await userModel.updateOne({ _id: user._id }, { $set: { isSubscribed: true, isTrialActive: false, startDate: day(-1), endDate: inYears(100) } });
        setResult(payment.tranRef, 'A');
        await callback(payment);
        assert.equal((await userModel.findById(user._id)).endDate, inYears(100));
    });

    test('existing subscribed and trial users keep their access (no migration needed)', async () => {
        const legacy = await makeUser({ isSubscribed: true, isTrialActive: false, startDate: day(-10), endDate: day(100) });
        const s1 = (await request(app).get('/payment/subscription').set(authed(legacy.token))).body.subscription;
        assert.deepEqual([s1.active, s1.plan, s1.endDate], [true, 'yearly', day(100)]);
        assert.equal((await request(app).get('/user/userInfo').set(authed(legacy.token))).status, 200);
        const trial = await makeUser();
        const s2 = (await request(app).get('/payment/subscription').set(authed(trial.token))).body.subscription;
        assert.deepEqual([s2.active, s2.plan, s2.isTrialActive], [false, 'trial', true]);
    });
});

describe('authorization', () => {
    test('users cannot see or poll another user\'s payments', async () => {
        const a = await startPayment('yearly');
        const b = await makeUser();
        assert.equal((await request(app).get(`/payment/orders/${a.payment._id}`).set(authed(b.token))).status, 404);
        assert.equal((await request(app).get('/payment/orders/not-an-id').set(authed(b.token))).status, 404);
        assert.deepEqual((await request(app).get('/payment/orders').set(authed(b.token))).body.payments, []);
        const mine = await request(app).get('/payment/orders').set(authed(a.token));
        assert.equal(mine.body.payments.length, 1);
        assert.equal(mine.body.payments[0].tranRef, undefined, 'PayTabs references are not exposed');
        for (const path of ['/payment/orders', `/payment/orders/${a.payment._id}`, '/payment/subscription']) {
            assert.equal((await request(app).get(path)).status, 401);
        }
    });

    test('admin/reseller tokens cannot use the user payment routes', async () => {
        const res = await request(app).get('/payment/subscription').set('Authorization', `${process.env.AUTH_SECRET_KEY || 'x'}${jwt.sign({ id: new mongoose.Types.ObjectId() }, 'test-secret')}`);
        assert.equal(res.status, 401);
    });
});

describe('existing endpoints', () => {
    test('MAC address + device key login and userInfo still work', async () => {
        const { user } = await makeUser({ isSubscribed: true, isTrialActive: false, startDate: day(-1), endDate: day(100) });
        const login = await request(app).post('/user/login').send({ macAddress: user.macAddress, deviceKey: '123456' });
        assert.equal(login.status, 200);
        const info = await request(app).get('/user/userInfo').set(authed(login.body.token));
        assert.deepEqual([info.status, info.body.macAddress, info.body.endDate], [200, user.macAddress, day(100)]);
        assert.equal((await request(app).post('/user/login').send({ macAddress: user.macAddress, deviceKey: 'bad' })).status, 404);
    });

    test('/subscription/start keeps its behaviour and response, now through the shared service', async () => {
        const { user, token } = await makeUser();
        const res = await request(app).post('/subscription/start').set(authed(token)).send({ subscriptionType: 'yearly', cost: 5 });
        assert.equal(res.status, 200);
        assert.equal(res.body.message, 'Subscription started successfully');
        assert.deepEqual([res.body.subscription.subscriptionType, res.body.subscription.subscriptionStartDate, res.body.subscription.subscriptionEndDate, res.body.subscription.cost], ['yearly', day(0), inYears(1), 5]);
        const u = await userModel.findById(user._id);
        assert.deepEqual([u.isSubscribed, u.isTrialActive, u.endDate], [true, false, inYears(1)]);
        const lifetime = await request(app).post('/subscription/start').set(authed(token)).send({ subscriptionType: 'lifetime', cost: 10 });
        assert.equal(lifetime.body.subscription.subscriptionEndDate, inYears(100));
        assert.equal((await request(app).post('/subscription/start').set(authed(token)).send({ subscriptionType: 'monthly', cost: 1 })).status, 400);
    });

    test('/subscription/start can be switched off with SUBSCRIPTION_START_ENABLED=false', async () => {
        process.env.SUBSCRIPTION_START_ENABLED = 'false';
        const { user, token } = await makeUser();
        const res = await request(app).post('/subscription/start').set(authed(token)).send({ subscriptionType: 'lifetime', cost: 0 });
        assert.equal(res.status, 403);
        assert.equal((await userModel.findById(user._id)).isSubscribed, false);
    });
});
