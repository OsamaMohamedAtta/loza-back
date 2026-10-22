const resellerModel = require('../../../../DB/models/reseller.model')
const moment = require('moment-timezone');

const addSubReseller = async (req, res) => {
    const { email, password, userName, subscriptionsNum } = req.body;
    const resellerId = req.userData._id // get resellerId from middleware authorization

    try {
        // Find a reseller by resellerId
        let reseller = await resellerModel.findById(resellerId)

        if (!reseller) {
            return res.status(404).json({ message: 'This reseller not found' });
        }

        if (subscriptionsNum > reseller.subscriptionsNum) {
            return res.status(400).json({ message: 'The number of subscriptions does not meet the required threshold for this reseller' });
        }

        // Check if this email is already register
        const findSubReseller = await resellerModel.findOne({ email })
        if (findSubReseller) {
            return res.status(400).json({ message: 'This is email already register' });
        }

        let currentDate = moment.tz('Africa/Cairo').format("YYYY-MM-DD");

        const subReseller = new resellerModel({
            email,
            password,
            userName,
            subscriptionsNum,
            currentDate,
            role: 'subReseller',
            createdBy: resellerId
        });

        // Save the new subReseller to the database
        await subReseller.save();

        // Update the subscriptions number
        reseller.subscriptionsNum = reseller.subscriptionsNum - subscriptionsNum;
        await reseller.save();

        res.status(201).json({ message: 'New subReseller account created' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

module.exports = addSubReseller;