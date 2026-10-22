const adminRouter = require('express').Router()
const login = require('./controller/login.controller')
const register = require('./controller/register.controller')
const adminInfo = require('./controller/adminInfo.controller')
const updateAdmin = require('./controller/updateAdmin.controller')
const addReseller = require('./controller/addReseller.controller')
const blockReseller = require('./controller/blockReseller.controller')
const resellerSubscriptions = require('./controller/resellerSubscriptions.controller')
const { isAdmin } = require('../../middleware/auth')

adminRouter.post('/admin/register', register)
adminRouter.post('/admin/login', login)
adminRouter.get('/admin/info', isAdmin, adminInfo)
adminRouter.put('/admin/update', isAdmin, updateAdmin)
adminRouter.post('/admin/createReseller', isAdmin, addReseller)
adminRouter.put('/admin/blockReseller/:resellerId', isAdmin, blockReseller)
adminRouter.get('/admin/resellerSubscriptions', isAdmin, resellerSubscriptions)

module.exports = adminRouter;