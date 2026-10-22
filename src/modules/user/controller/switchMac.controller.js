const userModel = require('../../../../DB/models/user.model')

const switchMac = async (req, res) => {
    const userId = req.userData._id // get userId from middleware authorization
    const { macAddress } = req.body;

    try {
        // Find a user by MAC address
        let newUser = await userModel.findOne({ macAddress });

        if (!newUser) {
            return res.status(404).json({ message: 'There is no device with this MAC address' });
        }

        const oldUser = await userModel.findById(userId);
        const { deviceKey } = oldUser;
        const mac_address = oldUser.macAddress;
        await userModel.findByIdAndUpdate(newUser._id, { macAddress: "", deviceKey: "" })
        oldUser.macAddress = newUser.macAddress;
        oldUser.deviceKey = newUser.deviceKey;
        await oldUser.save();
        newUser.macAddress = mac_address;
        newUser.deviceKey = deviceKey;
        await newUser.save();

        res.json({ message: 'Mac address switched successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports = switchMac;