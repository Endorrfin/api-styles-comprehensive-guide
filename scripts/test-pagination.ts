/*
 * test-pagination.ts — golden test for the pagination engine (src/lib/pagination.ts). Run by run-tests.ts.
 * Deterministic assertions; process.exit(1) on any failure so the runner marks it red.
 * Pins the module's core claims: on a stable dataset offset and cursor return IDENTICAL pages; under
 * inserts the offset walk re-serves exactly the shifted rows (duplicates) while cursor re-serves none;
 * under deletes the offset walk silently skips exactly the rows that slid up past its window while
 * cursor skips none; cursor pages always continue strictly below the last-seen id; and every run is
 * deterministic.
 */
import {
  PAGES,
  PAGE_SIZE,
  SCENARIOS,
  STRATEGIES,
  compare,
  mutationFor,
  run,
} from '../src/lib/pagination';

let failures = 0;
function assert(cond: unknown, msg: string): void {
  if (!cond) {
    failures++;
    console.error('  ✖ ' + msg);
  }
}
const eq = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

// 0 · Structural invariants hold for every strategy × scenario.
for (const st of STRATEGIES) {
  for (const sc of SCENARIOS) {
    const r = run(st, sc);
    const tag = `[${st} · ${sc}]`;
    assert(r.pages.length === PAGES, `${tag} walks ${PAGES} pages`);
    assert(
      r.pages.every((p) => p.ids.length <= PAGE_SIZE),
      `${tag} no page exceeds PAGE_SIZE`,
    );
    assert(
      r.pages.every((p) => p.ids.every((id, i) => i === 0 || id < p.ids[i - 1])),
      `${tag} every page is newest-first (strictly descending)`,
    );
    assert(eq(run(st, sc), r), `${tag} deterministic — identical on re-run`);
    if (sc === 'deletes') {
      const deleted = mutationFor(sc).ids;
      const later = r.pages.slice(1).flatMap((p) => p.ids);
      assert(
        deleted.every((id) => !later.includes(id)),
        `${tag} deleted rows never re-appear after the mutation`,
      );
    }
  }
}

// 1 · Honeymoon: on a stable dataset the two strategies are indistinguishable.
{
  const { offset, cursor } = compare('stable');
  assert(
    eq(offset.pages.map((p) => p.ids), cursor.pages.map((p) => p.ids)),
    '[stable] offset and cursor return identical pages',
  );
  assert(offset.duplicates.length === 0 && cursor.duplicates.length === 0, '[stable] no duplicates');
  assert(offset.missed.length === 0 && cursor.missed.length === 0, '[stable] no misses');
}

// 2 · Inserts: offset re-serves exactly the rows the 3 new items pushed down; cursor is unaffected.
{
  const { offset, cursor } = compare('inserts');
  assert(eq(offset.pages[0].ids, [20, 19, 18, 17, 16]), '[inserts] offset page 1 = 20..16');
  assert(eq(offset.pages[1].ids, [18, 17, 16, 15, 14]), '[inserts] offset page 2 re-serves 18,17,16');
  assert(eq(offset.duplicates, [18, 17, 16]), '[inserts] offset duplicates = the 3 shifted rows');
  assert(cursor.duplicates.length === 0, '[inserts] cursor has zero duplicates');
  assert(offset.missed.length === 0 && cursor.missed.length === 0, '[inserts] duplication, not loss');
  assert(
    cursor.pages[1].request.includes('after=16'),
    '[inserts] cursor page 2 resumes after the last-seen id (16)',
  );
}

// 3 · Deletes: offset silently skips the rows that slid up into the consumed window; cursor skips none.
{
  const { offset, cursor } = compare('deletes');
  assert(eq(offset.missed, [15, 14]), '[deletes] offset silently skips 15 and 14');
  assert(cursor.missed.length === 0, '[deletes] cursor misses nothing');
  assert(eq(cursor.pages[1].ids, [15, 14, 13, 12, 11]), '[deletes] cursor page 2 = 15..11 (exact resume)');
  assert(offset.duplicates.length === 0 && cursor.duplicates.length === 0, '[deletes] loss, not duplication');
}

// 4 · Cursor pages always continue strictly below the last-seen id (keyset semantics), every scenario.
for (const sc of SCENARIOS) {
  const r = run('cursor', sc);
  for (let i = 1; i < r.pages.length; i++) {
    const prevLast = r.pages[i - 1].ids[r.pages[i - 1].ids.length - 1];
    assert(
      r.pages[i].ids.every((id) => id < prevLast),
      `[cursor · ${sc}] page ${i + 1} sits strictly below the previous page's last id`,
    );
  }
}

// 5 · The thesis, in one line per scenario: cursor never duplicates and never loses; offset drifts.
{
  for (const sc of SCENARIOS) {
    const c = run('cursor', sc);
    assert(c.duplicates.length === 0 && c.missed.length === 0, `[cursor · ${sc}] exact under writes`);
  }
  assert(
    run('offset', 'inserts').duplicates.length === mutationFor('inserts').ids.length,
    '[offset] duplicates = exactly the insert count',
  );
  assert(
    run('offset', 'deletes').missed.length === mutationFor('deletes').ids.length,
    '[offset] misses = exactly the delete count',
  );
}

if (failures > 0) {
  console.error(`test-pagination: ${failures} assertion(s) failed`);
  process.exit(1);
}
console.log(
  '✓ test-pagination — stable parity, insert→duplicates (offset) vs none (cursor), delete→silent misses (offset) vs none (cursor), keyset continuation, determinism all pass.',
);
