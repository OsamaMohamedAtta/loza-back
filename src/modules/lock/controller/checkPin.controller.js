const userModel = require('../../../../DB/models/user.model')

const checkPin = async (req, res) => {
    // Extract userId and pin from the request body
    const { userId, pin } = req.body;

    try {
        const user = await userModel.findById(userId);

        // Check if the user exists
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Validate the provided PIN against the user's stored parent PIN
        if (user.parentPIN !== pin) {
            return res.status(400).json({ message: 'PIN is not correct' });
        }

        // If the PIN is correct, send a success response
        return res.json({ message: 'Success PIN' });
    } catch (error) {
        console.error('Error checking PIN:', error);
        return res.status(500).json({ message: 'An error occurred while fetching content status' });
    }
};

module.exports = checkPin