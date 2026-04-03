#!/usr/bin/env tsx
/**
 * seed.ts — Set up a complete TagadaPay demo store in ~10 seconds.
 *
 * Creates:
 *   1. Sandbox processor
 *   2. Payment flow (simple routing)
 *   3. Store with USD/EUR
 *   4. Three demo products (one-time + subscription)
 *   5. Two upsell offers
 *   6. Checkout funnel (checkout → thank-you)
 *
 * Usage:
 *   npx tsx scripts/seed.ts <API_KEY>
 *
 * Output:
 *   A .env file and the Store ID to paste into the demo app.
 */

import TagadaModule from '@tagadapay/node-sdk';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// CJS/ESM interop — handle both `default.default` and `default`
const Tagada = ('default' in TagadaModule && typeof (TagadaModule as any).default === 'function')
  ? (TagadaModule as any).default
  : TagadaModule;

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const apiKey = process.argv[2];
if (!apiKey) {
  console.error('\n  Usage: npx tsx scripts/seed.ts <YOUR_API_KEY>\n');
  console.error('  Get your key at: https://app.tagadapay.com → Settings → Access Tokens\n');
  process.exit(1);
}

const tagada = new Tagada(apiKey);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(icon: string, msg: string) {
  console.log(`  ${icon}  ${msg}`);
}

