#!/usr/bin/env tsx
/**
 * apply-tpa.ts — Go from a fresh Tagada account to a real payment account (TPA).
 *
 * A TPA (TagadaPay Account, id `tpa_xxx`) is a KYB-approved legal entity that
 * can charge real cards through an acquirer (Adyen / Stripe) behind Tagada.
 * The sandbox processor `seed.ts` creates never touches a bank; a TPA does.
 *
 * You don't "create" a TPA directly — you APPLY for one. Our team runs KYB and,
 * once approved, provisions the TPA under your account. This script drives that
 * whole journey from the terminal, in three steps:
 *
 *   1. APPLY     pnpm apply-tpa <CRM_KEY>
 *                → submits the application below (edit APPLICATION first).
 *                  Prints an application id (ent_xxx) and any missing fields.
 *
 *   2. CHECK     pnpm apply-tpa <CRM_KEY> --status ent_xxx
 *                → polls the application. When approved, `tpaId` is populated.
 *
 *   3. LIST      pnpm apply-tpa <CRM_KEY> --tpas
 *                → lists the activated TPAs on your account and prints the exact
 *                  `pnpm seed … --tpa tpa_xxx` command to plug one into the store.
 *
 * <CRM_KEY> is a `sk_crm_…` key — the same key `seed.ts` uses. Get one from
 * `tagada-init` (writes it to .env as TAGADA_API_KEY) or the dashboard
 * (app.tagada.io → Settings → Access Tokens).
 *
 * Docs: https://docs.tagada.io/developer-tools/node-sdk/processing-applications
 */

import TagadaModule from '@tagadapay/node-sdk';

const Tagada = (
  'default' in TagadaModule && typeof (TagadaModule as { default?: unknown }).default === 'function'
    ? (TagadaModule as { default: typeof TagadaModule }).default
    : TagadaModule
) as typeof TagadaModule;

// ─────────────────────────────────────────────────────────────────────────────
// The application you're submitting. Edit this to YOUR real business + rep.
//
// Only 5 fields are strictly required (businessName, country, and the rep's
// firstName / lastName / email). Everything else is "recommended" — the API
// won't reject it, but acquirers verify it before activation, so a complete
// application is approved much faster. The `create()` call echoes whatever is
// still missing in `recommendations`.
//
// Full field reference (FR / US, banking rails, documents):
// https://docs.tagada.io/developer-tools/node-sdk/processing-applications
// ─────────────────────────────────────────────────────────────────────────────

