/*
 * test-compass.ts — golden test for the Style Compass engine (src/lib/compass.ts). Run by run-tests.ts.
 * Deterministic assertions; process.exit(1) on any failure so the runner marks it red.
 * Scenarios encode the guide's core claims: each constraint set must rank the right styles first.
 */
import { AXES, STYLES, PRESETS, scoreStyles, topMatch, selectionSize, selectionsEqual, type AxisId, type Selection } from '../src/lib/compass';

let failures = 0;
function assert(cond: unknown, msg: string): void {
  if (!cond) {
    failures++;
    console.error('  ✖ ' + msg);
  }
}
const rank = (sel: Selection) => scoreStyles(sel).map((s) => s.profile.key);
const scoreOf = (sel: Selection, key: string) => scoreStyles(sel).find((s) => s.profile.key === key)!.score;

// 0 · Structural: 7 axes, 12 styles, all well-formed and in-range.
{
  assert(AXES.length === 7, `axes: 7 (got ${AXES.length})`);
  assert(new Set(AXES.map((a) => a.id)).size === 7, 'axes: ids unique');
  assert(STYLES.length === 12, `styles: 12 (got ${STYLES.length})`);
  assert(new Set(STYLES.map((s) => s.key)).size === 12, 'styles: keys unique');
  const axisIds = AXES.map((a) => a.id) as AxisId[];
  for (const s of STYLES) {
    assert(/^m\d+-/.test(s.moduleId), `${s.key}: moduleId shape ${s.moduleId}`);
    for (const a of axisIds) {
      const v = s.axes[a];
      assert(typeof v === 'number' && v >= 0 && v <= 1, `${s.key}.${a} in [0,1] (got ${v})`);
    }
  }
}

// 1 · Neutral (nothing set) → every style scores 100, curriculum order preserved, REST first.
{
  const r = scoreStyles({});
  assert(r.length === 12, 'neutral: all 12 returned');
  assert(r.every((s) => s.score === 100), 'neutral: all score 100');
  assert(r.every((s) => s.setCount === 0), 'neutral: setCount 0');
  assert(r[0].profile.key === 'rest', 'neutral: REST first (curriculum order)');
}

// 2 · Sync + request/response + text + loose → REST is the baseline default (#1).
{
  const sel: Selection = { timing: 0, flow: 0, encoding: 0, coupling: 0 };
  assert(topMatch(sel).profile.key === 'rest', `reqresp-loose: REST #1 (got ${topMatch(sel).profile.key})`);
  assert(scoreOf(sel, 'rest') === 95, `reqresp-loose: REST scores 95 (got ${scoreOf(sel, 'rest')})`);
  assert(scoreOf(sel, 'rest') > scoreOf(sel, 'grpc'), 'reqresp-loose: REST > gRPC');
}

// 3 · Server push + server-initiated → SSE / Webhooks / async messaging lead; REST collapses.
{
  const sel: Selection = { flow: 1, initiative: 1 };
  const pushLeaders = new Set(['sse', 'webhooks', 'messaging']);
  assert(pushLeaders.has(topMatch(sel).profile.key), `push: a push style is #1 (got ${topMatch(sel).profile.key})`);
  assert(scoreOf(sel, 'sse') === 100 && scoreOf(sel, 'webhooks') === 100, 'push: SSE & Webhooks score 100');
  assert(scoreOf(sel, 'rest') < 40, `push: REST collapses (got ${scoreOf(sel, 'rest')})`);
  const top3 = new Set(rank(sel).slice(0, 3));
  assert([...pushLeaders].every((k) => top3.has(k)), 'push: SSE, Webhooks, messaging are the top 3');
}

// 4 · Binary + tight coupling → gRPC is the unambiguous #1.
{
  const sel: Selection = { encoding: 1, coupling: 1 };
  assert(topMatch(sel).profile.key === 'grpc', `binary-tight: gRPC #1 (got ${topMatch(sel).profile.key})`);
  assert(scoreOf(sel, 'grpc') === 100, 'binary-tight: gRPC scores 100');
  assert(scoreOf(sel, 'grpc') > scoreOf(sel, 'rest'), 'binary-tight: gRPC > REST');
  assert(scoreOf(sel, 'grpc') > scoreOf(sel, 'graphql'), 'binary-tight: gRPC > GraphQL');
}

