const mongoose = require('mongoose');

const codeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    playlist: { type: String, required: true },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Reseller' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isUsed: { type: Boolean, default: false }
});

const codeModel = mongoose.model('Code', codeSchema)
module.exports = codeModel;