import 'dotenv/config';
import Tagada from '@tagadapay/node-sdk';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CRM_KEY = process.env.TAGADA_API_KEY;
if (!CRM_KEY) {
  console.error('Set TAGADA_API_KEY in .env first');
  process.exit(1);
}

const tagada = new Tagada(CRM_KEY);
const STORE_ID = process.env.TAGADA_STORE_ID;
// Your live TagadaPay account (tpa_xxx) — informational, the flow routes via
// the tagadapay-router processor which is already bound to it.
const TPA_ID = process.env.TAGADA_TPA_ID ?? '';

async function main() {
  console.log('Seeding SaaS billing demo...\n');

  // 1. Find the tagadapay-router processor (live TPA) and sandbox processor
  const { processors } = await tagada.processors.list();
  const router = processors.find((p) => p.type === 'tagadapay-router');
  const sandbox = processors.find((p) => p.type === 'sandbox');

  if (!router) throw new Error('No tagadapay-router processor found on this account');
  if (!sandbox) throw new Error('No sandbox processor found — create one in the dashboard first');

  console.log(`TPA router: ${router.id} → ${TPA_ID}`);
  console.log(`Sandbox:    ${sandbox.id}`);

  // 2. Create a cascade payment flow — sandbox first for dev, TPA router as fallback
  const flow = await tagada.paymentFlows.create({
    data: {
      name: 'SaaS Billing Flow',
      strategy: 'cascade',
      fallbackMode: true,
      maxFallbackRetries: 2,
      threeDsEnabled: true,
      stickyProcessorEnabled: true,
      pickProcessorStrategy: 'weighted',
      processorConfigs: [
        { processorId: sandbox.id, weight: 100, disabled: false, nonStickable: false },
      ],
      fallbackProcessorConfigs: [
        { processorId: router.id, orderIndex: 0 },
      ],
    },
  });
  console.log(`Payment flow: ${flow.id} (cascade: sandbox → tagadapay-router)`);

  // 3. Assign flow — pass paymentFlowId on each charge (see server/index.ts).
  if (!STORE_ID) throw new Error('Set TAGADA_STORE_ID in .env');
  console.log(`Store: ${STORE_ID} (flow ${flow.id} passed via paymentFlowId)`);

  // 4. Create recurring SaaS product
  const product = await tagada.products.create({
    storeId: STORE_ID,
    name: 'SaaS Pro Plan',
    description: 'Monthly subscription — TagadaPay SaaS billing demo',
    active: true,
    isShippable: false,
    isTaxable: false,
    variants: [{
      name: 'Monthly',
      sku: `saas-pro-monthly-${Date.now()}`,
      grams: null,
      active: true,
      default: true,
      price: 1900,
      compareAtPrice: null,
      prices: [{
        currencyOptions: { EUR: { amount: 1900 } },
        recurring: true,
        billingTiming: 'subscription',
        interval: 'month',
        intervalCount: 1,
        default: true,
      }],
    }],
  });

  const priceId = product.variants![0].prices![0].id!;
  console.log(`Product: ${product.id}, price: ${priceId}`);

  // 5. Write .env additions
  const envPath = resolve(import.meta.dirname, '../.env');
  const lines = [
    `TAGADA_PAYMENT_FLOW_ID=${flow.id}`,
    `SAAS_PRICE_ID=${priceId}`,
    `SAAS_PLAN_NAME=Pro`,
    `SAAS_PLAN_AMOUNT=1900`,
    `SAAS_PLAN_CURRENCY=EUR`,
    `TAGADA_TPA_ID=${TPA_ID}`,
  ];
  const { readFileSync, existsSync } = await import('node:fs');
  let env = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
  for (const line of lines) {
    const key = line.split('=')[0];
    if (env.includes(`${key}=`)) {
      env = env.replace(new RegExp(`^${key}=.*$`, 'm'), line);
    } else {
      env += (env.endsWith('\n') || env.length === 0 ? '' : '\n') + line + '\n';
    }
  }
  writeFileSync(envPath, env);

  console.log('\nDone. Updated .env with flow, price, and TPA ids.');
  console.log('Run: pnpm dev');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
