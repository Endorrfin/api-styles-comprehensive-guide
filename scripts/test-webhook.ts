/*
 * test-webhook.ts — golden test for the webhook delivery engine (src/lib/webhook.ts). Run by run-tests.ts.
 * Deterministic assertions; process.exit(1) on any failure so the runner marks it red.
 * Scenarios pin the module's core claims: the event is signed once before any delivery; every retry
 * re-delivers the SAME webhook-id; the consumer verifies before processing; backoff grows exponentially
 * (×4); delivery is at-least-once (a lost ack after a successful effect still causes a retry) — so the
 * effect count depends on consumer-side dedup: exactly one WITH an idempotency key, two WITHOUT (the
 * double-charge bug); a dead endpoint ends in the dead-letter queue with zero effects; and every
 * timeline is deterministic.
 */
import {
  BACKOFF_S,
  SCENARIOS,
  attempts,
  effects,
  lastTick,
  timeline,
  type WhEvent,
} from '../src/lib/webhook';

let failures = 0;
function assert(cond: unknown, msg: string): void {
  if (!cond) {
    failures++;
    console.error('  ✖ ' + msg);
  }
}

const kinds = (tl: WhEvent[], k: WhEvent['kind']) => tl.filter((e) => e.kind === k);
const first = (tl: WhEvent[], k: WhEvent['kind']) => tl.find((e) => e.kind === k);

// 0 · The backoff schedule itself is exponential (×4) — the constant the labels are built from.
{
  assert(BACKOFF_S.length >= 2, 'there are at least two backoff steps');
  for (let i = 1; i < BACKOFF_S.length; i++) {
    assert(BACKOFF_S[i] === BACKOFF_S[i - 1] * 4, `backoff grows ×4 (${BACKOFF_S[i - 1]} s → ${BACKOFF_S[i]} s)`);
  }
}

// 1 · Structural invariants hold in EVERY scenario (and under both dedup settings).
for (const s of SCENARIOS) {
  for (const dedup of [true, false]) {
    const tl = timeline(s, dedup);
    const tag = `[${s}${dedup ? '' : ' · no-dedup'}]`;

    // event → sign → first attempt, in that order, exactly once each.
    const evt = first(tl, 'event');
    const sign = first(tl, 'sign');
    const att1 = first(tl, 'attempt');
    assert(evt !== undefined && sign !== undefined && att1 !== undefined, `${tag} event, sign, attempt all exist`);
    assert(kinds(tl, 'event').length === 1 && kinds(tl, 'sign').length === 1, `${tag} one event, signed once`);
    assert(evt!.t < sign!.t && sign!.t < att1!.t, `${tag} the payload is signed before any delivery`);

    // Every attempt re-delivers the same webhook-id, numbered 1..n ascending.
    const atts = kinds(tl, 'attempt');
    assert(atts.every((a) => a.label.includes('evt_42')), `${tag} every attempt carries the SAME webhook-id`);
    assert(
      atts.every((a, i) => a.attempt === i + 1),
      `${tag} attempts are numbered 1..${atts.length} in order`,
    );

    // The consumer never processes without verifying first (within the same attempt).
    for (const p of kinds(tl, 'process')) {
      const v = tl.find((e) => e.kind === 'verify' && e.attempt === p.attempt);
      assert(v !== undefined && v.t < p.t, `${tag} attempt #${p.attempt} verifies the signature before processing`);
    }

    // Backoffs sit strictly between attempts and use the schedule's growing labels.
    const boffs = kinds(tl, 'backoff');
    assert(boffs.length === Math.max(0, atts.length - 1), `${tag} a backoff between every pair of attempts`);
    boffs.forEach((b, i) => assert(b.label.includes(`${BACKOFF_S[i]} s`), `${tag} backoff #${i + 1} waits ${BACKOFF_S[i]} s`));

    // Determinism.
    assert(JSON.stringify(timeline(s, dedup)) === JSON.stringify(tl), `${tag} timeline() is deterministic`);
  }
}

