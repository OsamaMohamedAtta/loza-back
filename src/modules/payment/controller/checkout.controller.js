const { createCheckout } = require('../payment.service')
const sendPaymentError = require('./sendPaymentError')

// POST /payment/checkout - body: { planId: "yearly" | "lifetime" }
// Any price, cost, currency or duration sent by the client is ignored.
const checkout = async (req, res) => {
    try {
        const payment = await createCheckout(req.userData._id, req.body && req.body.planId);
        res.status(201).json({ message: 'Payment initiated', payment, redirectUrl: payment.redirectUrl });
    } catch (error) {
        sendPaymentError(res, error);
    }
}

module.exports = checkout;
