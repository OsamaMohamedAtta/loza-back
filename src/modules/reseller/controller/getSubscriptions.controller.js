const subscriptionModel = require('../../../../DB/models/subscription.model')

const getSubscriptions = async (req, res) => {
    const { page = 1 } = req.query;
    const limit = 20; // Number of items per page
    const skip = (page - 1) * limit; // Calculate number of items to skip
    const resellerId = req.userData._id // get resellerId from middleware authorization

    try {
        // Get all reseller Subscriptions
        const subscriptions = await subscriptionModel.find({ subscriptionBy: resellerId }).sort({ _id: -1 }).skip(skip).limit(limit).populate({
            path: 'userId', // Populate user field
            select: 'macAddress type'
        });

        // If there are no subscriptions in the date range
        if (subscriptions.length === 0) {
            return res.status(404).json({ message: 'No subscriptions found yet' });
        }

        const totalSubscriptions = await subscriptionModel.countDocuments({ subscriptionBy: resellerId }); // Get total subscriptions

        return res.json({
            message: 'Subscriptions retrieved successfully',
            subscriptions,
            page: parseInt(page),
            totalPages: Math.ceil(totalSubscriptions / limit),
            totalItems: totalSubscriptions,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = getSubscriptions;