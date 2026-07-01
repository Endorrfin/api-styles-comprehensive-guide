/*
 * test-http.ts — golden test for the HTTP multiplexing engine (src/lib/http.ts). Run by run-tests.ts.
 * Deterministic assertions; process.exit(1) on any failure so the runner marks it red.
 * Scenarios encode the module's core claims: multiplexing removes the per-connection queue (h2/h3 beat
 * h1 past the connection cap), and under packet loss HTTP/2 stalls every stream while HTTP/3 stalls one.
 */
import { simulate, PROTOCOLS, PROTOCOL_FACTS, DEFAULTS, type Protocol, type SimOptions } from '../src/lib/http';

let failures = 0;
function assert(cond: unknown, msg: string): void {
  if (!cond) {
    failures++;
    console.error('  ✖ ' + msg);
  }
}
const base = (protocol: Protocol, over: Partial<SimOptions> = {}): SimOptions => ({ protocol, ...DEFAULTS, ...over });

// 0 · Structural: three protocols, well-formed facts, distinct HOL scopes.
{
  assert(PROTOCOLS.length === 3, `protocols: 3 (got ${PROTOCOLS.length})`);
  assert(new Set(PROTOCOLS).size === 3, 'protocols: unique');
  assert(PROTOCOL_FACTS.h1.multiplexed === false, 'h1 is not multiplexed');
  assert(PROTOCOL_FACTS.h2.multiplexed && PROTOCOL_FACTS.h3.multiplexed, 'h2 & h3 are multiplexed');
  assert(PROTOCOL_FACTS.h1.transport === 'TCP' && PROTOCOL_FACTS.h2.transport === 'TCP', 'h1/h2 ride TCP');
  assert(PROTOCOL_FACTS.h3.transport === 'QUIC / UDP', 'h3 rides QUIC/UDP');
  const scopes = new Set(PROTOCOLS.map((p) => PROTOCOL_FACTS[p].holScope));
  assert(scopes.size === 3, 'each protocol has a distinct HOL scope');
}

// 1 · Every stream trace is well-formed for every protocol (ids 0..n-1, end ≥ start, lane in range).
for (const p of PROTOCOLS) {
  const r = simulate(base(p, { loss: true }));
  assert(r.streams.length === DEFAULTS.requests, `${p}: emits ${DEFAULTS.requests} streams`);
  assert(r.streams.every((s, i) => s.id === i), `${p}: stream ids are contiguous`);
  assert(r.streams.every((s) => s.end >= s.start && s.start >= 0), `${p}: end ≥ start ≥ 0`);
  assert(r.streams.every((s) => s.lane >= 0 && s.lane < (p === 'h1' ? r.connections : DEFAULTS.requests)), `${p}: lanes in range`);
  assert(r.avgTicks <= r.totalTicks, `${p}: avg ≤ total`);
}

// 2 · No loss, 8 requests over a 6-connection cap: multiplexing removes the per-connection queue.
{
  const h1 = simulate(base('h1'));
  const h2 = simulate(base('h2'));
  const h3 = simulate(base('h3'));
  assert(h1.connections === 6, `h1 opens 6 connections (got ${h1.connections})`);
  assert(h2.connections === 1 && h3.connections === 1, 'h2 & h3 use a single connection');
  assert(h1.totalTicks === 6, `h1 total = 6 (two rounds of 3; got ${h1.totalTicks})`);
  assert(h2.totalTicks === 3 && h3.totalTicks === 3, 'h2 & h3 total = 3 (all streams concurrent)');
  assert(h1.totalTicks > h2.totalTicks, 'multiplexing beats h1 once requests exceed the connection cap');
  assert(h1.avgTicks === 3.75, `h1 avg = 3.75 (got ${h1.avgTicks})`);
  assert(h2.avgTicks === 3 && h3.avgTicks === 3, 'h2 & h3 avg = 3');
  assert(h1.stalledStreams === 0 && h2.stalledStreams === 0 && h3.stalledStreams === 0, 'no stalls without loss');
}

