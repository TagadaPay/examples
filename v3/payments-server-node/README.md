# Payments API from a Node server

> **Coming soon.** This example waits for the Payments API methods of `@tagadapay/node-sdk` (`tagada.payments.*` for V3), which are not released yet. There is no code in this folder on purpose. Today, a V3 server calls `https://api.tagada.io/v1` over HTTP: see the [Payment lifecycle](https://docs.tagada.io/payments-api/payment-lifecycle) guide. For a server that charges today, use [`v2/mini-saas-billing`](../../v2/mini-saas-billing) (`payments.process()`).

| | |
| --- | --- |
| **API version** | Payments API (V3), `Payments-Version: 2026-11-01` ([V2 or V3?](https://docs.tagada.io/payments-api/v2-or-v3)) |
| **SDKs** | `@tagadapay/node-sdk`, first version with Payments API methods (not released) |
| **Status** | Coming soon (the API itself is in Preview) |

## What it will show

1. Create a payment with an `Idempotency-Key`, and return its `client_secret` to the browser.
2. Read it back after confirmation and fulfil on `succeeded`.
3. Capture or cancel a payment created with `capture_method: "manual"`.
4. Refund it (`POST /v1/refunds`) and read the error object (`type`, `code`, `request_id`) on failure.

## What you will need

- Node.js 20 or later and pnpm 10
- A secret key (`tsk_test_...`). During the preview, keys are issued by TagadaPay on request: [api-support@tagadapay.com](mailto:api-support@tagadapay.com).