// 5 · Async + broker → async messaging is #1 (the only broker-mediated style).
{
  const sel: Selection = { timing: 1, topology: 1 };
  assert(topMatch(sel).profile.key === 'messaging', `async-broker: messaging #1 (got ${topMatch(sel).profile.key})`);
  assert(scoreOf(sel, 'messaging') === 100, 'async-broker: messaging scores 100');
  assert(scoreOf(sel, 'messaging') > scoreOf(sel, 'webhooks'), 'async-broker: messaging > Webhooks');
}

// 6 · Bidirectional + push → WebSockets & WebRTC are the top two.
{
  const sel: Selection = { direction: 1, flow: 1 };
  const topTwo = new Set(rank(sel).slice(0, 2));
  assert(topTwo.has('websockets') && topTwo.has('webrtc'), `bidi-push: WS & WebRTC top two (got ${[...topTwo].join(',')})`);
  assert(scoreOf(sel, 'websockets') >= 85 && scoreOf(sel, 'webrtc') >= 85, 'bidi-push: both score ≥ 85');
  assert(scoreOf(sel, 'sse') < scoreOf(sel, 'websockets'), 'bidi-push: one-way SSE ranks below bidi WS');
}

// 7 · Unset axes never penalise: a single constraint scores every on-axis style 100.
{
  const sel: Selection = { timing: 0 };
  assert(selectionSize(sel) === 1, 'single: selectionSize 1');
  assert(scoreOf(sel, 'rest') === 100, 'single: REST (timing 0) scores 100 regardless of other axes');
}

// 8 · Bounds: every score stays within [0,100] across a spread of selections.
{
  const sels: Selection[] = [
    {},
    { flow: 0.5 },
    { timing: 1, flow: 1, direction: 1, initiative: 1, encoding: 1, topology: 1, coupling: 1 },
    { encoding: 0, coupling: 1 },
  ];
  for (const sel of sels)
    for (const s of scoreStyles(sel)) assert(s.score >= 0 && s.score <= 100, `bounds: ${s.profile.key} in [0,100] (got ${s.score})`);
}

// 9 · Presets are the guide's worked examples: each must land on its intended signature style.
{
  const expected: Record<string, string> = {
    'public-web': 'rest',
    'internal-typed': 'grpc',
    'live-ui': 'sse',
    'two-way': 'websockets',
    'async-events': 'messaging',
  };
  assert(PRESETS.length === 5, `presets: 5 (got ${PRESETS.length})`);
  for (const p of PRESETS) {
    const got = topMatch(p.sel).profile.key;
    assert(got === expected[p.id], `preset ${p.id} → ${expected[p.id]} (got ${got})`);
  }
  // Presets land on five distinct styles (a real spread, not five flavours of REST).
  assert(new Set(PRESETS.map((p) => topMatch(p.sel).profile.key)).size === 5, 'presets: five distinct top styles');
}

// 10 · selectionsEqual: order-independent, value- and length-sensitive (drives active-preset highlight).
{
  assert(selectionsEqual({ timing: 0, flow: 0 }, { flow: 0, timing: 0 }), 'selectionsEqual: order-independent');
  assert(!selectionsEqual({ timing: 0 }, { timing: 1 }), 'selectionsEqual: value-sensitive');
  assert(!selectionsEqual({ timing: 0 }, { timing: 0, flow: 0 }), 'selectionsEqual: length-sensitive');
  assert(selectionsEqual(PRESETS[0].sel, PRESETS[0].sel), 'selectionsEqual: reflexive');
}

if (failures > 0) {
  console.error(`\n✖ test-compass: ${failures} failure(s).`);
  process.exit(1);
}
console.log('✓ test-compass — Style Compass engine: axes, profiles, and all ranking scenarios pass.');
