const userModel = require('../../../../DB/models/user.model')
const lockModel = require('../../../../DB/models/lock.model')

const lockContent = async (req, res) => {
    // Extract necessary data from the request body
    const { userId, name, type, link, playlistLink } = req.body;

    try {
        // Check if the user exists and has a Parent PIN set
        const user = await userModel.findById(userId);
        if (!user || !user.parentPIN) {
            return res.status(400).json({ message: 'You must add a Parent PIN first' });
        }

        // Check if the content is already locked for the user
        const existingContent = await lockModel.findOne({ userId, link, playlistLink });

        if (existingContent) {
            // Toggle the lock status of the existing content
            existingContent.isLocked = !existingContent.isLocked;
            await existingContent.save(); // Save the updated content

            return res.json({ message: 'Content lock status updated successfully', content: existingContent });
        }

        // Create a new lock instance if the content does not exist
        const newContent = new lockModel({
            userId,
            name,
            type,
            link,
            playlistLink
        });

        // Save the new content lock to the database
        await newContent.save();

        return res.json({ message: 'Content locked successfully', content: newContent });
    } catch (error) {
        console.error('Error locking content:', error);
        return res.status(500).json({ message: 'An error occurred while locking the content' });
    }
};

module.exports = lockContent