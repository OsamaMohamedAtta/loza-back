const apiKeyRouter = require('express').Router()
const addApiKey = require('./controller/addApiKey.controller.js')
const getApiKey = require('./controller/getApiKey.controller.js')
const getPublishableKey = require('./controller/getPublishableKey.controller')
const { isAdmin } = require('../../middleware/auth')

apiKeyRouter.post('/apiKey/add', isAdmin, addApiKey)
apiKeyRouter.get('/apiKey/get', isAdmin, getApiKey)
apiKeyRouter.get('/apiKey/getPublishableKey', getPublishableKey)

module.exports = apiKeyRouter;