const notificationRouter = require('express').Router()
const create = require('./controller/create.controller')
const update = require('./controller/update.controller')
const remove = require('./controller/remove.controller')
const get = require('./controller/get.controller')
const { isAdmin } = require('../../middleware/auth')

notificationRouter.post('/notification/create', isAdmin, create)
notificationRouter.put('/notification/update/:id', isAdmin, update)
notificationRouter.delete('/notification/delete/:id', isAdmin, remove)
notificationRouter.get('/notification/get', get)

module.exports = notificationRouter;