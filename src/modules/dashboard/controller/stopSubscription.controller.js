const userModel = require('../../../../DB/models/user.model')
const subscriptionModel = require('../../../../DB/models/subscription.model')

const stopSubscription = async (req, res) => {
    const { userId } = req.params // get deviceId from URL params

    try {
        // Find a subscription by id
        let subscription = await subscriptionModel.findOne({ userId })

        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        // Toggle the activation status of the subscription
        subscription.isActive = !subscription.isActive;
        await subscription.save();

        // Find the user by id
        let user = await userModel.findById(userId)

        // Toggle the activation status of the user
        user.isSubscribed = !user.isSubscribed;
        await user.save();

        res.json({ message: 'Subscription activation status updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = stopSubscription;