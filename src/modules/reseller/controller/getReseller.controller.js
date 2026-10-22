const resellerModel = require('../../../../DB/models/reseller.model')

const getResellers = async (req, res) => {
    try {
        // Fetch all resellers of the user
        const allResellers = await resellerModel.find().select('-password -role -subscriptions').sort({ _id: -1 });

        res.json({
            message: 'Resellers fetched successfully',
            allResellers
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = getResellers;