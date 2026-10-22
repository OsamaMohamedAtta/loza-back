const userModel = require('../../../../DB/models/user.model')
const demoModel = require('../../../../DB/models/demo.model')
const moment = require('moment-timezone');
const generateDeviceKey = require('../../../services/generateDeviceKey')

const checkMac = async (req, res) => {
    const { macAddress, type } = req.body;

    try {
        // Find a user by MAC address
        let user = await userModel.findOne({ macAddress }).populate('playlists');

        // Get a demo playlist link
        const demo = await demoModel.find();

        if (user) {
            // If the subscription has expired or is not yet started, return the user data with isSubscribed = false
            if (!user.isSubscribed && !user.isTrialActive) {
                return res.status(400).json({
                    message: 'Subscription has expired or not yet started',
                    _id: user._id,
                    macAddress: user.macAddress,
                    deviceKey: user.deviceKey,
                    isSubscribed: user.isSubscribed,
                    isTrialActive: user.isTrialActive
                });
            }

            const currentDate = moment.tz('Africa/Cairo');

            // Parse the user's start and end dates using Egypt time zone
            const startDate = moment.tz(user.startDate, 'Africa/Cairo');
            const endDate = moment.tz(user.endDate, 'Africa/Cairo');

            // Check if the current date is between the start and end dates
            const isActive = currentDate.isBetween(startDate, endDate, null, '[]');

            if (isActive) {
                // If the subscription is active, return the user data with isSubscribed = true
                return res.json({
                    message: 'User found and subscription is active',
                    _id: user._id,
                    macAddress: user.macAddress,
                    deviceKey: user.deviceKey,
                    startDate: user.startDate,
                    endDate: user.endDate,
                    isSubscribed: user.isSubscribed,
                    isTrialActive: user.isTrialActive,
                    playlists: user.playlists,
                    demoPlaylist: demo.length == 0 ? null : demo[0].url
                });
            } else {
                // Convert isSubscribed or isTrialActive to false
                user.isSubscribed = false
                user.isTrialActive = false
                await user.save()

                // If the subscription has expired or is not yet started, return the user data with isSubscribed = false
                return res.status(400).json({
                    message: 'Subscription has expired or not yet started',
                    _id: user._id,
                    macAddress: user.macAddress,
                    deviceKey: user.deviceKey,
                    isSubscribed: user.isSubscribed,
                    isTrialActive: user.isTrialActive
                });
            }
        } else {
            // If no user is found, create a new user
            const deviceKey = generateDeviceKey();
            let startDate = moment.tz('Africa/Cairo');
            let endDate = startDate.clone().add(1, 'weeks'); // Set end date to 1 weeks after the start date

            // Convert the date format to YYYY-MM-DD
            startDate = moment(startDate).format("YYYY-MM-DD")
            endDate = moment(endDate).format("YYYY-MM-DD")

            const newUser = new userModel({
                macAddress,
                deviceKey,
                type,
                startDate: startDate,
                endDate: endDate,
                parentPIN: '0000'
            });

            // Save the new user to the database
            await newUser.save();

            // Return the new user's data
            return res.status(201).json({
                message: 'New user created',
                _id: newUser._id,
                macAddress: newUser.macAddress,
                deviceKey: newUser.deviceKey,
                startDate: newUser.startDate,
                endDate: newUser.endDate,
                isTrialActive: true,
                isSubscribed: false,
                playlists: [],
                demoPlaylist: demo.length == 0 ? null : demo[0].url
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = checkMac;