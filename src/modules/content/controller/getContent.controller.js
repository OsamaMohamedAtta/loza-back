const contentModel = require('../../../../DB/models/content.model')

const getContent = async (req, res) => {
    try {
        const content = await contentModel.find()

        return res.status(201).json({ message: 'Content get successfully', content });
    } catch (err) {
        console.error('Error in get the content:', err.message);
        return res.status(500).json({ message: 'An internal server error occurred while get the content. Please try again later' });
    }
}

module.exports = getContent;