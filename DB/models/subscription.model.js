const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subscriptionType: { type: String, enum: ['lifetime', 'yearly'], required: true },
    subscriptionStartDate: { type: String },
    subscriptionEndDate: { type: String },
    isActive: { type: Boolean, default: true },
    cost: { type: Number, required: true }, // field for cost of subscription
    time: String,
    subscriptionBy: { type: String },
});

const subscriptionModel = mongoose.model('Subscription', subscriptionSchema)
module.exports = subscriptionModel;