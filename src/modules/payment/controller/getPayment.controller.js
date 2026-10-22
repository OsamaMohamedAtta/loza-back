const { getOrderForUser } = require('../payment.service')
const sendPaymentError = require('./sendPaymentError')

// GET /payment/orders/:orderId - one payment of the logged in user (re-verified with PayTabs while pending)
const getPayment = async (req, res) => {
    try {
        res.json({ payment: await getOrderForUser(req.userData._id, req.params.orderId) });
    } catch (error) {
        sendPaymentError(res, error);
    }
}

module.exports = getPayment;
