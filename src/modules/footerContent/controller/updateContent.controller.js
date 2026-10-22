const footerContentModel = require('../../../../DB/models/footerContent.model')

const updateFooterContent = async (req, res) => {
    try {
        const { contentID } = req.params;
        const { content, page } = req.body;

        // Find the footer content by id and update the data
        const footerContent = await footerContentModel.findByIdAndUpdate(contentID, { content, page }, { new: true })

        return res.status(201).json({ message: 'Content updated successfully', footerContent });
    } catch (err) {
        console.error('Error in updated the content:', err.message);
        return res.status(500).json({ message: 'An internal server error occurred while updating the content. Please try again later' });
    }
}

module.exports = updateFooterContent;