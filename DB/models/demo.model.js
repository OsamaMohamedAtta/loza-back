const mongoose = require('mongoose');

const demoSchema = new mongoose.Schema({
    url: { type: String, required: true }
});

const demoModel = mongoose.model('Demo', demoSchema)
module.exports = demoModel;