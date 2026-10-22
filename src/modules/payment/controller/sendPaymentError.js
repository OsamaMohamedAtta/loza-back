// Sends a safe error response: internal details and PayTabs messages are never exposed
const sendPaymentError = (res, error) => {
    const status = error.status && error.status < 600 ? error.status : 500;
    if (status === 500) console.error('[payment] unexpected error:', error.message);
    res.status(status).json({
        message: status === 500 ? 'Something went wrong. Please try again.' : error.message,
        code: error.code
    });
}

module.exports = sendPaymentError;
