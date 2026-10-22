const adminModel = require('../../../../DB/models/admin.model')

const register = async (req, res) => {
    const { email, password, userName } = req.body;

    try {
        // Find a admin by email
        let admin = await adminModel.findOne({ email })

        if (admin) {
            return res.status(400).json({ message: 'This account is already registerd' });
        }

        const newAdmin = new adminModel({
            email,
            password,
            userName
        });

        // Save the new admib to the database
        await newAdmin.save();
        res.status(201).json({ message: 'New admin created' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = register;