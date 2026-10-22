const faqModel = require('../../../../DB/models/faq.model')

const getFaq = async (req, res) => {
    try {
        const allFaq = await faqModel.find()

        res.json({ message: 'Faq get successfully', allFaq });
    } catch (err) {
        console.error('Error in get the faq:', err.message);
        return res.status(500).json({ message: 'An internal server error occurred while get the faq. Please try again later' });
    }
}

module.exports = getFaq;