// 2 · healthy: one attempt, one effect, acked 200 — no retries, no backoff, no dead-letter.
{
  const tl = timeline('healthy', true);
  assert(attempts(tl) === 1 && effects(tl) === 1, '[healthy] one attempt, exactly one effect');
  assert(kinds(tl, 'backoff').length === 0 && first(tl, 'dead-letter') === undefined, '[healthy] no backoff, no DLQ');
  const res = kinds(tl, 'response');
  assert(res.length === 1 && res[0].status === 200 && res[0].ok === true, '[healthy] the single response is 200 OK');
  assert(JSON.stringify(timeline('healthy', false)) === JSON.stringify(tl), '[healthy] dedup setting is irrelevant');
}

// 3 · flaky + dedup: at-least-once delivery, exactly-once EFFECT — the idempotency key at work.
{
  const tl = timeline('flaky', true);
  assert(attempts(tl) === 3, '[flaky] three delivery attempts');
  assert(effects(tl) === 1, '[flaky·dedup] exactly ONE business effect despite re-delivery');
  const dup = first(tl, 'duplicate');
  const proc = first(tl, 'process');
  assert(dup !== undefined && proc !== undefined && dup.t > proc.t, '[flaky·dedup] the re-delivered evt_42 is skipped as a duplicate');
  // The at-least-once core: the effect was applied on attempt 2, yet a 3rd attempt still happened.
  assert(proc!.attempt === 2 && dup!.attempt === 3, '[flaky·dedup] effect on attempt 2, duplicate skipped on attempt 3');
  const lost = tl.find((e) => e.kind === 'response' && e.attempt === 2);
  assert(lost !== undefined && lost.status === undefined && lost.ok === false, '[flaky] attempt 2 succeeded but the ACK WAS LOST (timeout)');
  const final = tl.filter((e) => e.kind === 'response').at(-1);
  assert(final !== undefined && final.status === 200, '[flaky] the story ends with a delivered 200');
}

// 4 · flaky without dedup: the same wire story now applies the effect TWICE — the double-charge bug.
{
  const tl = timeline('flaky', false);
  assert(effects(tl) === 2, '[flaky·no-dedup] the effect is applied twice');
  const second = kinds(tl, 'process')[1];
  assert(second !== undefined && second.ok === false && second.attempt === 3, '[flaky·no-dedup] the second effect is flagged as the bug (attempt 3)');
  assert(first(tl, 'duplicate') === undefined, '[flaky·no-dedup] nothing is skipped — nobody checked the id');
  // Same number of attempts either way: dedup changes the EFFECT count, never the wire traffic.
  assert(attempts(tl) === attempts(timeline('flaky', true)), '[flaky] dedup does not change delivery attempts');
}

// 5 · down: a full backoff run of timeouts, zero effects, and the dead-letter queue closes the story.
{
  const tl = timeline('down', true);
  assert(attempts(tl) === BACKOFF_S.length + 1, `[down] ${BACKOFF_S.length + 1} attempts across the whole schedule`);
  assert(effects(tl) === 0 && kinds(tl, 'verify').length === 0, '[down] nothing verified, nothing processed');
  assert(kinds(tl, 'response').every((r) => r.status === undefined && r.ok === false), '[down] every attempt times out');
  const dlq = first(tl, 'dead-letter');
  assert(dlq !== undefined && dlq.t === lastTick(tl), '[down] the dead-letter entry is the final event');
  assert(JSON.stringify(timeline('down', false)) === JSON.stringify(tl), '[down] dedup setting is irrelevant');
}

// 6 · The scenarios genuinely differ, and harder failures make longer stories.
{
  const lens = SCENARIOS.map((s) => timeline(s, true).length);
  assert(new Set(lens).size === 3, 'each scenario has a distinct script length');
  assert(lens[0] < lens[1] && lens[0] < lens[2], 'healthy is the shortest story');
}

if (failures > 0) {
  console.error(`\n✖ test-webhook: ${failures} failure(s).`);
  process.exit(1);
}
console.log(
  '✓ test-webhook — webhook delivery: sign-before-send, same-id retries, verify-before-process, ×4 backoff, at-least-once ⇒ dedup=1 effect / no-dedup=2, down ⇒ DLQ, determinism all pass.',
);