const APPLICATION = {
  businessInfo: {
    // ── Required ──
    businessName: 'ACME COMMERCE',
    country: 'FR', // ISO 3166-1 alpha-2
    // ── Recommended (acquirer KYB) ──
    activityType: 'business',
    legalEntityType: 'sas', // sas | sarl | sa | llc | ltd | inc | corporation …
    registrationNumber: '123456789', // SIREN / company no. (US: the 9-digit EIN)
    taxId: 'FR00123456789', // VAT (US: the same EIN as registrationNumber)
    website: 'https://example.com',
    mcc: '5734',
    email: 'ops@example.com',
    phone: '+33123456789', // E.164
    address: { street: '1 Rue de l’Exemple', city: 'Paris', postalCode: '75001', country: 'FR' },
    // ── Optional (risk profile) ──
    businessModel: 'Ecommerce (apparel)',
    monthlyVolume: '10000',
    desiredCurrencies: ['EUR'],
  },
  representative: {
    // ── Required ──
    firstName: 'Jeanne',
    lastName: 'Dupont',
    email: 'jeanne@example.com',
    // ── Recommended (KYC) ──
    phone: '+33123456789',
    title: 'signatory',
    dateOfBirth: '1990-01-01',
    nationality: 'FR',
    idType: 'identityCard', // passport | identityCard | driversLicense | nationalIdNumber
    idNumber: 'X0000000',
    idCountry: 'FR',
    idExpiry: '2030-01-01',
    residentialAddress: { street: '2 Avenue Imaginaire', city: 'Paris', postalCode: '75002', country: 'FR' },
  },
  // ── Recommended: settlement account. Holder MUST match the legal entity. ──
  bankAccount: {
    accountHolderName: 'SAS ACME COMMERCE',
    iban: 'FR7630006000011234567890189', // SEPA rail (US: routingNumber + accountNumber)
    bic: 'AGRIFRPPXXX',
    currency: 'EUR',
    country: 'FR',
  },
  source: 'sdk_self_serve',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const apiKey = args.find((a) => !a.startsWith('--'));

const statusIdx = args.findIndex((a) => a === '--status');
const applicationId = statusIdx === -1 ? undefined : args[statusIdx + 1];
const listTpas = args.includes('--tpas');

if (!apiKey) {
  console.error('\n  Usage:');
  console.error('    pnpm apply-tpa <CRM_KEY>                  submit an application');
  console.error('    pnpm apply-tpa <CRM_KEY> --status ent_x  poll an application');
  console.error('    pnpm apply-tpa <CRM_KEY> --tpas          list activated TPAs\n');
  console.error('  CRM_KEY is a sk_crm_… key (from tagada-init or app.tagada.io).\n');
  process.exit(1);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tagada = new (Tagada as any)(apiKey);

async function submit() {
  console.log('\n  ──  Submitting processing application  ──\n');
  console.log(`  Business    ${APPLICATION.businessInfo.businessName} (${APPLICATION.businessInfo.country})`);
  console.log(`  Rep         ${APPLICATION.representative.firstName} ${APPLICATION.representative.lastName}\n`);

  const app = await tagada.processing.applications.create(APPLICATION);

  console.log(`  ✓  Application submitted: ${app.id}`);
  console.log(`     Status: ${app.status}`);

  if (app.recommendations?.length) {
    console.log('\n  ⚠️  Recommended fields still missing (acquirers will ask for these):');
    for (const r of app.recommendations) console.log(`       - ${r}`);
    console.log('     Fill them in APPLICATION above (or the dashboard) to get approved faster.');
  }
  if (app.documentWarnings?.length) {
    console.log('\n  ⚠️  Document warnings:');
    for (const w of app.documentWarnings) console.log(`       - [${w.code}] ${w.message}`);
  }

  console.log('\n  Next:');
  console.log(`    pnpm apply-tpa ${apiKey} --status ${app.id}    # poll until approved`);
  console.log(`    pnpm apply-tpa ${apiKey} --tpas                # once approved, get the tpa_id\n`);
}

async function status(id: string) {
  console.log(`\n  ──  Application ${id}  ──\n`);
  const app = await tagada.processing.applications.retrieve(id);
  console.log(`  Status   ${app.status}`);
  console.log(`  TPA      ${app.tpaId ?? '— (not provisioned yet)'}`);
  if (app.kycStatus) console.log(`  KYC      ${app.kycStatus}`);

  if (app.tpaId) {
    console.log('\n  ✓  Approved — your TPA is provisioned. When it shows as activated:');
    console.log(`       pnpm apply-tpa ${apiKey} --tpas   # confirm it's ready + get the seed command\n`);
  } else {
    console.log('\n  Still in review. Re-run this command in a bit.\n');
  }
}

async function tpas() {
  console.log('\n  ──  Activated TPAs on this account  ──\n');
  // A TPA becomes usable when Tagada auto-creates its `tagadapay-router`
  // processor at activation. So the router processors on your account ARE your
  // ready-to-charge TPAs — this is exactly what `seed.ts --tpa` looks up.
  const { processors } = await tagada.processors.list();
  const routers = processors.filter((p) => p.type === 'tagadapay-router');

  if (routers.length === 0) {
    console.log('  No activated TPAs yet.');
    console.log('  A TPA appears here once it is APPROVED and ACTIVATED (which auto-creates');
    console.log('  its router processor). If you just applied, it is still in review —');
    console.log(`  poll with:  pnpm apply-tpa ${apiKey} --status <ent_id>\n`);
    return;
  }

  for (const r of routers) {
    const tpaId = (r.options as { tagadapayAccountId?: string } | undefined)?.tagadapayAccountId;
    console.log(`  • ${tpaId ?? '(unknown tpa)'}   processor ${r.id}`);
  }
  const first = (routers[0].options as { tagadapayAccountId?: string } | undefined)?.tagadapayAccountId;
  console.log('\n  Plug one into the store (real charges — use a real card, refund test orders):');
  console.log(`    pnpm seed ${apiKey} --tpa ${first ?? 'tpa_xxx'}\n`);
}

const run = applicationId ? status(applicationId) : listTpas ? tpas() : submit();

run.catch((err: unknown) => {
  console.error('\n  ❌  Failed:\n');
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
