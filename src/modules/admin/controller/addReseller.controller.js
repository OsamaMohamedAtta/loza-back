const resellerModel = require('../../../../DB/models/reseller.model')
const moment = require('moment-timezone');

const addReseller = async (req, res) => {
    const { email, password, userName, subscriptionsNum } = req.body;

    try {
        // Find a reseller by email
        let reseller = await resellerModel.findOne({ email })

        if (reseller) {
            return res.status(400).json({ message: 'This is email already register' });
        }

        let currentDate = moment.tz('Africa/Cairo').format("YYYY-MM-DD");

        const newReseller = new resellerModel({
            email,
            password,
            userName,
            subscriptionsNum,
            currentDate
        });

        // Save the new reseller to the database
        await newReseller.save();
        res.status(201).json({ message: 'New reseller account created' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = addReseller;