// 3 · Under the connection cap (4 ≤ 6): h1 has no queue, so it ties the multiplexed protocols.
{
  const h1 = simulate(base('h1', { requests: 4 }));
  const h2 = simulate(base('h2', { requests: 4 }));
  assert(h1.connections === 4, `h1 opens one connection per request (got ${h1.connections})`);
  assert(h1.totalTicks === 3, `h1 total = 3 under the cap (got ${h1.totalTicks})`);
  assert(h1.totalTicks === h2.totalTicks, 'multiplexing only helps beyond the connection cap');
}

// 4 · Packet loss — the headline: HTTP/2 stalls EVERY stream, HTTP/3 stalls exactly ONE.
{
  const h2 = simulate(base('h2', { loss: true }));
  const h3 = simulate(base('h3', { loss: true }));
  assert(h2.stalledStreams === DEFAULTS.requests, `h2 loss stalls all ${DEFAULTS.requests} streams (got ${h2.stalledStreams})`);
  assert(h3.stalledStreams === 1, `h3 loss stalls exactly 1 stream (got ${h3.stalledStreams})`);
  assert(h2.avgTicks === 6, `h2 loss avg = 6 — everyone waits (got ${h2.avgTicks})`);
  assert(h3.avgTicks === 3.38, `h3 loss avg = 3.38 — one waits, the rest finish on time (got ${h3.avgTicks})`);
  assert(h3.avgTicks < h2.avgTicks, 'QUIC independent streams: h3 average latency stays low under loss');
  assert(h3.totalTicks === h2.totalTicks, 'the hit stream still ends last in both — the win is average latency, not tail');
}

// 5 · Packet loss on h1 hits only the victim connection's queue (per-connection HOL), not all streams.
{
  const h1 = simulate(base('h1', { loss: true }));
  assert(h1.stalledStreams === 2, `h1 loss stalls the victim + its one queued follower = 2 (got ${h1.stalledStreams})`);
  assert(h1.stalledStreams < DEFAULTS.requests, 'h1 HOL is scoped to one connection, not all requests');
  assert(h1.totalTicks === 9, `h1 loss total = 9 (blocked follower ends last; got ${h1.totalTicks})`);
  // The blocked follower is the request 6 slots later on the victim's connection.
  const follower = h1.streams.find((s) => s.id === DEFAULTS.lossStream + h1.connections);
  assert(!!follower && follower.stalled, 'the same-connection follower is head-of-line blocked');
}

// 6 · Scale check: at 12 requests, h2 still stalls all, h3 still stalls one; averages diverge further.
{
  const h2 = simulate(base('h2', { requests: 12, loss: true }));
  const h3 = simulate(base('h3', { requests: 12, loss: true }));
  assert(h2.stalledStreams === 12, `h2 loss stalls all 12 (got ${h2.stalledStreams})`);
  assert(h3.stalledStreams === 1, `h3 loss stalls 1 of 12 (got ${h3.stalledStreams})`);
  assert(h3.avgTicks === 3.25, `h3 avg = 3.25 at 12 requests (got ${h3.avgTicks})`);
}

// 7 · Monotonic: more requests never lowers h1's total (queueing can only add rounds).
{
  const small = simulate(base('h1', { requests: 6 }));
  const big = simulate(base('h1', { requests: 12 }));
  assert(small.totalTicks === 3, `h1 6-req total = 3 (got ${small.totalTicks})`);
  assert(big.totalTicks === 6, `h1 12-req total = 6 (got ${big.totalTicks})`);
  assert(big.totalTicks > small.totalTicks, 'more requests → more h1 rounds');
}

// 8 · Determinism: identical options → identical schedule.
{
  const a = simulate(base('h3', { loss: true, requests: 12 }));
  const b = simulate(base('h3', { loss: true, requests: 12 }));
  assert(JSON.stringify(a) === JSON.stringify(b), 'simulate is deterministic');
}

if (failures > 0) {
  console.error(`\n✖ test-http: ${failures} failure(s).`);
  process.exit(1);
}
console.log('✓ test-http — HTTP multiplexing engine: multiplexing, per-connection HOL, and QUIC vs TCP loss all pass.');
