const resellerModel = require('../../../../DB/models/reseller.model')

const getSubReseller = async (req, res) => {
    const resellerId = req.userData._id // get resellerId from middleware authorization

    try {
        // Fetch all subResellers of the user
        const subResellers = await resellerModel.find({ createdBy: resellerId }).select('-password -role -subscriptions').sort({ _id: -1 });

        res.json({
            message: 'subResellers fetched successfully',
            subResellers
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = getSubReseller;