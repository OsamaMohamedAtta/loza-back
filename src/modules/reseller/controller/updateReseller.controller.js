const resellerModel = require('../../../../DB/models/reseller.model')

const updateReseller = async (req, res) => {
    const { resellerId } = req.params // get resellerId from the params
    const { email, userName, subscriptionsNum, password } = req.body;

    try {
        // Find a reseller by id
        let reseller = await resellerModel.findById(resellerId)

        if (!reseller) {
            return res.status(404).json({ message: 'Reseller not found' });
        }

        if (password == '') {
            password = reseller.password;
        }

        // Find a reseller by id and update the data
        await resellerModel.findByIdAndUpdate(resellerId, { email, password, userName, subscriptionsNum });

        res.json({ message: 'Reseller info upadated success' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = updateReseller;