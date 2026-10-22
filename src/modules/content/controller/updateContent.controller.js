const contentModel = require('../../../../DB/models/content.model')

const updateContent = async (req, res) => {
    try {
        const { contentID } = req.params;
        const { title, desc } = req.body;

        // Find the content by id and update the data
        const content = await contentModel.findByIdAndUpdate(contentID, { title, desc }, { new: true })

        return res.status(201).json({ message: 'Content updated successfully', content });
    } catch (err) {
        console.error('Error in updated the content:', err.message);
        return res.status(500).json({ message: 'An internal server error occurred while updating the content. Please try again later' });
    }
}

module.exports = updateContent;