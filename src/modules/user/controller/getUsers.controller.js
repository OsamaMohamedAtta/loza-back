const userModel = require('../../../../DB/models/user.model')

const getUsers = async (req, res) => {
    const { page = 1 } = req.query; // Get page query params
    const limit = 20; // Number of items per page
    const skip = (page - 1) * limit; // Calculate number of items to skip

    try {
        const users = await userModel.find().sort({ _id: -1 }).skip(skip).limit(limit).select('-role -startDate -deviceKey -parentPIN').populate({
            path: 'playlists',
            match: { isActive: true }, // Only include playlists where active is true
            select: 'url',
        });

        // Check if there is no any device
        if (users.length == 0) {
            return res.status(404).json({ message: 'There is no any device' });
        }

        const totalDevices = await userModel.countDocuments(); // Get total devices

        res.json({
            message: 'Users fetched successfully',
            users,
            page: parseInt(page),
            totalPages: Math.ceil(totalDevices / limit),
            totalItems: totalDevices,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = getUsers;