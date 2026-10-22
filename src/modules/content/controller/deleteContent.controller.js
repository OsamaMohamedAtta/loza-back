const contentModel = require('../../../../DB/models/content.model')

const deleteContent = async (req, res) => {
    try {
        const { contentID } = req.params;

        // Find the content by id and delete
        const content = await contentModel.findByIdAndDelete(contentID)

        return res.status(201).json({ message: 'Content deleted successfully', content });
    } catch (err) {
        console.error('Error in updated the content:', err.message);
        return res.status(500).json({ message: 'An internal server error occurred while deleting the content. Please try again later' });
    }
}

module.exports = deleteContent;