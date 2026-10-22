const userModel = require('../../../../DB/models/user.model')
const apiKeyModel = require('../../../../DB/models/apiKey.model')

const paymentIntent = async (req, res) => {
    const { amount, macAddress } = req.body;

    try {
        // Find a user by MAC address
        let user = await userModel.findOne({ macAddress })
        if (!user) {
            return res.status(404).json({ message: 'There is no user found with this MAC address' });
        }

        // Check if there is a payment method
        const apiKey = await apiKeyModel.find();
        if (apiKey.length == 0) {
            return res.status(404).json({ message: 'There is no any payment method yet' });
        }

        const stripe = require('stripe')(apiKey[0].secretKey);
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'eur', // it was usd
        });

        console.log(paymentIntent);

        res.send({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = paymentIntent;