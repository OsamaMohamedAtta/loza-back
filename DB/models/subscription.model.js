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
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }, // Set only for PayTabs purchases
    amountPaid: { type: Number }, // Amount actually charged (e.g. 250.00), cost keeps the reference price
    currency: { type: String }, // Currency actually charged (e.g. EGP)
});

// One subscription record per payment, so duplicate PayTabs callbacks can never create two
subscriptionSchema.index({ payment: 1 }, { unique: true, partialFilterExpression: { payment: { $type: 'objectId' } } });

const subscriptionModel = mongoose.model('Subscription', subscriptionSchema)
module.exports = subscriptionModel;