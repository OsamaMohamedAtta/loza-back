const footerContentModel = require('../../../../DB/models/footerContent.model')

const getFooterContent = async (req, res) => {
    try {
        const { page } = req.query
        const footerContent = await footerContentModel.findOne({ page })

        return res.status(201).json({ message: 'Content get successfully', footerContent });
    } catch (err) {
        console.error('Error in get the content:', err.message);
        return res.status(500).json({ message: 'An internal server error occurred while get the content. Please try again later' });
    }
}

module.exports = getFooterContent;