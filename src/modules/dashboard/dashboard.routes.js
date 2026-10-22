const dashboardRouter = require('express').Router()
const newSubscription = require('./controller/newSubscription.controller.js')
const getAllPlayList = require('./controller/getAllPlayList.controller')
const stopSubscription = require('./controller/stopSubscription.controller')
const renewSubscription = require('./controller/renewSubscription.controller')
const { isAdmin } = require('../../middleware/auth')

dashboardRouter.post('/dashboard/subscription/:userId', isAdmin, newSubscription)
dashboardRouter.get('/dashboard/getAllPlayList', isAdmin, getAllPlayList)
dashboardRouter.put('/dashboard/stopSubscription/:userId', isAdmin, stopSubscription)
dashboardRouter.put('/dashboard/renewSubscription/:userId', isAdmin, renewSubscription)

module.exports = dashboardRouter;