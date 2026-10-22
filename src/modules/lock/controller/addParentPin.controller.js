const userModel = require('../../../../DB/models/user.model')

const addParentPin = async (req, res) => {
    const { pin } = req.body
    const userId = req.userData._id // get userId from middleware authorization

    try {
        const user = await userModel.findById(userId)

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.parentPIN != pin) {
            return res.status(400).json({ message: 'The current PIN is incorrect. Please check and try again' });
        }

        // Added the new parent PIN for this user
        user.parentPIN = pin
        await user.save()

        res.json({ message: 'Parent PIN added successfully' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = addParentPin