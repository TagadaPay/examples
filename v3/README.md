# Payments API (V3) examples

> **Preview.** The Payments API is live at `https://api.tagada.io/v1`, but it is not open to self-serve integrations yet: merchant secret keys cannot be created from the dashboard. Every merchant processes on V2 today, and every runnable example in this repo is in [`../v2`](../v2). Planning a new integration? Write to [api-support@tagadapay.com](mailto:api-support@tagadapay.com).

The Payments API is TagadaPay's new payments interface, also called V3. It replaces the payment calls of the Commerce API (V2) with one resource, the **Payment**, and one way to drive it: create it on your server, confirm it in the browser, follow `next_action` until it reaches a final status.

| | |
| --- | --- |
| **Base URL** | `https://api.tagada.io/v1` |
| **Version header** | `Payments-Version: 2026-11-01` (every response echoes the version it used) |
| **Keys** | Secret keys `tsk_` on your server, publishable keys `tpk_` in the browser |
| **Writes** | `Idempotency-Key` required on every `POST` and `PATCH` that changes state |
| **Browser SDK** | `@tagadapay/core-js/payments-v3`, in `@tagadapay/core-js` since 3.7.0 (Preview) |
| **Server SDK** | None yet: call the HTTP API. `node-sdk` `payments.*` methods are coming soon |
| **Docs** | [Overview](https://docs.tagada.io/payments-api/overview) · [V2 or V3?](https://docs.tagada.io/payments-api/v2-or-v3) · [API reference](https://docs.tagada.io/payments-api/reference/introduction) |

## How a payment moves

```
 your server                         browser (core-js/payments-v3)               your server
 ───────────                         ─────────────────────────────               ───────────
 POST /v1/payments  ──client_secret──►  confirmPayment()                          GET /v1/payments/{id}
 (secret key tsk_)                      ├─ requires_action → runs next_action     fulfil on succeeded
                                        │   (3DS, redirect, wallet step)
                                        └─ succeeded | requires_capture | failed
```

| Status | Meaning | What you do |
| --- | --- | --- |
| `requires_payment_method` | Created without a payment method | Confirm it with one |
| `requires_confirmation` | Has a payment method, not confirmed | Confirm it |
| `processing` | The API is working with the processor | Wait, or read it again |
| `requires_action` | The shopper must act (3DS, redirect, wallet) | Perform `next_action` (the browser client does it) |
| `requires_capture` | Authorized, not captured | Capture or cancel it |
| `succeeded` | Final: money collected | Fulfil the order |
| `failed` | Final: declined or errored (`last_outcome` says why) | Offer another payment |
| `canceled` | Final: canceled before it concluded | Nothing |

`status` is an open enum: treat a value you do not know as "not final yet". Details: [Payment lifecycle](https://docs.tagada.io/payments-api/payment-lifecycle).

## Release phases

| Phase | Meaning | Today |
| --- | --- | --- |
| Preview | Live in production, contract versioned, access on request | Payments API, `@tagadapay/core-js/payments-v3` |
| Coming soon | Designed, not available | Self-serve secret keys, merchant webhooks, `node-sdk` Payments API methods, `headless-sdk` V3 support |
| Generally available | Open to every merchant | Commerce API and V2 payments (the [`v2/`](../v2) examples) |

## Planned examples

| Example | What it will show | SDK | Status |
| --- | --- | --- | --- |
| [`payments-browser`](./payments-browser) | Card fields and wallets, `confirmPayment`, the `next_action` loop, the return from a redirect | `@tagadapay/core-js/payments-v3` 3.7.0, then `@tagadapay/headless-sdk` 1.21+ | Coming soon |
| [`payments-server-node`](./payments-server-node) | Create, read, capture, cancel and refund a Payment from Node, with idempotency keys | `@tagadapay/node-sdk` once `payments.*` ships | Coming soon |

They will land here with the same template as the V2 examples (API version, SDK versions, run in 3 steps) once a developer can run them end to end without asking TagadaPay for keys.

## Already on V2?

Nothing to do. A store moved to the Payments API keeps answering V2 calls (`processPayment()`, `payments.process()`, refunds, V2 webhooks) through a compatibility layer, so the [`v2/`](../v2) examples keep working on it. See [Migrate from V2](https://docs.tagada.io/payments-api/migrate-from-v2).
