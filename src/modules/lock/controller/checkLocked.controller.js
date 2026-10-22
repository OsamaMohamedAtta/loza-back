const lockModel = require('../../../../DB/models/lock.model')

const checkLocked = async (req, res) => {
    // Extract userId, link, and playlistLink from the query parameters
    const { userId, link, playlistLink } = req.query;

    try {
        const content = await lockModel.findOne({ userId, link, playlistLink });

        // If no content is found, respond with a 404 status and a message
        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }

        // If content is found, respond with the lock status and additional details about the content
        return res.json({
            isLocked: content.isLocked,
            title: content.name,
            type: content.type,
        });
    } catch (error) {
        console.error('Error fetching content status:', error);
        return res.status(500).json({ message: 'An error occurred while fetching content status' });
    }
};

module.exports = checkLocked