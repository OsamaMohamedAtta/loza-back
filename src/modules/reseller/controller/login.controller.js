const resellerModel = require('../../../../DB/models/reseller.model')
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find a reseller by their email and password
        const reseller = await resellerModel.findOne({ email, password });

        if (!reseller) {
            return res.status(404).json({ message: 'Reseller not found' });
        }

        if (reseller.role != 'Reseller' && reseller.role != 'subReseller') {
            return res.status(400).json({ message: 'You do not have permission to perform this operation' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: reseller._id }, process.env.TOKEN_SECRET_KEY);

        // Send success response with token
        res.json({ message: "Reseller login success", token, role: reseller.role });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = login;