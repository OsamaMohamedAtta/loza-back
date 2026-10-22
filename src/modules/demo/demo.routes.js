const demoRouter = require('express').Router()
const addDemo = require('./controller/addDemo.controller.js')
const getDemo = require('./controller/getDemo.controller.js')
const { isAdmin } = require('../../middleware/auth')

demoRouter.post('/demo/add', isAdmin, addDemo)
demoRouter.get('/demo/get', getDemo)

module.exports = demoRouter;