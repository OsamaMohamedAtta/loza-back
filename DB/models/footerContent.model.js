const mongoose = require('mongoose');

const footerContentSchema = new mongoose.Schema({
    content: { type: String },
    page: { type: String, enum: ['Privacy_Policy', 'Terms_Conditions'], required: true },
});

const footerContentModel = mongoose.model('FooterContent', footerContentSchema)
module.exports = footerContentModel;