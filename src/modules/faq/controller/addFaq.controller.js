const faqModel = require('../../../../DB/models/faq.model')

const addFaq = async (req, res) => {
    try {
        const { question, answer } = req.body;

        // Create a new faq for the user dashboard
        const faq = new faqModel({
            question,
            answer
        });

        // Save the new faq
        await faq.save();

        // Get all faq after add the data
        const allFaq = await faqModel.find()
        res.status(201).json({ message: 'Faq saved successfully', faq, allFaq });
    } catch (err) {
        console.error('Error in saved the faq:', err.message);
        return res.status(500).json({ message: 'An internal server error occurred while saving the faq. Please try again later' });
    }
}

module.exports = addFaq;