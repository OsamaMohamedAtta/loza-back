const priceModel = require('../../../../DB/models/price.model')

const getPrice = async (req, res) => {
    try {
        let subscriptionPrice = await priceModel.find();

        if (subscriptionPrice.length == 0) {
            return res.status(404).json({ message: 'There is no any price yet' });
        }

        return res.status(201).json({ message: 'Price get successfully', subscriptionPrice: subscriptionPrice[0] });
    } catch (err) {
        console.error('Error in get the price:', err.message);
        return res.status(500).json({ message: 'An internal server error occurred while get the price. Please try again later' });
    }
}

module.exports = getPrice;