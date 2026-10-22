const demoModel = require('../../../../DB/models/demo.model')

const addDemo = async (req, res) => {
    try {
        const { url } = req.body;

        const oldDemo = await demoModel.find()

        if (oldDemo.length != 0) {
            const demoID = oldDemo[0]._id;
            const demo = await demoModel.findByIdAndUpdate(demoID, { url }, { new: true });
            return res.json({ message: 'Demo updated successfully', demo });
        }

        // Add a new demo playlist
        const demo = new demoModel({
            url
        });

        // Save the new demo playlist
        const playlist = await demo.save();

        res.status(201).json({ message: 'Playlist saved successfully', demo: playlist });
    } catch (err) {
        return res.status(500).json({ message: 'An internal server error occurred while saving the faq. Please try again later' });
    }
}

module.exports = addDemo;