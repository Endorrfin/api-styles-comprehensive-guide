/*
 * test-rest.ts — golden test for the REST lifecycle engine (src/lib/rest.ts). Run by run-tests.ts.
 * Deterministic assertions; process.exit(1) on any failure so the runner marks it red.
 */
import { maturityShape, planLifecycle, transferCost } from '../src/lib/rest';
import type { StepId } from '../src/lib/rest';

let failures = 0;
function assert(cond: unknown, msg: string): void {
  if (!cond) {
    failures++;
    console.error('  ✖ ' + msg);
  }
}
const ids = (o: Parameters<typeof planLifecycle>[0]): StepId[] => planLifecycle(o).steps.map((s) => s.id);

// 1 · Cold cache → straight to origin, full 200.
{
  const r = planLifecycle({ warmCache: false, expired: false, useEtag: true, resourceChanged: false });
  assert(r.status === 200, 'cold: status 200');
  assert(r.transfer === 'full', 'cold: transfer full');
  assert(r.reachedOrigin === true, 'cold: reached origin');
  assert(JSON.stringify(ids({ warmCache: false, expired: false, useEtag: true, resourceChanged: false })) ===
    JSON.stringify(['request', 'cache', 'origin', 'response']), 'cold: step order');
  assert(r.steps[1].outcome === 'miss', 'cold: cache miss');
}

// 2 · Warm + fresh → served from cache, origin never touched.
{
  const r = planLifecycle({ warmCache: true, expired: false, useEtag: true, resourceChanged: true });
  assert(r.status === 200, 'fresh: status 200');
  assert(r.transfer === 'served-from-cache', 'fresh: served-from-cache');
  assert(r.reachedOrigin === false, 'fresh: origin not reached');
  assert(!r.steps.some((s) => s.id === 'origin'), 'fresh: no origin step');
  assert(r.steps.some((s) => s.outcome === 'fresh'), 'fresh: cache fresh outcome');
}

// 3 · Warm + stale + ETag + unchanged → cheap 304 revalidation.
{
  const r = planLifecycle({ warmCache: true, expired: true, useEtag: true, resourceChanged: false });
  assert(r.status === 304, 'revalidate-304: status 304');
  assert(r.transfer === 'validator-only', 'revalidate-304: validator-only transfer');
  assert(r.reachedOrigin === true, 'revalidate-304: reached origin');
  assert(r.steps.some((s) => s.id === 'revalidate' && s.outcome === 'conditional'), 'revalidate-304: conditional step');
  assert(r.steps[r.steps.length - 1].outcome === 'not-modified', 'revalidate-304: ends 304');
}

// 4 · Warm + stale + ETag + changed → revalidate then full 200.
{
  const r = planLifecycle({ warmCache: true, expired: true, useEtag: true, resourceChanged: true });
  assert(r.status === 200, 'revalidate-changed: status 200');
  assert(r.transfer === 'full', 'revalidate-changed: full transfer');
  assert(r.steps.some((s) => s.id === 'revalidate'), 'revalidate-changed: has revalidate');
  assert(r.steps.some((s) => s.outcome === 'compared-diff'), 'revalidate-changed: compared-diff');
}

// 5 · Warm + stale + no ETag → full refetch (no conditional possible).
{
  const r = planLifecycle({ warmCache: true, expired: true, useEtag: false, resourceChanged: false });
  assert(r.status === 200, 'no-etag: status 200');
  assert(r.transfer === 'full', 'no-etag: full transfer');
  assert(!r.steps.some((s) => s.id === 'revalidate'), 'no-etag: no revalidate step');
}

// 6 · Transfer cost ordering: full > validator-only > cached.
assert(transferCost('full') > transferCost('validator-only'), 'cost: full > validator');
assert(transferCost('validator-only') > transferCost('served-from-cache'), 'cost: validator > cached');
assert(transferCost('served-from-cache') === 0, 'cost: cached is 0');

// 7 · Richardson maturity ladder.
assert(maturityShape(0).verb === 'POST' && !maturityShape(0).resources, 'maturity 0: RPC POST /api');
assert(maturityShape(2).verb === 'GET' && maturityShape(2).verbs && !maturityShape(2).hypermedia, 'maturity 2: verbs, no hypermedia');
assert(maturityShape(3).hypermedia === true, 'maturity 3: hypermedia');

if (failures > 0) {
  console.error(`\n✖ test-rest: ${failures} failure(s).`);
  process.exit(1);
}
console.log('✓ test-rest — REST lifecycle engine: all scenarios pass.');
