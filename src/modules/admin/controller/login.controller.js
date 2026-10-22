const adminModel = require('../../../../DB/models/admin.model')
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find a admin by their email and password
        const admin = await adminModel.findOne({ email, password });

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (admin.role != 'Admin') {
            return res.status(400).json({ message: 'You do not have permission to perform this operation' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: admin._id }, process.env.TOKEN_SECRET_KEY);

        // Send success response with token
        res.json({ message: "Admin login success", token });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = login;