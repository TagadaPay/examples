/**
 * Deploy this store to TagadaPay's edge CDN.
 *
 * Usage:
 *   pnpm build
 *   TAGADA_API_KEY=tgd_xxx pnpm deploy
 *
 * Picks the first store on your account (perfect for the demo). For production
 * you'll want to pass an explicit `storeId` env var or hardcode it below.
 */

import { join } from 'node:path';

const apiKey = process.env.TAGADA_API_KEY;
if (!apiKey) {
  console.error('Missing TAGADA_API_KEY environment variable');
  process.exit(1);
}

const sdk = await import('@tagadapay/node-sdk');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Tagada: any = (sdk as any).Tagada || (sdk as any).default;
const tagada = new Tagada({ apiKey, timeout: 180_000 });

async function main() {
  const explicitStoreId = process.env.TAGADA_STORE_ID;
  const storeId = explicitStoreId ?? (await tagada.stores.list()).data[0]?.id;
  if (!storeId) throw new Error('No store found — run `pnpm seed <API_KEY>` first.');

  console.log(`\nDeploying to store ${storeId}…`);

  const result = await tagada.plugins.deployDirectory({
    directory: join(import.meta.dirname ?? '.', '..', 'dist'),
    storeId,
    name: 'headless-react-store',
    version: '1.0.0',
  });

  console.log(`\n✓ Deployed ${result.uploadedFiles} files.`);
  console.log(`  Live at: ${result.url}\n`);
}

main().catch((err: unknown) => {
  console.error('Deploy failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
