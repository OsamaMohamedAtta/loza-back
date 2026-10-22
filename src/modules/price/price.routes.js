const priceRouter = require('express').Router()
const addPrice = require('./controller/addPrice.controller.js')
const getPrice = require('./controller/getPrice.controller.js')
const { isAdmin } = require('../../middleware/auth')

priceRouter.post('/price/add', isAdmin, addPrice)
priceRouter.get('/price/get', getPrice)

module.exports = priceRouter;