// ===============================
// PayTabs + subscription plan configuration
// ===============================
// Every value comes from environment variables so prices and credentials
// can be changed on Render without touching the code.

// Official PayTabs PT2 region domains (same list as the official
// `paytabs_pt2` Node package published by PayTabs).
const PAYTABS_REGION_URLS = {
    ARE: 'https://secure.paytabs.com',
    SAU: 'https://secure.paytabs.sa',
    OMN: 'https://secure-oman.paytabs.com',
    JOR: 'https://secure-jordan.paytabs.com',
    EGY: 'https://secure-egypt.paytabs.com',
    KWT: 'https://secure-kuwait.paytabs.com',
    MAR: 'https://secure-morocco.paytabs.com',
    IRQ: 'https://secure-iraq.paytabs.com',
    QAT: 'https://secure-doha.paytabs.com',
    GLOBAL: 'https://secure-global.paytabs.com'
};

// The $5 / $10 values are REFERENCE prices only (kept in the existing
// subscription `cost` field for compatibility). The amount actually charged
// is the EGP amount configured in the environment.
const PLAN_DEFINITIONS = {
    yearly: {
        id: 'yearly',
        name: 'Annual Subscription',
        referencePriceUsd: 5,
        priceEnv: 'ANNUAL_PRICE_EGP',
        duration: '1 year'
    },
    lifetime: {
        id: 'lifetime',
        name: 'Lifetime Subscription',
        referencePriceUsd: 10,
        priceEnv: 'LIFETIME_PRICE_EGP',
        duration: 'lifetime'
    }
};

// Accepts '250', '250.5', '250.50' — rejects anything else (no negatives,
// no exponent notation, no more than 2 decimals).
function parseAmount(value) {
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const str = String(value).trim();
    if (!/^\d+(\.\d{1,2})?$/.test(str)) return null;
    const minor = Math.round(Number(str) * 100);
    return minor > 0 ? minor : null;
}

function getPaytabsConfig() {
    const region = (process.env.PAYTABS_REGION || '').trim().toUpperCase();
    const baseUrl = (process.env.PAYTABS_API_URL || PAYTABS_REGION_URLS[region] || '').replace(/\/+$/, '');
    return {
        profileId: Number(process.env.PAYTABS_PROFILE_ID),
        serverKey: process.env.PAYTABS_SERVER_KEY || '',
        region,
        baseUrl,
        currency: (process.env.PAYTABS_CURRENCY || 'EGP').trim().toUpperCase(),
        callbackUrl: process.env.PAYTABS_CALLBACK_URL || '',
        returnUrl: process.env.PAYTABS_RETURN_URL || '',
        dashboardUrl: process.env.FRONTEND_DASHBOARD_URL || 'https://lozatv.com/dashboard.html'
    };
}

// Returns the list of problems preventing checkout (empty = ready).
function getConfigProblems() {
    const c = getPaytabsConfig();
    const problems = [];
    if (!Number.isInteger(c.profileId) || c.profileId <= 0) problems.push('PAYTABS_PROFILE_ID');
    if (!c.serverKey) problems.push('PAYTABS_SERVER_KEY');
    if (!c.baseUrl) problems.push('PAYTABS_REGION');
    if (!/^[A-Z]{3}$/.test(c.currency)) problems.push('PAYTABS_CURRENCY');
    if (!/^https?:\/\//.test(c.callbackUrl)) problems.push('PAYTABS_CALLBACK_URL');
    if (!/^https?:\/\//.test(c.returnUrl)) problems.push('PAYTABS_RETURN_URL');
    return problems;
}

function getPlan(planId) {
    if (typeof planId !== 'string') return null;
    const def = PLAN_DEFINITIONS[planId.trim().toLowerCase()];
    if (!def) return null;
    const amountMinor = parseAmount(process.env[def.priceEnv]);
    return {
        id: def.id,
        name: def.name,
        duration: def.duration,
        referencePriceUsd: def.referencePriceUsd,
        currency: getPaytabsConfig().currency,
        amountMinor,
        amount: amountMinor ? (amountMinor / 100).toFixed(2) : null,
        available: Boolean(amountMinor)
    };
}

function getPlans() {
    return Object.keys(PLAN_DEFINITIONS).map(getPlan);
}

module.exports = { PAYTABS_REGION_URLS, PLAN_DEFINITIONS, parseAmount, getPaytabsConfig, getConfigProblems, getPlan, getPlans };
