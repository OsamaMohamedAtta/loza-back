const userModel = require('../../../../DB/models/user.model')

const userInfo = async (req, res) => {
    const userId = req.userData._id // get userId from middleware authorization

    try {
        const user = await userModel.findById(userId)

        // Check if user not found
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user not subscribed
        if (!user.isSubscribed) {
            return res.json({
                message: 'User info fetched successfully',
                macAddress: user.macAddress,
                isSubscribed: user.isSubscribed,
            });
        }

        res.json({
            message: 'User info fetched successfully',
            macAddress: user.macAddress,
            startDate: user.startDate,
            endDate: user.endDate,
            isSubscribed: user.isSubscribed,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = userInfo