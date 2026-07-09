/*
 * test-picker.ts — golden test for the Style Picker engine (src/lib/picker.ts). Run by run-tests.ts.
 * Each scenario is a boundary the guide teaches; the picker must land on the style the corresponding
 * module argues for — and the deal-breaker adjustments must carry their reasons.
 */
import { STYLES } from '../src/lib/compass';
import { QUESTIONS, WHEN_NOT, answeredCount, pickVerdict, rankPicks, type Answers } from '../src/lib/picker';

let failures = 0;
function assert(cond: unknown, msg: string): void {
  if (!cond) {
    failures++;
    console.error('  ✖ ' + msg);
  }
}
const topKey = (a: Answers) => rankPicks(a)[0].profile.key;
const pickOf = (a: Answers, key: string) => rankPicks(a).find((p) => p.profile.key === key)!;

// 0 · Structural: questions/options well-formed; adjustments and when-NOT reference real styles.
{
  assert(QUESTIONS.length === 5, `questions: 5 (got ${QUESTIONS.length})`);
  assert(new Set(QUESTIONS.map((q) => q.id)).size === 5, 'questions: ids unique');
  const styleKeys = new Set(STYLES.map((s) => s.key));
  for (const q of QUESTIONS) {
    assert(q.options.length >= 2, `${q.id}: ≥2 options`);
    assert(new Set(q.options.map((o) => o.id)).size === q.options.length, `${q.id}: option ids unique`);
    for (const o of q.options) {
      for (const [axis, v] of Object.entries(o.sel ?? {}))
        assert(typeof v === 'number' && v >= 0 && v <= 1, `${q.id}/${o.id}: axis ${axis} in [0,1] (got ${v})`);
      for (const adj of o.adjust ?? []) {
        assert(styleKeys.has(adj.style), `${q.id}/${o.id}: adjustment targets real style (got ${adj.style})`);
        assert(adj.reason.en.length > 0 && adj.reason.uk.length > 0, `${q.id}/${o.id}/${adj.style}: bilingual reason`);
      }
    }
  }
  assert(Object.keys(WHEN_NOT).length === STYLES.length, `when-NOT: one line per style (got ${Object.keys(WHEN_NOT).length})`);
  for (const s of STYLES) assert(WHEN_NOT[s.key] !== undefined && WHEN_NOT[s.key].en.length > 0 && WHEN_NOT[s.key].uk.length > 0, `when-NOT covers ${s.key}, bilingual`);
}

// 1 · Neutral: nothing answered → every style 100, curriculum order, no verdict yet.
{
  const r = rankPicks({});
  assert(r.length === STYLES.length, 'neutral: all styles returned');
  assert(r.every((p) => p.score === 100 && p.fit === 100 && p.adjustments.length === 0), 'neutral: all 100, no adjustments');
  assert(r[0].profile.key === 'rest', 'neutral: REST first (curriculum order)');
  assert(answeredCount({}) === 0 && pickVerdict({}) === null, 'neutral: no verdict');
  assert(answeredCount({ consumers: 'nope' }) === 0, 'invalid option id counts as unanswered');
}

// 2 · The public default: public + ask-answer + loose + small JSON + max reach → REST, and tRPC/gRPC buried.
{
  const a: Answers = { consumers: 'public', shape: 'ask-answer', contract: 'loose', payload: 'small-json', reach: 'max-reach' };
  assert(topKey(a) === 'rest', `public default: REST #1 (got ${topKey(a)})`);
  assert(pickOf(a, 'rest').score === 100, `public default: REST displays 100 (got ${pickOf(a, 'rest').score})`);
  const trpc = pickOf(a, 'trpc');
  assert(trpc.score < 50, `public default: tRPC buried (got ${trpc.score})`);
  assert(trpc.adjustments.some((x) => x.delta === -50), 'public default: tRPC carries the public-callers veto');
  const grpc = pickOf(a, 'grpc');
  assert(grpc.score === 0, `public default: gRPC clamps to 0 (got ${grpc.score})`);
  assert(grpc.adjustments.some((x) => x.delta === -40), 'public default: gRPC carries the browser veto reason');
  assert(pickVerdict(a)!.answered === 5, 'public default: 5 answered');
}

// 3 · Typed internal: internal + ask-answer + strict IDL + binary + controlled → gRPC beats REST and SOAP.
{
  const a: Answers = { consumers: 'internal', shape: 'ask-answer', contract: 'strict-idl', payload: 'binary-large', reach: 'controlled' };
  assert(topKey(a) === 'grpc', `typed internal: gRPC #1 (got ${topKey(a)})`);
  assert(pickOf(a, 'grpc').score > pickOf(a, 'rest').score, 'typed internal: gRPC > REST');
  assert(pickOf(a, 'grpc').score > pickOf(a, 'soap').score, 'typed internal: gRPC > SOAP');
  assert(pickOf(a, 'grpc').adjustments.length === 2, 'typed internal: gRPC carries internal + IDL boosts');
}

// 4 · Live feed to browsers: own app + one-way feed + max reach → SSE #1 (the m13 claim), WS penalized.
{
  const a: Answers = { consumers: 'own-app', shape: 'live-feed', contract: 'loose', payload: 'small-json', reach: 'max-reach' };
  assert(topKey(a) === 'sse', `live feed: SSE #1 (got ${topKey(a)})`);
  assert(pickOf(a, 'sse').fit === 100, `live feed: SSE fits the axes exactly (got fit ${pickOf(a, 'sse').fit})`);
  assert(pickOf(a, 'websockets').adjustments.some((x) => x.delta < 0), 'live feed: WS carries the middlebox penalty');
}

