const contentModel = require('../../../../DB/models/content.model')

const addContent = async (req, res) => {
    try {
        const { title, desc } = req.body;

        // Create a new contact for the user dashboard
        const content = new contentModel({
            title,
            desc
        });

        // Save the new content
        await content.save();

        return res.status(201).json({ message: 'Content saved successfully', content });
    } catch (err) {
        console.error('Error in saved the content:', err.message);
        return res.status(500).json({ message: 'An internal server error occurred while saving the content. Please try again later' });
    }
}

module.exports = addContent;