const { getSubscriptionSummary } = require('../../subscription/subscription.service')
const sendPaymentError = require('./sendPaymentError')

// GET /payment/subscription - subscription summary for the website dashboard
const getSubscriptionStatus = async (req, res) => {
    try {
        const subscription = await getSubscriptionSummary(req.userData._id);
        if (!subscription) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ subscription });
    } catch (error) {
        sendPaymentError(res, error);
    }
}

module.exports = getSubscriptionStatus;
