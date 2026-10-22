const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
    service: {
        type: String,
        type: { type: String, enum: ['stripe', 'paypal'], default: 'stripe' }, // The type of the payment 
    },
    publishableKey: {
        type: String,
        required: true
    },
    secretKey: {
        type: String,
        required: true
    }
});

const apiKeyModel = mongoose.model('ApiKey', apiKeySchema)
module.exports = apiKeyModel;