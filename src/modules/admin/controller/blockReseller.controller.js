const resellerModel = require('../../../../DB/models/reseller.model')

const blockReseller = async (req, res) => {
    const { resellerId } = req.params // get resellerId from URL params

    try {
        // Find a reseller by id
        let reseller = await resellerModel.findById(resellerId)

        if (!reseller) {
            return res.status(404).json({ message: 'Reseller not found' });
        }

        // Toggle the block status of the reseller
        reseller.block = !reseller.block;
        await reseller.save();

        res.json({ message: 'Reseller block status updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = blockReseller;