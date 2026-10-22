const notificationModel = require('../../../../DB/models/notification.model')

const update = async (req, res) => {
    const { title, desc, expireAt } = req.body;
    const { id } = req.params;  // Get notification ID from URL parameters

    try {
        // Find the notification
        const notification = await notificationModel.findById(id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        // Update notification details
        notification.title = title || notification.title;
        notification.desc = desc || notification.desc;
        notification.expireAt = expireAt || notification.expireAt;

        // Save the updated notification
        await notification.save();

        // Return success response with updated notification
        res.json({ message: 'Notification update successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports = update;