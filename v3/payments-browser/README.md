# Payments API in the browser

> **Coming soon.** This example is planned and not written yet. There is no code in this folder on purpose. Until it lands, use the [`v2/`](../../v2) examples, or read the [Browser client](https://docs.tagada.io/payments-api/browser-client) guide.

| | |
| --- | --- |
| **API version** | Payments API (V3), `Payments-Version: 2026-11-01` ([V2 or V3?](https://docs.tagada.io/payments-api/v2-or-v3)) |
| **SDKs** | `@tagadapay/core-js/payments-v3` (core-js 3.7.0 or later); a Headless variant with `@tagadapay/headless-sdk` 1.21.0 or later, which runs the V3 `next_action` loop inside `processPayment()` (npm build, not the CDN build yet) |
| **Status** | Coming soon (the API itself is in Preview) |

## What it will show

1. A tiny server route creates a payment with a secret key (`POST /v1/payments`) and returns its `client_secret`.
2. The page loads the client with a publishable key (`tpk_test_...`) and mounts card fields and wallet buttons.
3. It creates a payment method, calls `confirmPayment`, and lets the client run every `next_action` (3DS, redirect, wallet step).
4. It handles the return from a redirect and shows the final status.

## What you will need

- Node.js 20 or later and pnpm 10
- A secret key (`tsk_test_...`) and a publishable key (`tpk_test_...`) with your local origin in `allowed_origins`. During the preview, keys are issued by TagadaPay on request: [api-support@tagadapay.com](mailto:api-support@tagadapay.com).
