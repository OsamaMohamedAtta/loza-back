const apiKeyModel = require('../../../../DB/models/apiKey.model')

const getPublishableKey = async (req, res) => {
    try {
        const apiKey = await apiKeyModel.find().select('');

        if (apiKey.length == 0) {
            return res.status(404).json({ message: 'There is no any payment key yet' });
        }

        res.json({ message: 'Payment keys get successfully', key: apiKey[0].publishableKey });
    } catch (err) {
        return res.status(500).json({ message: 'An internal server error occurred while get the faq. Please try again later' });
    }
}

module.exports = getPublishableKey;