function price(usd: number, eur?: number) {
  const opts: Record<string, { amount: number }> = { USD: { amount: usd } };
  if (eur) opts.EUR = { amount: eur };
  return opts;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n  ┌─────────────────────────────────────────┐');
  console.log('  │  TagadaPay Demo Store — Seed Script      │');
  console.log('  └─────────────────────────────────────────┘\n');

  // 1 — Processor
  log('⚙️', 'Creating sandbox processor...');
  const { processor } = await tagada.processors.create({
    processor: {
      name: 'Demo Sandbox',
      type: 'sandbox',
      enabled: true,
      supportedCurrencies: ['USD', 'EUR'],
      baseCurrency: 'USD',
      options: { testMode: true },
    },
  });
  log('✓', `Processor: ${processor.id}`);

  // 2 — Payment flow
  log('⚙️', 'Creating payment flow...');
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
  log('✓', `Payment Flow: ${flow.id}`);

  // 3 — Store
  log('🏪', 'Creating store...');
  const store = await tagada.stores.create({
    name: 'Headless SDK Demo Store',
    baseCurrency: 'USD',
    presentmentCurrencies: ['USD', 'EUR'],
    chargeCurrencies: ['USD'],
    selectedPaymentFlowId: flow.id,
  } as any);
  log('✓', `Store: ${store.id}`);

  // 4 — Products
  log('📦', 'Creating products...');

  const product1 = await tagada.products.create({
    storeId: store.id,
    name: 'Premium Wireless Headphones',
    description: 'Noise-cancelling over-ear headphones with 40h battery life',
    active: true,
    variants: [{
      name: 'Default',
      sku: 'headphones-001',
      grams: 250,
      active: true,
      default: true,
      price: 9900,
      compareAtPrice: 12900,
      prices: [{
        currencyOptions: price(9900, 8900),
        recurring: false,
        billingTiming: 'in_advance',
        default: true,
      }],
    }],
  });
  log('  ', `  → ${product1.id} (Headphones)`);

  const product2 = await tagada.products.create({
    storeId: store.id,
    name: 'USB-C Fast Charger',
    description: '65W GaN charger — phones, tablets, and laptops',
    active: true,
    variants: [{
      name: 'Default',
      sku: 'charger-001',
      grams: 120,
      active: true,
      default: true,
      price: 2900,
      compareAtPrice: 3900,
      prices: [{
        currencyOptions: price(2900, 2500),
        recurring: false,
        billingTiming: 'in_advance',
        default: true,
      }],
    }],
  });
  log('  ', `  → ${product2.id} (Charger)`);

  const product3 = await tagada.products.create({
    storeId: store.id,
    name: 'Cloud Storage Plan',
    description: '1TB secure cloud storage — billed monthly',
    active: true,
    variants: [{
      name: 'Monthly',
      sku: 'cloud-monthly',
      grams: null,
      active: true,
      default: true,
      price: 999,
      compareAtPrice: null,
      prices: [{
        currencyOptions: price(999, 899),
        recurring: true,
        billingTiming: 'in_advance',
        interval: 'month',
        intervalCount: 1,
        default: true,
      }],
    }],
  });
  log('  ', `  → ${product3.id} (Subscription)`);

  // 5 — Upsell offers
  log('🎁', 'Creating upsell offers...');

  const variant1 = product1.variants[0];
  const variant2 = product2.variants[0];

  await tagada.offers.create({
    storeId: store.id,
    offerTitle: 'Add a Fast Charger — 25% off',
    enabled: true,
    type: 'upsell',
    triggers: [{ productId: null, type: 'any' }],
    offers: [{
      productId: product2.id,
      variantId: variant2.id,
      priceId: variant2.prices[0]?.id ?? null,
      title: 'USB-C Fast Charger',
      titleTrans: { en: 'Add a Fast Charger — 25% off' },
    }],
    orderBumpOffers: [],
  });
  log('  ', '  → Upsell: Fast Charger after any purchase');

  await tagada.offers.create({
    storeId: store.id,
    offerTitle: 'Upgrade to Premium Headphones',
    enabled: true,
    type: 'upsell',
    triggers: [{ productId: null, type: 'any' }],
    offers: [{
      productId: product1.id,
      variantId: variant1.id,
      priceId: variant1.prices[0]?.id ?? null,
      title: 'Premium Wireless Headphones',
      titleTrans: { en: 'Upgrade to Premium Headphones — $99' },
    }],
    orderBumpOffers: [],
  });
  log('  ', '  → Upsell: Premium Headphones after any purchase');

  // 6 — Funnel
  log('🔀', 'Creating checkout funnel...');

  const funnel = await tagada.funnels.create({
    storeId: store.id,
    config: {
      id: 'demo-checkout',
      name: 'Demo Checkout',
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
            stepConfig: {
              payment: { paymentFlowId: flow.id },
            },
          },
        },
        {
          id: 'step_thankyou',
          name: 'Thank You',
          type: 'thankyou',
          kind: 'step',
          position: { x: 300, y: 0 },
          config: { path: '/thankyou' },
        },
      ],
      edges: [{ id: 'e1', source: 'step_checkout', target: 'step_thankyou' }],
    },
    isDefault: true,
  });
  log('✓', `Funnel: ${funnel.id}`);

  // 7 — Write .env
  const envPath = resolve(import.meta.dirname ?? '.', '..', '.env');
  const envContent = [
    '# Auto-generated by scripts/seed.ts',
    `VITE_STORE_ID=${store.id}`,
    `VITE_ENVIRONMENT=production`,
    '',
  ].join('\n');
  writeFileSync(envPath, envContent);
  log('💾', `Wrote .env → ${envPath}`);

  // Done
  console.log('\n  ┌─────────────────────────────────────────┐');
  console.log('  │  ✅  Demo store ready!                    │');
  console.log('  └─────────────────────────────────────────┘');
  console.log(`\n  Store ID:    ${store.id}`);
  console.log(`  Products:    3 (2 one-time, 1 subscription)`);
  console.log(`  Upsells:     2`);
  console.log(`  Processor:   Sandbox (test mode)\n`);
  console.log('  Run the app:\n');
  console.log('    pnpm dev\n');
  console.log(`  Then enter store ID: ${store.id}\n`);
  console.log('  Test card: 4242 4242 4242 4242 | 12/28 | 123\n');
}

main().catch((err) => {
  console.error('\n  ❌  Seed failed:\n');
  console.error(err);
  process.exit(1);
});
