const subscriptionModel = require('../../../../DB/models/subscription.model')
const normalizeMacAddress = require('../../../services/normalizeMacAddress'); 

const searchByMac = async (req, res) => {
    const { macAddress } = req.query; // Get MAC address from query params
    try {
        const normalizedMacAddress = normalizeMacAddress(macAddress);

        // Get all subscriptions filtered by macAddress
        const subscriptions = await subscriptionModel.find()
            .sort({ _id: -1 })
            .skip(0)
            .limit(20)
            .populate({
                path: 'userId', // Populate user field
                select: 'macAddress type',
                match: {
                    macAddress: { $regex: new RegExp(normalizedMacAddress, 'i') } // Case-insensitive regex match
                }
            });

        const filteredSubscriptions = subscriptions.filter(subscription => subscription.userId);

        // If there are no subscriptions for the provided MAC address
        if (filteredSubscriptions.length === 0) {
            return res.status(404).json({ message: 'No subscriptions found for the provided MAC address' });
        }

        res.json({
            message: 'Subscriptions retrieved successfully',
            subscriptions: filteredSubscriptions
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = searchByMac;