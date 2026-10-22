const notificationModel = require('../../../../DB/models/notification.model')

const create = async (req, res) => {
    try {
        // Create the new notification
        const newNotification = new notificationModel(req.body);

        // Save the new notification to the database
        await newNotification.save();

        res.json({ message: 'Notification created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports = create;