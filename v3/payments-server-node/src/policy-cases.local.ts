import { tagada, storeId, paymentMethodId, returnUrl } from './tagada.ts';
const P = tagada.payments.v3, o = { mode: 'test' as const };
const A = 'processor_33105acdab71'; // sandbox
const pm = await paymentMethodId();
const procs = await P.processors.list(undefined, o);
const B = procs.data.find((p) => p.id !== A)!.id;
const base = (await P.paymentPolicies.list(undefined, o)).data.find((p) => p.bindings.some((b) => b.store === storeId))!;
const draft: any = JSON.parse(JSON.stringify(base.draft));
const show = async (label: string, d: any) => {
  try { await P.paymentPolicies.updateDraft(base.id, { draft: d }, o); const r = await P.paymentPolicies.publish(base.id, o); console.log('OK  ', label, '-> v' + r.active_version?.version); return true; }
  catch (e: any) { console.log('FAIL', label, e.statusCode, e.code, JSON.stringify(e.raw?.error?.details ?? '').slice(0, 300)); return false; }
};
const route = async (body: any) => {
  const p = await P.payments.create({ store: storeId, amount: 4900, currency: 'USD', payment_method: await paymentMethodId(), confirm: true, return_url: returnUrl, ...body }, o);
  const tl: any = await P.payments.timeline(p.id, o);
  const planned = JSON.stringify(tl).match(/"ruleId":"([^"]+)"/);
  return `${p.id} ${p.status} policy=${p.policy_version} rule=${planned?.[1]}`;
};
// 1. split 50/50
const d1 = structuredClone(draft); d1.routing = { rules: [], everything_else: { pick: 'split', processors: [A, B], shares: { [A]: 50, [B]: 50 } } }; d1.backups.enabled = true;
await show('split 50/50 + backups', d1);
// 2. renewals stay on initial processor + tag rule + amount rule
const d2 = structuredClone(d1);
d2.routing.rules = [
  { id: 'renewals-stay', when: [{ field: 'purpose', op: 'in', values: ['renewal'] }], then: { pick: 'split', prefer: 'initial_processor', processors: [A], shares: { [A]: 100 } } },
  { id: 'promo-funnel', when: [{ field: 'tag', op: 'in', values: ['funnel=promo'] }], then: { pick: 'processor', processors: [A] } },
  { id: 'big-orders', when: [{ field: 'amount', op: 'gte', value: 50000 }], then: { pick: 'processor', processors: [A] } },
];
if (await show('renewals + tag + amount rules', d2)) {
  console.log('  tag   :', await route({ routing_tags: ['funnel=promo'] }));
  console.log('  amount:', await route({ amount: 60000 }));
  console.log('  else  :', await route({}));
}
// 3. per-checkout policy
const pol2 = await P.paymentPolicies.create({ name: 'Checkout promo', draft: { ...structuredClone(d1), routing: { rules: [], everything_else: { pick: 'processor', processors: [A] } } } }, o);
await P.paymentPolicies.publish(pol2.id, o);
const asg = await P.paymentPolicies.assign(pol2.id, { store: storeId, checkout: 'promo_checkout' }, o);
console.log('assign checkout ->', JSON.stringify(asg).slice(0, 160));
console.log('  checkout:', await route({ checkout: 'promo_checkout' }));
console.log('  default :', await route({}));
