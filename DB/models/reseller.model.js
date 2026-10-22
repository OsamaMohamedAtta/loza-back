const mongoose = require('mongoose');

const resellerSchema = new mongoose.Schema({
    userName: { type: String },
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Reseller', 'subReseller'], default: 'Reseller' },
    block: { type: Boolean, default: false },
    subscriptionsNum: { type: Number, default: 0 },
    currentDate: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Reseller' } // This is for subReseller
});

const resellerModel = mongoose.model('Reseller', resellerSchema)
module.exports = resellerModel;