// 5 · Two-way session, both ends ours: WebSockets #1, WebRTC behind (no P2P need).
{
  const a: Answers = { consumers: 'own-app', shape: 'two-way', contract: 'loose', payload: 'small-json', reach: 'controlled' };
  assert(topKey(a) === 'websockets', `two-way: WebSockets #1 (got ${topKey(a)})`);
  assert(pickOf(a, 'websockets').score > pickOf(a, 'webrtc').score, 'two-way: WS > WebRTC when the server may stay in the path');
}

// 6 · Peer-to-peer media: WebRTC #1 even though WS fits the axes nearly as well.
{
  const a: Answers = { shape: 'p2p' };
  assert(topKey(a) === 'webrtc', `p2p: WebRTC #1 (got ${topKey(a)})`);
  assert(pickOf(a, 'webrtc').adjustments.some((x) => x.delta === 25), 'p2p: WebRTC carries the server-out-of-the-path boost');
  assert(pickOf(a, 'websockets').fit >= 90, 'p2p: WS fits the axes too — the boost is what decides');
}

// 7 · Server-to-server callback: Webhooks #1; async messaging the runner-up shape.
{
  const a: Answers = { shape: 'notify-server' };
  assert(topKey(a) === 'webhooks', `notify: Webhooks #1 (got ${topKey(a)})`);
  const v = pickVerdict(a)!;
  assert(v.runnerUp.profile.key === 'messaging', `notify: messaging runner-up (got ${v.runnerUp.profile.key})`);
}

// 8 · Decoupled events inside the org: async messaging #1.
{
  const a: Answers = { consumers: 'internal', shape: 'broker-events', reach: 'controlled' };
  assert(topKey(a) === 'messaging', `broker events: messaging #1 (got ${topKey(a)})`);
  assert(pickOf(a, 'messaging').adjustments.some((x) => x.delta === 20), 'broker events: the broker boost applies');
}

// 9 · One TS codebase, our own app: tRPC #1 over GraphQL and gRPC — and SOAP kept out of the runner-up
// slot (its coupling coordinate sits next to 0.9, so it needs the WSDL-toolchain counter-weight).
{
  const a: Answers = { consumers: 'own-app', shape: 'ask-answer', contract: 'e2e-ts', payload: 'small-json', reach: 'controlled' };
  assert(topKey(a) === 'trpc', `e2e TS: tRPC #1 (got ${topKey(a)})`);
  assert(pickOf(a, 'trpc').score > pickOf(a, 'graphql').score, 'e2e TS: tRPC > GraphQL');
  assert(pickOf(a, 'trpc').score > pickOf(a, 'grpc').score, 'e2e TS: tRPC > gRPC');
  const v = pickVerdict(a)!;
  assert(v.runnerUp.profile.key !== 'soap', `e2e TS: SOAP is not the runner-up (got ${v.runnerUp.profile.key})`);
  assert(pickOf(a, 'soap').adjustments.some((x) => x.delta === -15), 'e2e TS: SOAP carries the WSDL counter-weight');
}

// 10 · Client-shaped payloads: GraphQL #1 (its founding feature), OData the REST-flavoured alternative.
{
  const a: Answers = { consumers: 'public', shape: 'ask-answer', payload: 'client-shaped', reach: 'max-reach' };
  assert(topKey(a) === 'graphql', `client-shaped: GraphQL #1 (got ${topKey(a)})`);
  assert(pickOf(a, 'rest').adjustments.some((x) => x.delta === -15), 'client-shaped: REST carries the over/under-fetch penalty');
  assert(pickOf(a, 'odata').adjustments.some((x) => x.delta === 10), 'client-shaped: OData carries the query-grammar boost');
}

// 11 · IoT fleet: async messaging (MQTT) #1 from the consumers answer alone.
{
  const a: Answers = { consumers: 'devices' };
  assert(topKey(a) === 'messaging', `devices: messaging #1 (got ${topKey(a)})`);
}

// 12 · Bounds + determinism: scores stay in [0,100] and repeat runs are identical.
{
  const sels: Answers[] = [
    {},
    { shape: 'p2p' },
    { consumers: 'public', shape: 'ask-answer', contract: 'loose', payload: 'small-json', reach: 'max-reach' },
    { consumers: 'internal', shape: 'broker-events', contract: 'strict-idl', payload: 'high-freq', reach: 'controlled' },
  ];
  for (const a of sels) {
    const r1 = rankPicks(a);
    for (const p of r1) assert(p.score >= 0 && p.score <= 100, `bounds: ${p.profile.key} in [0,100] (got ${p.score})`);
    const r2 = rankPicks(a);
    assert(
      r1.map((p) => `${p.profile.key}:${p.raw}`).join('|') === r2.map((p) => `${p.profile.key}:${p.raw}`).join('|'),
      'determinism: identical runs produce identical rankings',
    );
  }
}

// 13 · Every question moves something: answering any single option never leaves ALL styles at 100.
{
  for (const q of QUESTIONS)
    for (const o of q.options) {
      const r = rankPicks({ [q.id]: o.id } as Answers);
      const moved = r.some((p) => p.raw !== 100);
      // 'controlled' and 'own-app' are deliberate no-ops (freedom answers) — everything else must move scores.
      if (o.id !== 'controlled' && o.id !== 'own-app') assert(moved, `${q.id}/${o.id}: moves at least one score`);
    }
}

if (failures > 0) {
  console.error(`\n✖ test-picker: ${failures} failure(s).`);
  process.exit(1);
}
console.log('✓ test-picker — Style Picker engine: structure, all 10 boundary scenarios, bounds, determinism pass.');
