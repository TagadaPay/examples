/**
 * Deploy the headless-react example to TagadaPay's edge CDN.
 *
 * Usage:
 *   npm run build
 *   TAGADA_API_KEY=your-api-key npx tsx scripts/deploy.ts
 *
 * This uses tagada.plugins.deployDirectory() which handles everything
 * automatically: file collection, MIME detection, base64 encoding (or
 * ZIP + blob upload for builds > 3.5 MB), instantiation, and mounting.
 */

import { join } from 'path';

const apiKey = process.env.TAGADA_API_KEY;
if (!apiKey) {
  console.error('Missing TAGADA_API_KEY environment variable');
  process.exit(1);
}

const sdk = await import('@tagadapay/node-sdk');
const Tagada = sdk.Tagada || sdk.default;
const tagada = new Tagada({ apiKey, timeout: 180_000 });

async function main() {
  const stores = await tagada.stores.list();
  const storeId = stores.data[0]?.id;
  if (!storeId) throw new Error('No store found — create one first in the dashboard');

  console.log(`\nDeploying to store ${storeId}...`);

  const result = await tagada.plugins.deployDirectory({
    directory: join(import.meta.dirname, '..', 'dist'),
    storeId,
    name: 'headless-react-example',
    version: '1.0.0',
  });

  console.log(`\nDone! ${result.uploadedFiles} files deployed.`);
  console.log(`Live at: ${result.url}\n`);
}

main().catch(err => {
  console.error('Deploy failed:', err.message);
  process.exit(1);
});
