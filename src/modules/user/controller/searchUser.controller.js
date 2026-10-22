const userModel = require('../../../../DB/models/user.model')
const normalizeMacAddress = require('../../../services/normalizeMacAddress');

const searchUser = async (req, res) => {
    const { macAddress } = req.query; // Get MAC address from query params

    try {
        const normalizedMacAddress = normalizeMacAddress(macAddress);

        const users = await userModel.find({
            macAddress: { $regex: new RegExp(normalizedMacAddress, 'i') } // Add the regex condition here
        }).sort({ _id: -1 })
            .skip(0)
            .limit(20)
            .select('-role -startDate -deviceKey -parentPIN')
            .populate({
                path: 'playlists',
                match: { isActive: true }, // Only include playlists where active is true
                select: 'url',
            });

        // Check if there is no any device
        if (users.length == 0) {
            return res.status(404).json({ message: 'No device found for the provided MAC address' });
        }

        res.json({
            message: 'User retrieved successfully',
            users
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = searchUser;