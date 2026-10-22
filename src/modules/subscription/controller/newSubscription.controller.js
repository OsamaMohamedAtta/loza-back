const { activateSubscription } = require('../subscription.service')

// POST /subscription/start
// The activation logic lives in subscription.service.js and is shared with the PayTabs flow.
// This route activates a subscription WITHOUT payment, so it can be turned off by setting
// SUBSCRIPTION_START_ENABLED=false once no client depends on it anymore.
const newSubscription = async (req, res) => {
    const userId = req.userData._id // get userId from middleware authorization
    const { subscriptionType, cost } = req.body;

    if (process.env.SUBSCRIPTION_START_ENABLED === 'false') {
        return res.status(403).json({ message: 'Subscriptions are activated after payment from the dashboard' });
    }

    if (!['lifetime', 'yearly'].includes(subscriptionType)) {
        return res.status(400).json({ message: 'Invalid subscription type' });
    }

    try {
        const { subscription } = await activateSubscription({ userId, subscriptionType, cost });

        res.json({ message: 'Subscription started successfully', subscription });
    } catch (err) {
        if (err.status === 404) {
            return res.status(404).json({ message: err.message });
        }
        console.error('Error creating subscription:', err.message);
        res.status(500).json({ message: 'An internal server error occurred while starting the subscription. Please try again later' });
    }
};

module.exports = newSubscription;
