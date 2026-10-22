const faqRouter = require('express').Router()
const addFaq = require('./controller/addFaq.controller.js')
const updateFaq = require('./controller/updateFaq.controller.js')
const deleteFaq = require('./controller/deleteFaq.controller.js')
const getFaq = require('./controller/getFaq.controller.js')
const { isAdmin } = require('../../middleware/auth')

faqRouter.post('/faq/add', isAdmin, addFaq)
faqRouter.put('/faq/update/:faqID', isAdmin, updateFaq)
faqRouter.delete('/faq/delete/:faqID', isAdmin, deleteFaq)
faqRouter.get('/faq/get', getFaq)

module.exports = faqRouter;