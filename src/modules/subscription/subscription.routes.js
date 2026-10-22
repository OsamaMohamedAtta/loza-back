const subscriptionRouter = require('express').Router()
const newSubscription = require('./controller/newSubscription.controller')
const getByDate = require('./controller/getByDate.controller')
const getSubscriptions = require('./controller/getSubscriptions.controller')
const searchSubscriptions = require('./controller/searchSubscriptions.controller')
const searchByMac = require('./controller/searchByMac.controller')
const paymentIntent = require('./controller/paymentIntent.controller')
const { isUser, isAdmin } = require('../../middleware/auth')

subscriptionRouter.post('/subscription/start', isUser, newSubscription)
subscriptionRouter.get('/subscription/getByDate', isAdmin, getByDate)
subscriptionRouter.get('/subscription/getAll', isAdmin, getSubscriptions)
subscriptionRouter.get('/subscription/search', isAdmin, searchSubscriptions)
subscriptionRouter.get('/subscription/searchByMac', isAdmin, searchByMac)
subscriptionRouter.post('/subscription/pay', isUser, paymentIntent)

module.exports = subscriptionRouter;