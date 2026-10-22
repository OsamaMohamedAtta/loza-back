const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
    name: { type: String, required: true },  // Name of the playlist
    url: { type: String, required: true },  // URL of the playlist
    password: { type: String },  // Optional password for the playlist
    isActive: { type: Boolean, default: false },
    isProtected: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } 
});

const playlistModel = mongoose.model('Playlist', playlistSchema)
module.exports = playlistModel