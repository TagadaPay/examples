/**
 * Payment policies are the V3 payment flow of a store: which processor takes a payment, the backups, the capture
 * and renewal rules. This script reads the policy of your store and, with --publish, splits new payments evenly
 * between its active processors, with backups on.
 *
 *   pnpm policy             show the store's policy and processors (reads only)
 *   pnpm policy --publish   save the new routing as a draft, then publish it (changes how the store routes)
 */
import { TagadaAPIError } from '@tagadapay/node-sdk';
import { inMode, mode, storeId, tagada, write, requestIdOf } from './tagada.ts';

const publish = process.argv.includes('--publish');

try {
  const processors = await tagada.payments.v3.processors.list(undefined, inMode);
  const active = processors.data.filter((p) => p.status === 'active');
  console.log(`processors (${mode}): ${processors.data.map((p) => `${p.id} ${p.name} ${p.status}`).join(', ')}`);

  const policies = await tagada.payments.v3.paymentPolicies.list(undefined, inMode);
  const policy = policies.data.find((p) => p.bindings.some((b) => b.store === storeId && b.checkout === null));
  if (!policy) {
    console.log(`no policy is bound to ${storeId} in ${mode} mode`);
    process.exit(1);
  }
  const draft = policy.draft as {
    routing: { rules: unknown[]; everything_else: Record<string, unknown> };
    backups: { enabled: boolean };
  };
  console.log(`policy ${policy.id} "${policy.name}", active version ${policy.active_version?.version}`);
  console.log(`  routing now: ${JSON.stringify(draft.routing.everything_else)}`);
  console.log(`  backups now: ${draft.backups.enabled ? 'on' : 'off'}`);

  if (!publish) process.exit(0);
  if (active.length === 0) {
    console.log('no active processor to route to');
    process.exit(1);
  }

  // Even split of new payments; rules (e.g. renewals on their first processor) are kept as they are.
  const share = Math.floor(100 / active.length);
  const shares = Object.fromEntries(active.map((p, i) => [p.id, i === 0 ? 100 - share * (active.length - 1) : share]));
  draft.routing.everything_else = { pick: 'split', processors: active.map((p) => p.id), shares };
  draft.backups.enabled = true;

  await tagada.payments.v3.paymentPolicies.updateDraft(policy.id, { draft }, write());
  const published = await tagada.payments.v3.paymentPolicies.publish(policy.id, write());
  console.log(`published version ${published.active_version?.version}: ${JSON.stringify(shares)}, backups on`);
} catch (error) {
  if (error instanceof TagadaAPIError) {
    // A draft that cannot run is refused with its problems in error.raw.error.details.
    console.error(`${error.statusCode} ${error.code}: ${error.message} (request ${requestIdOf(error)})`);
    console.error(JSON.stringify((error.raw as { error?: { details?: unknown } })?.error?.details ?? null, null, 2));
    process.exit(1);
  }
  throw error;
}
