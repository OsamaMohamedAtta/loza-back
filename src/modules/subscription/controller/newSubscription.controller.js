const userModel = require('../../../../DB/models/user.model')
const subscriptionModel = require('../../../../DB/models/subscription.model')
const moment = require('moment-timezone');

const newSubscription = async (req, res) => {
    const userId = req.userData._id // get userId from middleware authorization
    const { subscriptionType, cost } = req.body;

    if (!['lifetime', 'yearly'].includes(subscriptionType)) {
        return res.status(400).json({ message: 'Invalid subscription type' });
    }

    try {
        // Check if the user exists
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found. Please check the user ID' });
        }

        let currentDate = moment.tz('Africa/Cairo');
        let endData;

        // Calculate the subscription end date based on the subscription type
        if (subscriptionType === 'lifetime') {
            endData = currentDate.clone().add(100, 'years').toDate(); // Lifetime subscriptions don't have an end date
        } else if (subscriptionType === 'yearly') {
            endData = currentDate.clone().add(1, 'years').toDate();
        }

        // Convert the date format to YYYY-MM-DD
        currentDate = moment(currentDate).format("YYYY-MM-DD")
        endData = moment(endData).format("YYYY-MM-DD")

        // Get the current time in HH:mm:ss format
        const currentTime = moment().format("HH:mm:ss");

        // Create a new subscription for the user
        const subscription = new subscriptionModel({
            userId: user._id,
            subscriptionType,
            subscriptionStartDate: currentDate,
            subscriptionEndDate: endData,
            cost,
            time: currentTime
        });

        // Update user subscription status
        const updatedUser = {
            ...user.toObject(),  // Convert the Mongoose document to a plain object
            startDate: currentDate,
            endDate: endData,
            isSubscribed: true,
            isTrialActive: false,
        };
        await userModel.findByIdAndUpdate(userId, updatedUser);

        // Save the new subscription
        await subscription.save();

        res.json({ message: 'Subscription started successfully', subscription });
    } catch (err) {
        console.error('Error creating subscription:', err.message);
        res.status(500).json({ message: 'An internal server error occurred while starting the subscription. Please try again later' });
    }
};

module.exports = newSubscription;