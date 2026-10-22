const notificationModel = require('../../../../DB/models/notification.model')

const remove = async (req, res) => {
    const { id } = req.params;  // Get notification ID from URL parameters

    try {
        // Find the notification
        const notification = await notificationModel.findByIdAndDelete(id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        // Return success response with updated notification
        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports = remove;