const faqModel = require('../../../../DB/models/faq.model')

const updateFaq = async (req, res) => {
    try {
        const { faqID } = req.params;
        const { question, answer } = req.body;

        // Find the faq by id and update the data
        const faq = await faqModel.findByIdAndUpdate(faqID, { question, answer }, { new: true })

        // Get all faq after update the data
        const allFaq = await faqModel.find()
        res.json({ message: 'Faq updated successfully', faq, allFaq });
    } catch (err) {
        console.error('Error in updated the faq:', err.message);
        return res.status(500).json({ message: 'An internal server error occurred while updating the faq. Please try again later' });
    }
}

module.exports = updateFaq;