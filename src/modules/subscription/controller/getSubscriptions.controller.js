const subscriptionModel = require('../../../../DB/models/subscription.model')

const getSubscriptions = async (req, res) => {
    const { page = 1 } = req.query; // Get page query params
    const limit = 20; // Number of items per page
    const skip = (page - 1) * limit; // Calculate number of items to skip

    try {
        // Get all user's subscription
        const subscriptions = await subscriptionModel.find().sort({ _id: -1 }).skip(skip).limit(limit).populate({
            path: 'userId', // Populate user field
            select: 'macAddress type'
        });

        // If there are no subscriptions in the date range
        if (subscriptions.length === 0) {
            return res.status(404).json({ message: 'No subscriptions found yet' });
        }

        const totalSubscriptions = await subscriptionModel.countDocuments(); // Get total subscriptions

        res.json({
            message: 'Subscriptions retrieved successfully',
            subscriptions,
            page: parseInt(page),
            totalPages: Math.ceil(totalSubscriptions / limit),
            totalItems: totalSubscriptions
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'An error occurred while retrieving subscriptions' });
    }
}

module.exports = getSubscriptions;