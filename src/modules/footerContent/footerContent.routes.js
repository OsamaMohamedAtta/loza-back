const footerContentRouter = require('express').Router()
const addFooterContent = require('./controller/addFooterContent.controller.js')
const updateFooterContent = require('./controller/updateContent.controller.js')
const getFooterContent = require('./controller/getFooterContent.controller.js')
const { isAdmin } = require('../../middleware/auth')

footerContentRouter.post('/footerContent/add', isAdmin, addFooterContent)
footerContentRouter.put('/footerContent/update/:contentID', isAdmin, updateFooterContent)
footerContentRouter.get('/footerContent/get', getFooterContent)

module.exports = footerContentRouter;