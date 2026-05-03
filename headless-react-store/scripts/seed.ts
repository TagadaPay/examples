#!/usr/bin/env tsx
/**
 * seed.ts — Provision a complete demo store in ~10 seconds.
 *
 * Creates, in order:
 *   1. Sandbox processor (test mode, no real charges)
 *   2. Payment flow (single-processor, simple routing)
 *   3. Store (USD/EUR)
 *   4. Six demo apparel products
 *   5. Two post-purchase upsell offers
 *   6. Checkout funnel (checkout → thank-you)
 *   7. .env file pointing the demo at the new store
 *
 * Usage:
 *   pnpm seed <YOUR_API_KEY>
 *   # or
 *   npx tsx scripts/seed.ts <YOUR_API_KEY>
 *
 * Get your API key at https://app.tagada.io → Settings → Access Tokens.
 *
 * To customise this store for your own brand, edit `PRODUCTS` and
 * `STORE_CONFIG` below — that's it.
 */

import TagadaModule from '@tagadapay/node-sdk';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const Tagada = (
  'default' in TagadaModule && typeof (TagadaModule as { default?: unknown }).default === 'function'
    ? (TagadaModule as { default: typeof TagadaModule }).default
    : TagadaModule
) as typeof TagadaModule;

// ─────────────────────────────────────────────────────────────────────────────
// Config — edit these to make the store yours.
// ─────────────────────────────────────────────────────────────────────────────

const STORE_CONFIG = {
  name: 'NORTH — Headless SDK Demo Store',
  baseCurrency: 'USD' as const,
  presentmentCurrencies: ['USD', 'EUR'] as const,
};

interface SeedProduct {
  name: string;
  description: string;
  sku: string;
  imageUrl: string;
  /** Price in MINOR units (cents). 3900 = $39.00 */
  priceCents: number;
  /** Optional crossed-out reference price. */
  compareAtCents?: number;
  /** EUR price in cents (optional). */
  priceCentsEur?: number;
  grams: number;
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    intervalCount: number;
  };
}

