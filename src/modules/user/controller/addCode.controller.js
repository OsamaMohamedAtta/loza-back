const userModel = require('../../../../DB/models/user.model')
const codeModel = require('../../../../DB/models/code.model')
const playlistModel = require('../../../../DB/models/playlist.model')
const subscriptionModel = require('../../../../DB/models/subscription.model')
const moment = require('moment-timezone');

const addCode = async (req, res) => {
    const { macAddress, code } = req.body;

    try {
        // Find a user by MAC address
        let user = await userModel.findOne({ macAddress })
        if (!user) {
            return res.status(404).json({ message: 'There is no user found with this MAC address' });
        }

        const findCode = await codeModel.findOne({ code });
        if (!findCode) {
            return res.status(404).json({ message: 'There is no matching code' });
        }

        if (findCode.isUsed) {
            return res.status(400).json({ message: 'This code has been used before' });
        }

        // Create the new playlist
        const newPlaylist = new playlistModel({
            name: 'playlist',
            url: findCode.playlist,
            password: undefined,
            isActive: true,
            userId: user._id,  // Assign the playlist to the user
        });

        // Save the new playlist to the database
        await newPlaylist.save();

        // Fetch all playlists of the user who owns this playlist
        const allPlaylists = await playlistModel.find({ userId: user._id })

        // Iterate over all playlists to set them to inactive if they are not the activated playlist
        for (let index = 0; index < allPlaylists.length; index++) {
            const element = allPlaylists[index];
            if (element._id.toString() !== newPlaylist._id.toString()) {
                element.isActive = false;
                await element.save();
            }
        }

        // Add the new playlist's ID to the user's playlists array
        user.playlists.push(newPlaylist._id);
        await user.save();

        // Create the one-year subscription
        let currentDate = moment.tz('Africa/Cairo');
        let endData = currentDate.clone().add(1, 'years').toDate();

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
            subscriptionBy: findCode.generatedBy
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

        // Update the code data
        if(code != '09870297'){
            findCode.isUsed = true;
            findCode.userId = user._id;
            await findCode.save();
        }

        res.json({ message: 'Subscription started successfully', subscription });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = addCode;