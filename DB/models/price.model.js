const mongoose = require('mongoose');

const priceSchema = new mongoose.Schema({
    price: {
        type: Number,
        required: true
    },
});

const priceModel = mongoose.model('Price', priceSchema)
module.exports = priceModel;