const PRODUCTS: SeedProduct[] = [
  {
    name: 'Heavyweight Tee — Stone',
    description: '7.5 oz organic cotton. Boxy fit, garment-dyed for that lived-in feel from day one.',
    sku: 'tee-stone',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&h=1100&fit=crop&q=80',
    priceCents: 4800,
    compareAtCents: 6500,
    priceCentsEur: 4500,
    grams: 320,
  },
  {
    name: 'Brushed Hoodie — Charcoal',
    description: '500 gsm brushed-back fleece. Hidden zip pocket, drawcord-free for a clean silhouette.',
    sku: 'hoodie-charcoal',
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=900&h=1100&fit=crop&q=80',
    priceCents: 12900,
    compareAtCents: 16500,
    priceCentsEur: 11900,
    grams: 740,
  },
  {
    name: 'Wide-Leg Trouser — Olive',
    description: 'Cotton-linen blend with a relaxed leg. Tailored waist, room to move.',
    sku: 'trouser-olive',
    imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=900&h=1100&fit=crop&q=80',
    priceCents: 14500,
    priceCentsEur: 13500,
    grams: 580,
  },
  {
    name: 'Canvas Tote — Natural',
    description: '14 oz heavyweight canvas. Long handles, internal slip pocket. Made to last decades.',
    sku: 'tote-natural',
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=900&h=1100&fit=crop&q=80',
    priceCents: 4200,
    priceCentsEur: 3900,
    grams: 380,
  },
  {
    name: 'Wool Beanie — Black',
    description: 'Merino-cashmere blend, ribbed cuff. Soft enough to forget you have it on.',
    sku: 'beanie-black',
    imageUrl: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=900&h=1100&fit=crop&q=80',
    priceCents: 3800,
    compareAtCents: 4900,
    priceCentsEur: 3500,
    grams: 110,
  },
  {
    name: 'Care Kit — Monthly',
    description: 'Eco-friendly detergent + fabric refresher delivered every month. Keep your wardrobe alive.',
    sku: 'care-kit-monthly',
    imageUrl: 'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=900&h=1100&fit=crop&q=80',
    priceCents: 1900,
    priceCentsEur: 1700,
    grams: 0,
    recurring: { interval: 'month', intervalCount: 1 },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────

const apiKey = process.argv[2];
if (!apiKey) {
  console.error('\n  Usage: pnpm seed <YOUR_API_KEY>\n');
  console.error('  Get your key at: https://app.tagada.io → Settings → Access Tokens\n');
  process.exit(1);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tagada = new (Tagada as any)(apiKey);

const log = (icon: string, msg: string) => console.log(`  ${icon}  ${msg}`);
const sub = (msg: string) => console.log(`     ${msg}`);

function priceMap(usd: number, eur?: number) {
  const out: Record<string, { amount: number }> = { USD: { amount: usd } };
  if (eur) out.EUR = { amount: eur };
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n  ──  Seeding TagadaPay demo store  ──\n');

  // 1. Processor
  log('⚙️ ', 'Creating sandbox processor…');
  const { processor } = await tagada.processors.create({
    processor: {
      name: 'Demo Sandbox',
      type: 'sandbox',
      enabled: true,
      supportedCurrencies: [...STORE_CONFIG.presentmentCurrencies],
      baseCurrency: STORE_CONFIG.baseCurrency,
      options: { testMode: true },
    },
  });
  sub(`processor: ${processor.id}`);

  // 2. Payment flow
  log('🔌 ', 'Creating payment flow…');
  const flow = await tagada.paymentFlows.create({
    data: {
      name: 'Demo Flow',
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
  sub(`paymentFlow: ${flow.id}`);

  // 3. Store
  log('🏬 ', 'Creating store…');
  const store = await tagada.stores.create({
    name: STORE_CONFIG.name,
    baseCurrency: STORE_CONFIG.baseCurrency,
    presentmentCurrencies: [...STORE_CONFIG.presentmentCurrencies],
    chargeCurrencies: [STORE_CONFIG.baseCurrency],
    selectedPaymentFlowId: flow.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  sub(`store: ${store.id}`);

  // 4. Products
  log('📦 ', `Creating ${PRODUCTS.length} products…`);
  const created: Array<{ id: string; variantId: string; priceId: string | null; name: string }> = [];

  for (const p of PRODUCTS) {
    const product = await tagada.products.create({
      storeId: store.id,
      name: p.name,
      description: p.description,
      active: true,
      variants: [
        {
          name: 'Default',
          sku: p.sku,
          grams: p.grams || null,
          active: true,
          default: true,
          imageUrl: p.imageUrl,
          price: p.priceCents,
          compareAtPrice: p.compareAtCents ?? null,
          prices: [
            {
              currencyOptions: priceMap(p.priceCents, p.priceCentsEur),
              recurring: !!p.recurring,
              billingTiming: 'in_advance',
              ...(p.recurring
                ? { interval: p.recurring.interval, intervalCount: p.recurring.intervalCount }
                : {}),
              default: true,
            },
          ],
        },
      ],
    });
    const variant = product.variants[0];
    created.push({
      id: product.id,
      variantId: variant.id,
      priceId: variant.prices?.[0]?.id ?? null,
      name: p.name,
    });
    sub(`✓  ${p.name}`);
  }

  // 5. Upsell offers — wire the cheapest tote + the beanie as 1-click upsells.
  log('🎁 ', 'Creating post-purchase upsells…');

  const tote = created.find((c) => c.name.includes('Tote'));
  const beanie = created.find((c) => c.name.includes('Beanie'));

  if (tote) {
    await tagada.offers.create({
      storeId: store.id,
      offerTitle: 'Add a Canvas Tote — 25% off',
      enabled: true,
      type: 'upsell',
      triggers: [{ productId: null, type: 'any' }],
      offers: [
        {
          productId: tote.id,
          variantId: tote.variantId,
          priceId: tote.priceId,
          title: 'Canvas Tote — Natural',
          titleTrans: { en: 'Add a Canvas Tote — 25% off' },
        },
      ],
      orderBumpOffers: [],
    });
    sub('✓  Upsell: Canvas Tote');
  }

  if (beanie) {
    await tagada.offers.create({
      storeId: store.id,
      offerTitle: 'Throw in a Wool Beanie',
      enabled: true,
      type: 'upsell',
      triggers: [{ productId: null, type: 'any' }],
      offers: [
        {
          productId: beanie.id,
          variantId: beanie.variantId,
          priceId: beanie.priceId,
          title: 'Wool Beanie — Black',
          titleTrans: { en: 'Throw in a Wool Beanie' },
        },
      ],
      orderBumpOffers: [],
    });
    sub('✓  Upsell: Wool Beanie');
  }

  // 6. Funnel
  log('🛒 ', 'Creating checkout funnel…');
  const funnel = await tagada.funnels.create({
    storeId: store.id,
    config: {
      id: 'north-checkout',
      name: 'NORTH Checkout',
      version: '1.0.0',
      nodes: [
        {
          id: 'step_checkout',
          name: 'Checkout',
          type: 'checkout',
          kind: 'step',
          isEntry: true,
          position: { x: 0, y: 0 },
          config: {
            path: '/checkout',
            stepConfig: { payment: { paymentFlowId: flow.id } },
          },
        },
        {
          id: 'step_thankyou',
          name: 'Thank You',
          type: 'thankyou',
          kind: 'step',
          position: { x: 300, y: 0 },
          config: { path: '/thank-you' },
        },
      ],
      edges: [{ id: 'e1', source: 'step_checkout', target: 'step_thankyou' }],
    },
    isDefault: true,
  });
  sub(`funnel: ${funnel.id}`);

  // 7. .env
  const envPath = resolve(import.meta.dirname ?? '.', '..', '.env');
  const envContent = [
    '# Auto-generated by scripts/seed.ts — safe to commit only if values are public.',
    `VITE_STORE_ID=${store.id}`,
    `VITE_ENVIRONMENT=production`,
    '',
    '# Optional: paste a Google Places API key to enable address autocomplete.',
    '# https://developers.google.com/maps/documentation/javascript/places-autocomplete',
    '# VITE_GOOGLE_AUTOCOMPLETE_API_KEY=AIza...',
    '',
  ].join('\n');
  writeFileSync(envPath, envContent);
  log('💾 ', `Wrote .env → ${envPath}`);

  // ─── Done
  console.log('\n  ──  Done. Your store is ready.  ──\n');
  console.log(`  Store ID    ${store.id}`);
  console.log(`  Products    ${created.length}`);
  console.log(`  Upsells     ${[tote, beanie].filter(Boolean).length}`);
  console.log(`  Processor   sandbox (no real charges)\n`);
  console.log('  Next:\n');
  console.log('    pnpm dev     — open the store at http://localhost:5173');
  console.log('    pnpm build   — production build');
  console.log('    pnpm deploy  — push to TagadaPay edge CDN\n');
  console.log('  Test card    4242 4242 4242 4242 · 12/28 · 123\n');
}

main().catch((err) => {
  console.error('\n  ❌  Seed failed:\n');
  console.error(err);
  process.exit(1);
});
