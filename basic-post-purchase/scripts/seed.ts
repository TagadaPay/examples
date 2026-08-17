#!/usr/bin/env tsx
/**
 * Creates the catalog + offers for the basic post-purchase tutorial:
 * tee $29.99, cap $19.99, cap sale $14.99, tote $24, three upsells, free shipping.
 *
 * Usage:
 *   pnpm seed
 *   pnpm seed YOUR_API_KEY
 *
 * Reads TAGADA_API_KEY from the argument, the environment, or .env
 * (written by tagada-init).
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

function priceOf(product: { variants: Array<{ prices?: Array<{ id: string }> }> }): string {
  const id = product.variants[0]?.prices?.[0]?.id;
  if (!id) throw new Error('Product is missing a price id');
  return id;
}

async function createProduct(opts: {
  storeId: string;
  name: string;
  sku: string;
  amount: number;
  imageUrl: string;
  grams: number;
}) {
  return tagada.products.create({
    storeId: opts.storeId,
    name: opts.name,
    description: opts.name,
    active: true,
    isShippable: true,
    isTaxable: false,
    variants: [
      {
        name: 'Default',
        sku: opts.sku,
        grams: opts.grams,
        active: true,
        default: true,
        imageUrl: opts.imageUrl,
        price: opts.amount,
        compareAtPrice: null,
        prices: [
          {
            currencyOptions: { USD: { amount: opts.amount } },
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
}

async function main() {
  console.log('\n  Seeding basic post-purchase catalog\n');

  const { processor } = await tagada.processors.create({
    processor: {
      name: 'Basic post-purchase sandbox',
      type: 'sandbox',
      enabled: true,
      supportedCurrencies: ['USD'],
      baseCurrency: 'USD',
      options: { testMode: true },
    },
  });
  console.log(`  processor  ${processor.id}`);

  const flow = await tagada.paymentFlows.create({
    data: {
      name: 'Basic post-purchase flow',
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
  console.log(`  flow       ${flow.id}`);

  const store = await tagada.stores.create({
    name: 'Basic post-purchase',
    baseCurrency: 'USD',
    presentmentCurrencies: ['USD'],
    chargeCurrencies: ['USD'],
    selectedPaymentFlowId: flow.id,
  });
  console.log(`  store      ${store.id}`);

  const tee = await createProduct({
    storeId: store.id,
    name: 'Essential Tee',
    sku: 'tee-essential',
    amount: 2999,
    grams: 220,
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&h=1100&fit=crop&q=80',
  });
  const cap = await createProduct({
    storeId: store.id,
    name: 'Essential Cap',
    sku: 'cap-essential',
    amount: 1999,
    grams: 90,
    imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=900&h=1100&fit=crop&q=80',
  });
  const capSale = await createProduct({
    storeId: store.id,
    name: 'Essential Cap — sale',
    sku: 'cap-essential-sale',
    amount: 1499,
    grams: 90,
    imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=900&h=1100&fit=crop&q=80',
  });
  const tote = await createProduct({
    storeId: store.id,
    name: 'Essential Tote',
    sku: 'tote-essential',
    amount: 2400,
    grams: 280,
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=900&h=1100&fit=crop&q=80',
  });
  console.log('  products   tee / cap / cap-sale / tote');

  const capOffer = await tagada.offers.create({
    storeId: store.id,
    offerTitle: 'Essential Cap — $19.99',
    enabled: true,
    type: 'upsell',
    triggers: [{ productId: null, type: 'any' }],
    offers: [
      {
        productId: cap.id,
        variantId: cap.variants[0].id,
        priceId: priceOf(cap),
        title: 'Essential Cap',
        titleTrans: { en: 'Essential Cap — $19.99' },
      },
    ],
    orderBumpOffers: [],
  });
  const capDownsell = await tagada.offers.create({
    storeId: store.id,
    offerTitle: 'Essential Cap — $14.99',
    enabled: true,
    type: 'upsell',
    triggers: [{ productId: null, type: 'any' }],
    offers: [
      {
        productId: capSale.id,
        variantId: capSale.variants[0].id,
        priceId: priceOf(capSale),
        title: 'Essential Cap — sale',
        titleTrans: { en: 'Essential Cap — $14.99' },
      },
    ],
    orderBumpOffers: [],
  });
  const toteOffer = await tagada.offers.create({
    storeId: store.id,
    offerTitle: 'Essential Tote — $24',
    enabled: true,
    type: 'upsell',
    triggers: [{ productId: null, type: 'any' }],
    offers: [
      {
        productId: tote.id,
        variantId: tote.variants[0].id,
        priceId: priceOf(tote),
        title: 'Essential Tote',
        titleTrans: { en: 'Essential Tote — $24' },
      },
    ],
    orderBumpOffers: [],
  });
  console.log(`  offers     ${capOffer.id} / ${capDownsell.id} / ${toteOffer.id}`);

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
  console.log('  shipping   Free Standard');

  const env = [
    '# Auto-generated by scripts/seed.ts',
    `TAGADA_API_KEY=${apiKey}`,
    existing.TAGADA_ACCOUNT_ID ? `TAGADA_ACCOUNT_ID=${existing.TAGADA_ACCOUNT_ID}` : '',
    `TAGADA_STORE_ID=${store.id}`,
    '',
    `VITE_STORE_ID=${store.id}`,
    'VITE_ENVIRONMENT=production',
    `VITE_TEE_VARIANT_ID=${tee.variants[0].id}`,
    `VITE_CAP_OFFER_ID=${capOffer.id}`,
    `VITE_CAP_DOWNSELL_OFFER_ID=${capDownsell.id}`,
    `VITE_TOTE_OFFER_ID=${toteOffer.id}`,
    '',
  ]
    .filter((line) => line !== '')
    .join('\n');

  writeFileSync(envPath, `${env}\n`);
  console.log(`\n  Wrote ${envPath}`);
  console.log('\n  Next: pnpm dev  →  http://localhost:5173');
  console.log('  Test card: 4242 4242 4242 4242 · 12/28 · 123\n');
}

main().catch((err) => {
  console.error('\n  Seed failed\n');
  console.error(err);
  process.exit(1);
});
