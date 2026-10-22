const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
    title: String,
    desc: String
});

const contentModel = mongoose.model('Content', contentSchema)
module.exports = contentModel;