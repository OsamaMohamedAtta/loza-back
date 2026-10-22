const { handleCallback } = require('../payment.service')

// POST /payment/callback - called by PayTabs servers (no browser session, no user token)
const paytabsCallback = async (req, res) => {
    try {
        await handleCallback({ rawBody: req.rawBody, signature: req.get('signature'), body: req.body });
        res.status(200).json({ received: true });
    } catch (error) {
        if ([400, 401, 404].includes(error.status)) {
            console.warn('[payment] callback rejected:', error.status, error.message);
            return res.status(error.status).json({ message: error.message });
        }
        console.error('[payment] callback error:', error.message);
        // 500 lets PayTabs retry later, processing is idempotent
        res.status(500).json({ message: 'Temporary error' });
    }
}

module.exports = paytabsCallback;
