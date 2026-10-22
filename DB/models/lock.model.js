const mongoose = require('mongoose');

const lockSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: { type: String, required: true },
    type: { type: String, enum: ['movie', 'series', 'channel'], required: true },
    isLocked: { type: Boolean, default: true },
    link: { type: String, required: true },
    playlistLink: { type: String, required: true }
});

const lockModel = mongoose.model('Lock', lockSchema)
module.exports = lockModel