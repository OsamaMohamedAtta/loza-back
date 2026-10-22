const priceModel = require('../../../../DB/models/price.model')

const addPrice = async (req, res) => {
    try {
        const { price } = req.body;

        let findPrice = await priceModel.find()
        if (findPrice.length != 0) {
            const priceID = findPrice[0]._id;
            const updatedPrice = await priceModel.findByIdAndUpdate(priceID, { price }, { new: true })
            return res.json({ message: 'Price updated successfully', subscriptionPrice: updatedPrice });
        }

        // Create a new price for the user dashboard subscription app
        const subscriptionPrice = new priceModel({
            price
        });

        // Save the price
        await subscriptionPrice.save();

        res.status(201).json({ message: 'Price saved successfully', subscriptionPrice });
    } catch (err) {
        console.error('Error in saved the price:', err.message);
        return res.status(500).json({ message: 'An internal server error occurred while saving the price. Please try again later' });
    }
}

module.exports = addPrice;