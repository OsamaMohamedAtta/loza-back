const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')
// const whitelist = ['https://www.noovaplayer.com', 'https://dashboard.noovaplayer.com', 'https://reseller.noovaplayer.com'];
// const corsOptions = {
//     origin: function (origin, callback) {
//         if (!origin || whitelist.indexOf(origin) !== -1) {
//             callback(null, true);
//         } else {
//             callback(new Error('Not allowed by CORS'));
//         }
//     }
// };
// app.use(cors(corsOptions));
app.use(cors())
const port = process.env.PORT || 3000
// Middleware setup
// rawBody keeps the exact request body for the PayTabs callback signature check
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf } }))

// Connection DB
const connectionDB = require('./DB/connection')
if (require.main === module) connectionDB();

// Rate limiting sitting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 50,
    message: 'Too many requests, please try again later.',
});
app.use(limiter);

// Include your routes here
const { userRouter, playListRouter, subscriptionRouter, dashboardRouter, favoriteRouter, lockRouter, contentRouter, faqRouter, footerContentRouter, priceRouter, adminRouter, resellerRouter, demoRouter, apiKeyRouter, notificationRouter, paymentRouter } = require('./router/allRoutes')
app.use(userRouter, playListRouter, subscriptionRouter, dashboardRouter, favoriteRouter, lockRouter, contentRouter, faqRouter, footerContentRouter, priceRouter, adminRouter, resellerRouter, demoRouter, apiKeyRouter, notificationRouter, paymentRouter)

const request = require('request')
const CronJob = require('cron').CronJob;

// Only start the keep-alive job and the server when run directly (not when imported by tests)
if (require.main === module) {
    new CronJob('*/10 * * * *', function () {
        request('https://lozatv-back-app.onrender.com/', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log('Wake up the server')
            }
        })
    }, null, true, 'America/New_York')
}

// Start server
app.get('/', (req, res) => res.send('Hello World!'))

if (require.main === module) {
    app.listen(port, () => console.log(`Example app listening on port ${port}!`))
}

module.exports = app
