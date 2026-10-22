const resellerModel = require('../../../../DB/models/reseller.model')
const userModel = require('../../../../DB/models/user.model')
const subscriptionModel = require('../../../../DB/models/subscription.model')
const moment = require('moment-timezone');

const newSubscription = async (req, res) => {
    const { macAddress, credit } = req.body;
    const resellerId = req.userData._id // get resellerId from middleware authorization

    try {
        // Find a reseller by id
        let reseller = await resellerModel.findById(resellerId)

        if (reseller.subscriptionsNum <= 0) {
            return res.status(400).json({ message: 'Your subscriptions have expired. You cannot add a new subscriber' });
        }

        // Find a user by MAC address
        let user = await userModel.findOne({ macAddress }).populate('playlists');

        if (!user) {
            return res.status(404).json({ message: 'This MAC address does not exist' });
        }

        let currentDate = moment.tz('Africa/Cairo');
        let endData = currentDate.clone().add(1, 'years').toDate();

        if (credit == 'Life Time') {
            endData = '3025-04-25'
        }

        // Convert the date format to YYYY-MM-DD
        currentDate = moment(currentDate).format("YYYY-MM-DD")
        endData = moment(endData).format("YYYY-MM-DD")

        // Get the current time in HH:mm:ss format
        const currentTime = moment().format("HH:mm:ss");

        // Create a new subscription for the user
        const subscription = new subscriptionModel({
            userId: user._id,
            subscriptionType: "yearly",
            subscriptionStartDate: currentDate,
            subscriptionEndDate: endData,
            cost: 0,
            time: currentTime,
            subscriptionBy: resellerId
        });

        // Update user subscription status
        const updatedUser = {
            ...user.toObject(),  // Convert the Mongoose document to a plain object
            startDate: currentDate,
            endDate: endData,
            isSubscribed: true,
            isTrialActive: false,
        };
        await userModel.findByIdAndUpdate(user._id, updatedUser);

        // Save the new subscription
        await subscription.save();

        // Update the subscriptions number
        if (credit == 'Life Time') {
            reseller.subscriptionsNum = reseller.subscriptionsNum - 2
        } else {
            reseller.subscriptionsNum = reseller.subscriptionsNum - 1
        }
        await reseller.save();

        res.json({ message: 'Subscription started successfully', subscription });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = newSubscription;
