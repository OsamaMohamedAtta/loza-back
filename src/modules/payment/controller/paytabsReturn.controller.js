const { handleReturn } = require('../payment.service')
const { getPaytabsConfig } = require('../payment.config')

// POST|GET /payment/return - the customer's browser coming back from the PayTabs page
const paytabsReturn = async (req, res) => {
    let target;
    try {
        target = await handleReturn({ ...(req.query || {}), ...(req.body || {}) });
    } catch (error) {
        console.error('[payment] return error:', error.message);
        target = getPaytabsConfig().dashboardUrl;
    }
    res.redirect(303, target);
}

module.exports = paytabsReturn;
