const codeModel = require('../../../../DB/models/code.model')
const resellerModel = require('../../../../DB/models/reseller.model')
const generateProviderCode = require('../../../services/generateProviderCode')

const generateCode = async (req, res) => {
    const { playlist } = req.body;
    const resellerId = req.userData._id // get resellerId from middleware authorization

    try {
        // Find a reseller by resellerId
        let reseller = await resellerModel.findById(resellerId)

        if (reseller.subscriptionsNum == 0) {
            return res.status(400).json({ message: 'Your subscriptions have expired. You cannot add a new code' });
        }

        let uniqueCode = '';
        let isUnique = false;

        // Continue generate a new code
        while (!isUnique) {
            uniqueCode = generateProviderCode();
            const existingCode = await codeModel.findOne({ code: uniqueCode });
            if (!existingCode) {
                isUnique = true;
            }
        }

        const newCode = new codeModel({ code: uniqueCode, generatedBy: resellerId, playlist });
        await newCode.save();

        reseller.subscriptionsNum = reseller.subscriptionsNum - 1;
        await reseller.save();

        // Send success response with the code
        res.json({ message: "New code generated success", code: uniqueCode });
    } catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = generateCode;