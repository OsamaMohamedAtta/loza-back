const faqModel = require('../../../../DB/models/faq.model')

const deleteFaq = async (req, res) => {
    try {
        const { faqID } = req.params;

        // Find the faq by id and delete
        const faq = await faqModel.findByIdAndDelete(faqID)

        // Get all faq after delete the data
        const allFaq = await faqModel.find()
        res.json({ message: 'Faq deleted successfully', faq, allFaq });
    } catch (err) {
        console.error('Error in updated the faq:', err.message);
        return res.status(500).json({ message: 'An internal server error occurred while deleting the faq. Please try again later' });
    }
}

module.exports = deleteFaq;