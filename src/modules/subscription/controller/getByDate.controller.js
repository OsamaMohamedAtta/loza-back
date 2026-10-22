const subscriptionModel = require('../../../../DB/models/subscription.model')
const moment = require('moment-timezone');

const getByDate = async (req, res) => {
    const { page = 1, date } = req.query; // Get page and date from query params
    const limit = 20; // Number of items per page
    const skip = (page - 1) * limit; // Calculate number of items to skip

    // Check the format of the entered date (example: YYYY-MM-DD)
    if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
        return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
    }

    try {
        // Get the user's subscription based on the specified date
        const subscriptions = await subscriptionModel.find({
            subscriptionStartDate: date
        }).sort({ _id: -1 })
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'userId', // Populate user field
                select: 'macAddress'
            });

        // If there are no subscriptions in the date range
        if (subscriptions.length === 0) {
            return res.status(404).json({ message: 'No subscriptions found for the provided date' });
        }

        // Get total subscriptions that is matching the query
        const totalSubscriptions = await subscriptionModel.countDocuments({
            subscriptionStartDate: date
        });

        res.json({
            message: 'Subscriptions retrieved successfully',
            subscriptions,
            page: parseInt(page),
            totalPages: Math.ceil(totalSubscriptions / limit),
            totalItems: totalSubscriptions,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'An error occurred while retrieving subscriptions' });
    }
}

module.exports = getByDate