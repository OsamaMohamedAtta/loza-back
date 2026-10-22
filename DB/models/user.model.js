const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    macAddress: { type: String, required: true, unique: true },
    deviceKey: { type: String, required: true },
    parentPIN: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    isSubscribed: { type: Boolean, default: false }, // To check if he is a subscriber
    isTrialActive: { type: Boolean, default: true },
    type: { type: String, enum: ['samsung', 'lg', 'android', 'ios', 'android_tv']}, // The type of the device 
    role: { type: String, default: 'User' },
    playlists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Playlist' }]
});

const userModel = mongoose.model('User', userSchema)
module.exports = userModel;