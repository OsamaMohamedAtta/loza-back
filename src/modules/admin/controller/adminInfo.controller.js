const adminModel = require('../../../../DB/models/admin.model')

const adminInfo = async (req, res) => {
    const adminId = req.userData._id // get adminId from middleware authorization

    try {
        const admin = await adminModel.findById(adminId).select('userName email')

        // Check if admin not found
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.json({ message: 'User info fetched successfully', info: admin });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = adminInfo;