const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    userName: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'Admin' },
});

const adminModel = mongoose.model('Admin', adminSchema)
module.exports = adminModel;