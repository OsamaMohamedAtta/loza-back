const contentRouter = require('express').Router()
const addContent = require('./controller/addContent.controller.js')
const updateContent = require('./controller/updateContent.controller.js')
const deleteContent = require('./controller/deleteContent.controller.js')
const getContent = require('./controller/getContent.controller.js')
const { isAdmin } = require('../../middleware/auth')

contentRouter.post('/content/add', isAdmin, addContent)
contentRouter.put('/content/update/:contentID', isAdmin, updateContent)
contentRouter.delete('/content/delete/:contentID', isAdmin, deleteContent)
contentRouter.get('/content/get', isAdmin, getContent)

module.exports = contentRouter;