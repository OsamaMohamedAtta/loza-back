const footerContentModel = require('../../../../DB/models/footerContent.model')

const addFooterContent = async (req, res) => {
    try {
        const { content, page } = req.body;

        const findContent = await footerContentModel.findOne({ page })
        if(findContent){
            findContent.content = content;
            await findContent.save()
            return res.json({ message: 'Content updated successfully', findContent });
        }

        // Create a new footer contact for the user dashboard
        const footerContent = new footerContentModel({
            content,
            page
        });

        // Save the new content
        await footerContent.save();

        res.status(201).json({ message: 'Content saved successfully', footerContent });
    } catch (err) {
        console.error('Error in saved the content:', err.message);
        return res.status(500).json({ message: 'An internal server error occurred while saving the content. Please try again later' });
    }
}

module.exports = addFooterContent;