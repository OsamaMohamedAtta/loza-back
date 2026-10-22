const lockRouter = require('express').Router()
const lockContent = require('./controller/lockContent.controller')
const checkLocked = require('./controller/checkLocked.controller')
const addParentPin = require('./controller/addParentPin.controller')
const checkPin = require('./controller/checkPin.controller')
const { isUser } = require('../../middleware/auth')

lockRouter.post('/lock/add', lockContent)
lockRouter.get('/lock/checkLocked', checkLocked)
lockRouter.put('/lock/addParentPin', isUser, addParentPin)
lockRouter.post('/lock/checkPin', checkPin)

module.exports = lockRouter