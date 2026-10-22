const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: String,
    desc: String,
    expireAt: { type: Date, required: true },
});

const notificationModel = mongoose.model('Notification', notificationSchema)
module.exports = notificationModel;