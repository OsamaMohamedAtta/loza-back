const resellerModel = require('../../../../DB/models/reseller.model')

const resellerInfo = async (req, res) => {
    const resellerId = req.userData._id // get resellerId from middleware authorization

    try {
        const reseller = await resellerModel.findById(resellerId).select('userName email subscriptionsNum');

        // Check if reseller not found
        if (!reseller) {
            return res.status(404).json({ message: 'Reseller not found' });
        }

        res.json({ message: 'User info fetched successfully', info: reseller });
    } catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = resellerInfo;