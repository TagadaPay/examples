# Apple Pay and Google Pay tokenization

Native Apple Pay and Google Pay buttons that turn a wallet payment into a TagadaToken with `@tagadapay/core-js`, then into a payment instrument you can charge.

| | |
| --- | --- |
| **API version** | Payments V2 ([V2 or V3?](https://docs.tagada.io/payments-api/v2-or-v3)) |
| **SDKs** | `@tagadapay/core-js` 3.7.0, `@google-pay/button-react` 3 |
| **Minimum versions** | core-js 3.0.0 |
| **Stack** | Vite 5, React 18, Tailwind 3 |
| **Status** | Stable |
| **Tutorial** | [Apple Pay & Google Pay](https://docs.tagada.io/developer-tools/examples/apple-google-pay) |

<!-- Demo: add a GIF or screenshot here (docs/demo.gif). -->

## What it does

```
1. Browser   Apple Pay: ApplePaySession + validateApplePayMerchant, then tokenizeApplePay
             Google Pay: Google Pay button (gateway basistheory), then tokenizeGooglePay
             → { tagadaToken, rawToken }
2. Browser   show the token
3. API       create a payment instrument   POST /api/public/v1/payment-instruments/create-from-token
```

The running page stops at the payment instrument. To charge it, follow the same path as a card: `POST /api/public/v1/payments/process`, shown end to end in [`../core-js-tokenization`](../core-js-tokenization). The server functions for that path are already in [`src/api/paymentBackend.ts`](./src/api/paymentBackend.ts).

## Run it in 3 steps

```bash
cd v2/apple-google-tokenization
pnpm install      # 1. install
pnpm dev          # 2. start on http://localhost:5173
                  # 3. fill the server config on the page, then tap a wallet button
```

This example reads no environment variables, so there is no `.env` to fill. You pick the environment and type a store id and an API token in the server config section of the page.

> **Security: demo only.** The page calls the API from the browser with your secret API token, so you can see the whole flow in one place. Never do this in production: move the calls to your server and keep the token there. [`src/api/paymentBackend.ts`](./src/api/paymentBackend.ts) has them as server functions (`createPaymentInstrument`, `persistThreedsSession`, `processPayment`, `pollPaymentStatus`).

### Apple Pay needs HTTPS

Google Pay works on `http://localhost`. Apple Pay only runs on an HTTPS page, in Safari, on a device with Apple Pay set up. Use a tunnel:

```bash
brew install ngrok          # or: npm install -g ngrok
pnpm dev                    # terminal 1
ngrok http 5173             # terminal 2: prints https://<id>.ngrok.app
```

Open the HTTPS URL in Safari. Vite only answers hosts listed in `server.allowedHosts` in [`vite.config.ts`](./vite.config.ts) (`.ngrok.app`, `.ngrok.io` and `.ngrok-free.app` are there): add your tunnel's domain if it uses another one.

## Files to look at

| File | What to read it for |
| --- | --- |
| [`src/components/ApplePayButton.tsx`](./src/components/ApplePayButton.tsx) | `ApplePaySession`, merchant validation, `tokenizeApplePay` |
| [`src/components/GooglePayButton.tsx`](./src/components/GooglePayButton.tsx) | Google Pay payment request with `getGoogleTenantId`, `tokenizeGooglePay` |
| [`src/components/GooglePayExpressCheckout.tsx`](./src/components/GooglePayExpressCheckout.tsx) | Advanced Google Pay sheet: shipping options, address changes, tax, live totals (not mounted by the demo page) |
| [`src/App.tsx`](./src/App.tsx) | The demo page: server config, buttons, token, payment instrument |
| [`src/utils/api.ts`](./src/utils/api.ts) | `createPaymentInstrument`, the call the page makes |
| [`src/api/paymentBackend.ts`](./src/api/paymentBackend.ts) | Server functions for the full charge path, plus the demo-only `DemoBackendClient` |
| [`src/hooks/usePaymentFlow.ts`](./src/hooks/usePaymentFlow.ts) | Instrument, 3DS session and charge orchestration (same as the card demo) |
| [`src/components/PaymentFlow/`](./src/components/PaymentFlow) | Step components: token display, instrument creation and result, flow overview |
| [`src/types/index.ts`](./src/types/index.ts) | Shared types |

## How it works

### Google Pay gateway

Google Pay encrypts the card for a gateway. Here the gateway is `basistheory` and the gateway merchant id comes from core-js, per environment:

```ts
import { getGoogleTenantId } from '@tagadapay/core-js/core';

tokenizationSpecification: {
  type: 'PAYMENT_GATEWAY',
  parameters: { gateway: 'basistheory', gatewayMerchantId: getGoogleTenantId('production') },
}
```

`getGoogleTenantId` takes `'production'`, `'development'` or `'local'`. Match it to the environment you tokenize in: the demo button passes `'local'` and tokenizes with `environment: 'development'`, so change both before you point it at production.

### 3DS

Wallet tokens go through the same `rawToken.metadata.auth.scaRequired` check as cards. When you charge, a 3DS session is needed only if you use TagadaPay's 3DS; skip it when the processor runs its own. See [`../core-js-tokenization`](../core-js-tokenization) for the full 3DS flow.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| The Apple Pay button is missing or says Apple Pay is not available | Use the HTTPS tunnel URL in Safari, on a device with a card in Wallet. |
| "Blocked request. This host is not allowed" | Add the tunnel's domain to `server.allowedHosts` in `vite.config.ts`. |
| Apple Pay merchant validation fails | The domain must be registered for Apple Pay on your store. Register it in the dashboard first. |
| The Google Pay button does not show | Use Chrome, signed in to a Google account, and check the console for errors loading the Google Pay script. |
| 401 on `create-from-token` | The API token is wrong, or from another environment than the one selected. |

## Learn more

- [`../core-js-tokenization`](../core-js-tokenization): the full card flow with 3DS and the charge
- [Apple Pay & Google Pay tutorial](https://docs.tagada.io/developer-tools/examples/apple-google-pay)
- [core-js payments](https://docs.tagada.io/developer-tools/payments/core-js-payments)

MIT licensed. Fork it freely.
