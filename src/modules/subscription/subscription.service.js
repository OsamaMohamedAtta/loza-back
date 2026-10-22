const userModel = require('../../../DB/models/user.model')
const subscriptionModel = require('../../../DB/models/subscription.model')
const moment = require('moment-timezone');

// Shared subscription activation logic, used by POST /subscription/start and
// by the PayTabs payment flow after a verified payment.
// Dates are stored as YYYY-MM-DD strings in Africa/Cairo time, like the rest of the app.

const TIME_ZONE = 'Africa/Cairo';
const DATE_FORMAT = 'YYYY-MM-DD';
const LIFETIME_YEARS = 100; // Same as the original controller: checkMac only compares dates
const LIFETIME_THRESHOLD_YEARS = 50; // Anything ending further away than this is treated as lifetime

// Same rule the TV app uses in checkMac: today must be between startDate and endDate
const isWithinPeriod = (user) => {
    if (!user || !user.startDate || !user.endDate) return false;
    const currentDate = moment.tz(TIME_ZONE);
    return currentDate.isBetween(moment.tz(user.startDate, TIME_ZONE), moment.tz(user.endDate, TIME_ZONE), null, '[]');
}

// A paid subscription that is currently valid
const isSubscriptionActive = (user) => Boolean(user && user.isSubscribed) && isWithinPeriod(user);

const isLifetimeEndDate = (endDate) => {
    if (!endDate) return false;
    return moment.tz(endDate, TIME_ZONE).isAfter(moment.tz(TIME_ZONE).add(LIFETIME_THRESHOLD_YEARS, 'years'));
}

// Calculate the new period. When extendActive is set, a yearly renewal of a still
// active subscription starts counting from the current end date, so no paid days are lost.
const computePeriod = (user, subscriptionType, extendActive) => {
    const currentDate = moment.tz(TIME_ZONE);
    let endDate;
    if (subscriptionType === 'lifetime') {
        endDate = currentDate.clone().add(LIFETIME_YEARS, 'years');
    } else if (extendActive && isSubscriptionActive(user)) {
        endDate = moment.tz(user.endDate, TIME_ZONE).add(1, 'years');
    } else {
        endDate = currentDate.clone().add(1, 'years');
    }
    return { startDate: currentDate.format(DATE_FORMAT), endDate: endDate.format(DATE_FORMAT) };
}

/**
 * Creates a subscription record and updates the user's subscription fields.
 * When paymentId is given the call is idempotent: the record is unique per payment,
 * so repeated calls never create a second record or extend the period twice.
 */
const activateSubscription = async ({ userId, subscriptionType, cost, paymentId, amountPaid, currency, extendActive = false }) => {
    if (!['lifetime', 'yearly'].includes(subscriptionType)) {
        const error = new Error('Invalid subscription type');
        error.status = 400;
        throw error;
    }

    const user = await userModel.findById(userId);
    if (!user) {
        const error = new Error('User not found. Please check the user ID');
        error.status = 404;
        throw error;
    }

    let subscription = paymentId ? await subscriptionModel.findOne({ payment: paymentId }) : null;

    if (!subscription) {
        const { startDate, endDate } = computePeriod(user, subscriptionType, extendActive);
        try {
            subscription = await subscriptionModel.create({
                userId: user._id,
                subscriptionType,
                subscriptionStartDate: startDate,
                subscriptionEndDate: endDate,
                cost,
                time: moment().format('HH:mm:ss'),
                ...(paymentId ? { payment: paymentId, amountPaid, currency } : {})
            });
        } catch (error) {
            // A concurrent activation of the same payment won the race: reuse its record
            if (error && error.code === 11000 && paymentId) {
                subscription = await subscriptionModel.findOne({ payment: paymentId });
            } else {
                throw error;
            }
        }
    }

    // Only the subscription fields are updated. A yearly purchase never shortens a lifetime one.
    const keepLifetime = subscriptionType === 'yearly' && isSubscriptionActive(user) && isLifetimeEndDate(user.endDate);
    if (!keepLifetime) {
        await userModel.updateOne({ _id: user._id }, {
            $set: {
                startDate: subscription.subscriptionStartDate,
                endDate: subscription.subscriptionEndDate,
                isSubscribed: true,
                isTrialActive: false
            }
        });
    }

    return { subscription, user: await userModel.findById(user._id) };
}

// Read-only summary for the website dashboard (works for existing users without migration)
const getSubscriptionSummary = async (userId) => {
    const user = await userModel.findById(userId);
    if (!user) return null;

    const active = isSubscriptionActive(user);
    const isLifetime = active && isLifetimeEndDate(user.endDate);
    const trialActive = Boolean(user.isTrialActive) && !user.isSubscribed && isWithinPeriod(user);

    let plan = null;
    if (isLifetime) plan = 'lifetime';
    else if (active) {
        const latest = await subscriptionModel.findOne({ userId: user._id }).sort({ _id: -1 });
        plan = latest && latest.subscriptionType === 'lifetime' && isLifetimeEndDate(latest.subscriptionEndDate) ? 'lifetime' : 'yearly';
    } else if (trialActive) plan = 'trial';

    return {
        macAddress: user.macAddress,
        isSubscribed: Boolean(user.isSubscribed),
        active,
        plan,
        isLifetime,
        isTrialActive: trialActive,
        startDate: user.startDate || null,
        endDate: isLifetime ? null : user.endDate || null,
        expired: !active && !trialActive && Boolean(user.endDate)
    };
}

module.exports = { activateSubscription, getSubscriptionSummary, isSubscriptionActive, isLifetimeEndDate, isWithinPeriod, computePeriod, TIME_ZONE, DATE_FORMAT };
