const mongoose = require('mongoose');

// One document per PayTabs checkout attempt. No card data is ever stored here.
const paymentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    cartId: { type: String, required: true, unique: true }, // Our order reference, sent to PayTabs as cart_id
    subscriptionType: { type: String, enum: ['lifetime', 'yearly'], required: true },
    amountMinor: { type: Number, required: true }, // Amount charged in minor units (piastres) to avoid float issues
    currency: { type: String, required: true }, // Currency charged (EGP)
    referencePriceUsd: { type: Number, required: true }, // Reference price shown on the website ($5 / $10)
    status: { type: String, enum: ['pending', 'paid', 'failed', 'cancelled', 'expired'], default: 'pending', index: true },
    tranRef: { type: String, unique: true, sparse: true }, // PayTabs transaction reference
    redirectUrl: { type: String },
    responseStatus: { type: String }, // Last verified PayTabs result (status codes only)
    responseCode: { type: String },
    responseMessage: { type: String },
    paidAt: { type: Date },
    lastCheckedAt: { type: Date },
    activation: {
        status: { type: String, enum: ['none', 'done'], default: 'none' },
        lockedAt: { type: Date, default: null },
        subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
        activatedAt: { type: Date }
    }
}, { timestamps: true });

const paymentModel = mongoose.model('Payment', paymentSchema)
module.exports = paymentModel;
