# TagadaPay SDK Examples

This directory contains examples demonstrating TagadaPay SDK functionality.

## Examples

### [`headless-react/`](./headless-react/)

A store simulator powered by **`@tagadapay/headless-sdk/react`** hooks:

1. **Products** — Browse real products with `useCatalog`
2. **Cart** — Local cart with quantity management
3. **Checkout** — Auto-create session, customer info, shipping with `useCheckout`
4. **Payment** — Card tokenization & processing with `usePayment`
5. **Confirmation** — Purchase tracking & post-purchase upsells with `useOffers`

**Quick Start:**

```bash
cd headless-react
pnpm install
pnpm dev
```

---

### [`core-js-tokenization/`](./core-js-tokenization/)

Complete 3-step payment flow demonstration:

1. **🎯 Card Tokenization** - Secure tokenization using Secure Vault
2. **🚀 Payment Instrument Creation** - Create payment instruments via API
3. **💳 Payment Processing** - Process demo payments end-to-end

**Features:**

- Professional React + TypeScript + Tailwind CSS interface
- Real-time form validation and 3D card preview
- Complete API integration with TagadaPay endpoints
- Test card support (4242 4242 4242 4242)
- Comprehensive error handling and loading states

**Quick Start:**

```bash
cd core-js-tokenization
npm install
npm run dev
```

**Build for Production:**

```bash
npm run build
npm run preview
```

## Requirements

- Node.js 18+
- TagadaPay API token with `org:admin` role
- Modern browser with JavaScript enabled

## Documentation

See the individual example READMEs for detailed setup and usage instructions.
