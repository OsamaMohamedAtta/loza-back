const demoModel = require('../../../../DB/models/demo.model')

const getDemo = async (req, res) => {
    try {
        const demo = await demoModel.find();

        if (demo.length == 0) {
            return res.status(404).json({ message: 'There is no any demo playlist yet' });
        }

        res.json({ message: 'Demo playlist get successfully', demo: demo[0] });
    } catch (err) {
        return res.status(500).json({ message: 'An internal server error occurred while get the faq. Please try again later' });
    }
}

module.exports = getDemo;