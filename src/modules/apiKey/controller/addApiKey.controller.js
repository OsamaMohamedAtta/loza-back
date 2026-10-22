const apiKeyModel = require('../../../../DB/models/apiKey.model')

const addApiKey = async (req, res) => {
    try {
        const { publishableKey, secretKey } = req.body;

        const oldKeys = await apiKeyModel.find()

        if (oldKeys.length != 0) {
            const keyID = oldKeys[0]._id;
            const newKey = await apiKeyModel.findByIdAndUpdate(keyID, { publishableKey, secretKey }, { new: true });
            return res.json({ message: 'Keys updated successfully', keys: newKey });
        }

        // Add a new demo playlist
        const Keys = new apiKeyModel({
            publishableKey,
            secretKey
        });

        // Save the new payment key
        const paymentKeys = await Keys.save();

        res.status(201).json({ message: 'Payment keys saved successfully', keys: paymentKeys });
    } catch (err) {
        return res.status(500).json({ message: 'An internal server error occurred while saving the faq. Please try again later' });
    }
}

module.exports = addApiKey;