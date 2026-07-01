/*
 * test-graphql.ts — golden test for the N+1 / DataLoader engine (src/lib/graphql.ts). Run by run-tests.ts.
 * Deterministic assertions; process.exit(1) on any failure so the runner marks it red.
 * Scenarios pin the module's core claims: naive fan-out = N+1 queries, DataLoader batches to 2 and
 * de-duplicates repeated author keys, the batch is a single `IN (…)` over distinct ids, and the plan
 * is deterministic.
 */
import { plan, buildPosts, AUTHORS, type Plan } from '../src/lib/graphql';

let failures = 0;
function assert(cond: unknown, msg: string): void {
  if (!cond) {
    failures++;
    console.error('  ✖ ' + msg);
  }
}
const eq = (a: number[], b: number[]): boolean => a.length === b.length && a.every((x, i) => x === b[i]);
const naive = (posts: number): Plan => plan({ posts, batched: false });
const batched = (posts: number): Plan => plan({ posts, batched: true });

// 0 · Dataset: posts cycle through the fixed author cast, so authors repeat once N > AUTHORS.length.
{
  const posts = buildPosts(5);
  assert(posts.length === 5, `buildPosts(5) → 5 posts (got ${posts.length})`);
  assert(eq(posts.map((p) => p.authorId), [1, 2, 3, 1, 2]), `author ids cycle 1,2,3,1,2 (got ${posts.map((p) => p.authorId).join(',')})`);
  assert(posts.every((p, i) => p.id === i + 1), 'post ids are 1..N');
  assert(AUTHORS.length === 3, 'three authors in the cast');
}

// 1 · The N+1 problem: naive issues 1 list query + one author query per post.
{
  const r = naive(5);
  assert(r.totalQueries === 6, `naive(5) = N+1 = 6 queries (got ${r.totalQueries})`);
  assert(r.queries[0].kind === 'list' && r.queries[0].step === 1, 'first query is the posts list at step 1');
  assert(r.queries[0].table === 'posts' && r.queries[0].sql.includes('FROM posts') && r.queries[0].sql.includes('LIMIT 5'), 'list query selects from posts with LIMIT N');
  const perItem = r.queries.filter((q) => q.kind === 'per-item');
  assert(perItem.length === 5, `5 per-item author queries (got ${perItem.length})`);
  assert(perItem.every((q) => q.table === 'users' && q.sql.includes('WHERE id =')), 'each author query is WHERE id = ? on users');
  assert(eq(perItem.map((q) => q.step), [2, 3, 4, 5, 6]), 'per-item queries fire on steps 2..6');
  assert(eq(perItem.map((q) => q.keys[0]), [1, 2, 3, 1, 2]), 'per-item keys follow the posts (no de-dup)');
  assert(r.totalSteps === 6, `naive(5) plays through 6 steps (got ${r.totalSteps})`);
}

// 2 · DataLoader: 1 list + 1 batched IN query = 2, whatever N is.
{
  const r = batched(5);
  assert(r.totalQueries === 2, `batched(5) = 2 queries (got ${r.totalQueries})`);
  const batch = r.queries[1];
  assert(batch.kind === 'batch' && batch.step === 2, 'the batch is the second query, at step 2');
  assert(eq(batch.keys, [1, 2, 3]), `batch de-duplicates to distinct sorted ids [1,2,3] (got ${batch.keys.join(',')})`);
  assert(batch.sql.includes('WHERE id IN (1, 2, 3)'), `batch is a single IN query (got "${batch.sql}")`);
  assert(r.totalSteps === 2, 'batched(5) plays through 2 steps');
}

// 3 · De-duplication is real: 8 posts, still 3 distinct authors → batch stays 2 while naive grows to 9.
{
  const n8 = batched(8);
  const naive8 = naive(8);
  assert(n8.distinctAuthors === 3, `8 posts → 3 distinct authors (got ${n8.distinctAuthors})`);
  assert(eq(n8.queries[1].keys, [1, 2, 3]), 'batch of 8 posts still asks for 3 distinct ids');
  assert(n8.totalQueries === 2, 'batched(8) stays at 2 queries');
  assert(naive8.totalQueries === 9, `naive(8) = 9 queries (got ${naive8.totalQueries})`);
}

// 4 · Batched always beats naive for N ≥ 2, and both plans agree on the two counterfactual counts.
{
  for (const n of [3, 5, 8]) {
    const b = batched(n);
    const nv = naive(n);
    assert(b.totalQueries < nv.totalQueries, `batched(${n}) < naive(${n})`);
    assert(nv.naiveQueries === n + 1 && b.naiveQueries === n + 1, `both plans report naiveQueries = ${n + 1}`);
    assert(nv.batchedQueries === 2 && b.batchedQueries === 2, 'both plans report batchedQueries = 2');
    assert(b.distinctAuthors === Math.min(n, 3), `distinctAuthors = min(${n},3)`);
  }
}

// 5 · Edge: zero posts → just the list query, nothing to batch, no crash.
{
  const b0 = batched(0);
  const n0 = naive(0);
  assert(n0.totalQueries === 1 && b0.totalQueries === 1, 'zero posts → 1 query (list only) for both');
  assert(b0.distinctAuthors === 0, 'zero posts → 0 distinct authors');
  assert(b0.queries.every((q) => q.kind !== 'batch'), 'no batch query when there are no posts');
}

// 6 · Determinism: identical input → identical plan.
{
  assert(JSON.stringify(naive(5)) === JSON.stringify(naive(5)), 'naive plan is deterministic');
  assert(JSON.stringify(batched(8)) === JSON.stringify(batched(8)), 'batched plan is deterministic');
}

if (failures > 0) {
  console.error(`\n✖ test-graphql: ${failures} failure(s).`);
  process.exit(1);
}
console.log('✓ test-graphql — N+1 vs DataLoader: fan-out N+1, batch to 2, de-dup to distinct IN(), deterministic all pass.');
