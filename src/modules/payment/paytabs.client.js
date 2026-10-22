const crypto = require('crypto');
const http = require('http');
const https = require('https');
const { getPaytabsConfig } = require('./payment.config');

// ===============================
// Minimal PayTabs PT2 client (Hosted Payment Page)
// ===============================
// Endpoints / auth follow the official PayTabs PT2 API:
//   POST {region}/payment/request  -> create hosted payment page
//   POST {region}/payment/query    -> query a transaction by tran_ref
//   Header: authorization: <server key>

const REQUEST_TIMEOUT_MS = 15000;

class PaytabsError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'PaytabsError';
        this.status = status;
    }
}

// Uses Node's built-in http(s) module, so it works on any Node version without extra dependencies
function post(path, body) {
    const { baseUrl, serverKey } = getPaytabsConfig();
    const url = new URL(`${baseUrl}${path}`);
    const payload = JSON.stringify(body);
    const client = url.protocol === 'http:' ? http : https;

    return new Promise((resolve, reject) => {
        const req = client.request(url, {
            method: 'POST',
            headers: { authorization: serverKey, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
            timeout: REQUEST_TIMEOUT_MS
        }, (res) => {
            let text = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => { text += chunk; });
            res.on('end', () => {
                let data = null;
                try { data = JSON.parse(text); } catch (_) {}
                if (res.statusCode < 200 || res.statusCode >= 300 || !data || typeof data !== 'object') {
                    // Never forward the raw PayTabs message to the customer; callers log the status only
                    return reject(new PaytabsError(`PayTabs HTTP ${res.statusCode}`, res.statusCode));
                }
                resolve(data);
            });
        });
        req.on('timeout', () => req.destroy(new Error('timeout')));
        req.on('error', (err) => reject(new PaytabsError(`PayTabs unreachable (${err.message})`)));
        req.end(payload);
    });
}

async function createPaymentPage({ cartId, amount, currency, description }) {
    const c = getPaytabsConfig();
    return post('/payment/request', {
        profile_id: c.profileId,
        tran_type: 'sale',
        tran_class: 'ecom',
        cart_id: cartId,
        cart_currency: currency,
        cart_amount: Number(amount),
        cart_description: description,
        paypage_lang: 'en',
        hide_shipping: true,
        callback: c.callbackUrl,
        return: c.returnUrl
    });
}

async function queryTransaction(tranRef) {
    const c = getPaytabsConfig();
    return post('/payment/query', { profile_id: c.profileId, tran_ref: tranRef });
}

// Callback (IPN) signature: HMAC-SHA256 of the raw request body keyed with
// the profile server key, sent in the `signature` header.
function isValidCallbackSignature(rawBody, signature) {
    const { serverKey } = getPaytabsConfig();
    if (!rawBody || !signature || !serverKey) return false;
    const expected = crypto.createHmac('sha256', serverKey).update(rawBody).digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(String(signature).trim().toLowerCase(), 'utf8');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { PaytabsError, createPaymentPage, queryTransaction, isValidCallbackSignature };
