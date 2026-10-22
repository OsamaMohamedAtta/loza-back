const notificationModel = require('../../../../DB/models/notification.model')

const get = async (req, res) => {
    try {
        // Find the notification
        let notifications = await notificationModel.find().sort({ _id: -1 }).lean().exec();

        if (notifications.length == 0) {
            return res.status(404).json({ message: 'There is no any notification yet' });
        }

        const currentDate = new Date();

        // Filter expired notifications
        notifications = notifications.filter(async (notification) => {
            const expireDate = new Date(notification.expireAt);
            if (currentDate > expireDate)
                await notificationModel.findByIdAndDelete(notification._id)
            return expireDate > currentDate;
        });

        // Return success response with updated notification
        res.json({ message: 'Notification updated successfully', notifications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports = get;