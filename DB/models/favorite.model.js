const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['movie', 'series', 'live_channel'],
        required: true
    },
    link: {
        type: String,
        required: true
    },
    playlistLink: {
        type: String,
        required: true
    }
});

const favoriteModel = mongoose.model('Favorite', favoriteSchema)
module.exports = favoriteModel