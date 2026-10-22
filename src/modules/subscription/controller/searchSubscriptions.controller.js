const userModel = require('../../../../DB/models/user.model')
const subscriptionModel = require('../../../../DB/models/subscription.model')

const searchSubscriptions = async (req, res) => {
    try {
        const { macAddress } = req.query;

        // Find the user by macAddress
        const user = await userModel.findOne({ macAddress })

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find the subscription for this user
        const subscriptions = await subscriptionModel.find({ userId: user._id }).sort({ _id: -1 }).populate({
            path: 'userId', // Populate user field
            select: 'macAddress' 
        });

        if (subscriptions.length == 0) {
            return res.status(404).json({ message: 'Subscriptions not found for this user' });
        }

        // Return the user details along with their subscription
        res.json({ subscriptions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports = searchSubscriptions