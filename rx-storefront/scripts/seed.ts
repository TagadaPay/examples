#!/usr/bin/env tsx
/**
 * Creates a store, one product, shipping, and the Tagada Rx Funnel v2
 * (landing → quiz → checkout → offer → thank-you → portal).
 *
 * Usage:
 *   pnpm seed
 *   pnpm seed YOUR_API_KEY
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import TagadaModule from '@tagadapay/node-sdk';

const Tagada = (
  'default' in TagadaModule && typeof (TagadaModule as { default?: unknown }).default === 'function'
    ? (TagadaModule as { default: typeof TagadaModule }).default
    : TagadaModule
) as typeof TagadaModule;

const envPath = resolve(import.meta.dirname ?? '.', '..', '.env');

function readDotEnv(): Record<string, string> {
  if (!existsSync(envPath)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    out[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return out;
}

const existing = readDotEnv();
const apiKey =
  process.argv.slice(2).find((arg) => !arg.startsWith('--')) ??
  process.env.TAGADA_API_KEY ??
  existing.TAGADA_API_KEY;

if (!apiKey) {
  console.error('\n  Usage: pnpm seed <YOUR_API_KEY>\n');
  console.error('  Or run tagada-init first so .env already has TAGADA_API_KEY.\n');
  process.exit(1);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tagada = new (Tagada as any)(apiKey);

async function main() {
  console.log('\n  Seeding Rx storefront (funnel + catalog)\n');

  const { processor } = await tagada.processors.create({
    processor: {
      name: 'Harbor Clinic sandbox',
      type: 'sandbox',
      enabled: true,
      supportedCurrencies: ['USD'],
      baseCurrency: 'USD',
      options: { testMode: true },
    },
  });
  const flow = await tagada.paymentFlows.create({
    data: {
      name: 'Harbor Clinic flow',
      strategy: 'simple',
      fallbackMode: false,
      maxFallbackRetries: 0,
      threeDsEnabled: false,
      stickyProcessorEnabled: false,
      pickProcessorStrategy: 'weighted',
      processorConfigs: [{ processorId: processor.id, weight: 100, disabled: false, nonStickable: false }],
      fallbackProcessorConfigs: [],
      abuseDetectionConfig: null,
    },
  });
  const store = await tagada.stores.create({
    name: 'Harbor Clinic',
    baseCurrency: 'USD',
    presentmentCurrencies: ['USD'],
    chargeCurrencies: ['USD'],
    selectedPaymentFlowId: flow.id,
  });
  console.log(`  store      ${store.id}`);

  const product = await tagada.products.create({
    storeId: store.id,
    name: 'Hair treatment',
    description: 'Demo Rx SKU — map it to a clinical offering to exercise submitCase.',
    active: true,
    isShippable: true,
    isTaxable: false,
    variants: [
      {
        name: 'Default',
        sku: 'harbor-hair',
        grams: 80,
        active: true,
        default: true,
        price: 7900,
        compareAtPrice: null,
        prices: [
          {
            currencyOptions: { USD: { amount: 7900 } },
            recurring: false,
            billingTiming: 'usage',
            interval: null,
            intervalCount: 1,
            default: true,
          },
        ],
      },
    ],
  });
  console.log(`  product    ${product.id}`);

  await tagada.shippingRates.create({
    storeId: store.id,
    shippingRateName: 'Free Standard',
    description: '5–7 business days',
    isFree: true,
    isPickupPoint: false,
    amount: { USD: { amount: 0 } },
    highlighted: true,
    estimatedDeliveryTime: 7,
  });

  const funnel = await tagada.funnels.create({
    storeId: store.id,
    isDefault: true,
    config: {
      id: 'rx-storefront',
      name: 'Harbor Clinic storefront',
      version: '1.0.0',
      metadata: { rxStorefront: true },
      nodes: [
        { id: 'rx_landing', name: 'Landing', kind: 'step', type: 'landing', isEntry: true, isDefault: true, position: { x: 0, y: 0 }, config: { path: '/' } },
        { id: 'rx_quiz', name: 'Marketing quiz', kind: 'step', type: 'custom', position: { x: 280, y: 0 }, config: { path: '/quiz', matchSubPaths: true } },
        { id: 'rx_checkout', name: 'Checkout', kind: 'step', type: 'checkout', position: { x: 560, y: 0 }, config: { path: '/checkout', stepConfig: { payment: { paymentFlowId: flow.id } } } },
        { id: 'rx_offer', name: 'Offer', kind: 'step', type: 'offer', position: { x: 840, y: 0 }, config: { path: '/offer' } },
        { id: 'rx_thankyou', name: 'Thank you', kind: 'step', type: 'thankyou', isConversion: true, position: { x: 1120, y: 0 }, config: { path: '/thank-you' } },
        { id: 'rx_portal', name: 'Patient portal', kind: 'step', type: 'custom', position: { x: 1400, y: 0 }, config: { path: '/portal', matchSubPaths: true } },
      ],
      edges: [
        { id: 'edge_rx_landing_quiz', source: 'rx_landing', target: 'rx_quiz' },
        { id: 'edge_rx_quiz_checkout', source: 'rx_quiz', target: 'rx_checkout' },
        { id: 'edge_rx_checkout_offer', source: 'rx_checkout', target: 'rx_offer', conditions: { when: 'payment.success' } },
        { id: 'edge_rx_offer_thankyou', source: 'rx_offer', target: 'rx_thankyou' },
        { id: 'edge_rx_thankyou_portal', source: 'rx_thankyou', target: 'rx_portal' },
      ],
    },
  });
  console.log(`  funnel     ${funnel.id}`);

  const env = [
    '# Auto-generated by scripts/seed.ts',
    `TAGADA_API_KEY=${apiKey}`,
    existing.TAGADA_ACCOUNT_ID ? `TAGADA_ACCOUNT_ID=${existing.TAGADA_ACCOUNT_ID}` : '',
    `TAGADA_STORE_ID=${store.id}`,
    '',
    `VITE_STORE_ID=${store.id}`,
    'VITE_ENVIRONMENT=production',
    `VITE_PRODUCT_ID=${product.id}`,
    `VITE_VARIANT_ID=${product.variants[0].id}`,
    `VITE_FUNNEL_ID=${funnel.id}`,
    '',
  ]
    .filter((line) => line !== '')
    .join('\n');

  writeFileSync(envPath, `${env}\n`);
  console.log(`\n  Wrote ${envPath}`);
  console.log('\n  Next: pnpm dev  →  http://localhost:5173');
  console.log('  Open the store in the CRM → Funnels to see the six boxes.');
  console.log('  Test card: 4242 4242 4242 4242 · 12/28 · 123\n');
}

main().catch((err) => {
  console.error('\n  Seed failed\n');
  console.error(err);
  process.exit(1);
});
