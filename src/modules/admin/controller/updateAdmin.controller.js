const adminModel = require('../../../../DB/models/admin.model')

const updateAdmin = async (req, res) => {
    const adminId = req.userData._id // get adminId from middleware authorization
    const { email, password, userName } = req.body;

    try {
        // Find a admin by id and update the data
        let admin = await adminModel.findByIdAndUpdate(adminId, { email, password, userName }, { new: true })

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.json({ message: 'Admin info upadated success' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = updateAdmin;