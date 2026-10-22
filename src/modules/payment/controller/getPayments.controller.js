const { listOrdersForUser } = require('../payment.service')
const sendPaymentError = require('./sendPaymentError')

// GET /payment/orders - the last payments of the logged in user
const getPayments = async (req, res) => {
    try {
        res.json({ payments: await listOrdersForUser(req.userData._id) });
    } catch (error) {
        sendPaymentError(res, error);
    }
}

module.exports = getPayments;
