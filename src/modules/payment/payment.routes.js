const express = require('express')
const paymentRouter = express.Router()
const rateLimit = require('express-rate-limit');
const getPlans = require('./controller/getPlans.controller')
const checkout = require('./controller/checkout.controller')
const getPayments = require('./controller/getPayments.controller')
const getPayment = require('./controller/getPayment.controller')
const getSubscriptionStatus = require('./controller/getSubscriptionStatus.controller')
const paytabsCallback = require('./controller/paytabsCallback.controller')
const paytabsReturn = require('./controller/paytabsReturn.controller')
const { isUserAccount } = require('../../middleware/auth')

// Per-user limits (the global per-IP limiter in app.js still applies too)
const byUser = (req) => String(req.userData._id);
const checkoutLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    keyGenerator: byUser,
    message: { message: 'Too many payment attempts. Please wait a few minutes and try again.' },
});
const statusLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    keyGenerator: byUser,
    message: { message: 'Too many requests, please try again later.' },
});

// Keeps the exact raw body for the PayTabs signature check when the global
// express.json() did not already parse it (e.g. a different content type)
const rawBodyParser = express.json({
    limit: '100kb',
    type: () => true,
    verify: (req, res, buf) => { req.rawBody = buf }
});

paymentRouter.get('/payment/plans', getPlans)
paymentRouter.post('/payment/checkout', isUserAccount, checkoutLimiter, checkout)
paymentRouter.get('/payment/orders', isUserAccount, statusLimiter, getPayments)
paymentRouter.get('/payment/orders/:orderId', isUserAccount, statusLimiter, getPayment)
paymentRouter.get('/payment/subscription', isUserAccount, statusLimiter, getSubscriptionStatus)
paymentRouter.post('/payment/callback', rawBodyParser, paytabsCallback)
paymentRouter.post('/payment/return', express.urlencoded({ extended: false, limit: '50kb' }), paytabsReturn)
paymentRouter.get('/payment/return', paytabsReturn)

module.exports = paymentRouter;
