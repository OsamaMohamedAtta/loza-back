# PayTabs payments (annual & lifetime subscriptions)

The website dashboard (lozatv.com) sells two plans through the PayTabs Hosted Payment Page:

| Plan | `subscriptionType` | Reference price | Charged | Duration |
|---|---|---|---|---|
| Annual | `yearly` | $5 | `ANNUAL_PRICE_EGP` EGP | 1 year from activation (a renewal while active extends from the current end date) |
| Lifetime | `lifetime` | $10 | `LIFETIME_PRICE_EGP` EGP | `endDate` 100 years ahead, the same as `/subscription/start`, so `checkMac` keeps working |

No exchange rate is hard-coded. If a price or PayTabs credential is missing, checkout is turned off (HTTP 503).
`cost` on subscription records keeps its meaning (the reference price). PayTabs purchases also store
`amountPaid`, `currency` and `payment`.

## Flow
1. `POST /payment/checkout { planId }` (user token). The server picks the price, creates a `Payment`
   (`pending`, unique `cartId`), calls PayTabs `POST /payment/request` and returns `redirectUrl`.
2. The customer pays on PayTabs.
3. PayTabs calls `POST /payment/callback`. The `signature` header is checked (HMAC-SHA256 of the raw body
   with the server key), then the server queries PayTabs (`POST /payment/query`, stored `tran_ref`) and
   requires `response_status = A` plus a matching `tran_ref`, `cart_id`, sale type, currency and amount.
4. The browser comes back to `/payment/return`, which runs the same verification and redirects to
   `dashboard.html?payment=<orderId>`. The dashboard polls `GET /payment/orders/:orderId`.
5. Activation goes through `src/modules/subscription/subscription.service.js` (shared with
   `/subscription/start`). An atomic lock on the payment plus a unique index on `subscription.payment`
   mean duplicate or concurrent callbacks activate only once.

PayTabs status mapping: A = paid, P/H = pending, D/E/V = failed, C = cancelled, X = expired.
If PayTabs can't be reached the payment stays pending and is checked again later. Pending orders with no
PayTabs result expire after `PAYMENT_PENDING_EXPIRY_MINUTES` (default 120). A late verified payment
still activates.

## Endpoints
| Endpoint | Auth |
|---|---|
| `GET /payment/plans` | public |
| `POST /payment/checkout` | user token (`isUserAccount`), 5 per 10 min per user |
| `GET /payment/orders`, `GET /payment/orders/:orderId` | user token, own payments only |
| `GET /payment/subscription` | user token |
| `POST /payment/callback` | PayTabs signature |
| `POST/GET /payment/return` | none (browser redirect only) |

`isUserAccount` is `isUser` without the "must be subscribed or on trial" check, so expired users can renew.

## Render environment
See `.env.example`. These are required for payments: `PAYTABS_PROFILE_ID`, `PAYTABS_SERVER_KEY`,
`PAYTABS_REGION` (`EGY` = secure-egypt.paytabs.com, which must match the region of your PayTabs account),
`PAYTABS_CURRENCY=EGP`, `ANNUAL_PRICE_EGP`, `LIFETIME_PRICE_EGP`, `PAYTABS_CALLBACK_URL`,
`PAYTABS_RETURN_URL`, `FRONTEND_DASHBOARD_URL`.

## Tests
`npm test` runs the payment tests against the real app with an in-memory MongoDB and a mocked PayTabs server.
If MongoDB can't be downloaded, set `MONGOMS_SYSTEM_BINARY` to a local `mongod`.
