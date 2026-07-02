/*
 * test-webrtc.ts — golden test for the WebRTC connection engine (src/lib/webrtc.ts). Run by run-tests.ts.
 * Deterministic assertions; process.exit(1) on any failure so the runner marks it red.
 * Scenarios pin the module's core claims: JSEP ordering (offer → answer → candidates → checks → pair →
 * DTLS → data); SDP and candidates travel ONLY via signaling; srflx exists only after a STUN Binding and
 * relay only after a TURN Allocate; each NAT scenario nominates the right pair (open→host, nat→srflx,
 * relay→relay); media/data NEVER pass the signaling server; the connected exchange is full-duplex; and
 * every timeline is deterministic.
 */
import {
  SCENARIOS,
  lastTick,
  phaseAt,
  selectedPair,
  timeline,
  viaCounts,
  type Phase,
  type RtcEvent,
  type Scenario,
} from '../src/lib/webrtc';

let failures = 0;
function assert(cond: unknown, msg: string): void {
  if (!cond) {
    failures++;
    console.error('  ✖ ' + msg);
  }
}

// 0 · Scenario → nominated pair mapping is the whole point of the scenario switch.
{
  assert(selectedPair('open') === 'host', 'open internet nominates the host pair');
  assert(selectedPair('nat') === 'srflx', 'plain NATs nominate the srflx (STUN) pair');
  assert(selectedPair('relay') === 'relay', 'symmetric NAT nominates the TURN relay pair');
}

for (const s of SCENARIOS) {
  const tl = timeline(s);
  const at = (k: RtcEvent['kind']) => tl.filter((e) => e.kind === k);
  const first = (k: RtcEvent['kind']) => tl.find((e) => e.kind === k);
  const tag = `[${s}]`;

  // 1 · JSEP ordering: offer → answer → candidates → checks → pair-selected → DTLS → data/media.
  {
    const sdps = at('sdp');
    assert(sdps.length === 2, `${tag} exactly one offer and one answer`);
    assert(sdps[0].from === 'a' && sdps[1].from === 'b', `${tag} offer from A, answer from B`);
    assert(sdps[0].t < sdps[1].t, `${tag} the offer precedes the answer`);
    const firstCand = first('candidate');
    assert(firstCand !== undefined && firstCand.t > sdps[1].t, `${tag} candidates trickle after the answer (RFC 8838)`);
    const firstCheck = first('check');
    const lastCand = at('candidate').reduce((m, e) => Math.max(m, e.t), 0);
    assert(firstCheck !== undefined && firstCheck.t > lastCand, `${tag} connectivity checks follow the candidates`);
    const sel = first('pair-selected');
    const lastCheck = at('check').reduce((m, e) => Math.max(m, e.t), 0);
    assert(sel !== undefined && sel.t > lastCheck, `${tag} the pair is nominated after the checks`);
    const dtls = at('dtls');
    assert(dtls.length === 2 && sel !== undefined && dtls[0].t > sel.t, `${tag} DTLS runs on the selected pair`);
    const firstApp = Math.min(...[...at('data'), ...at('media')].map((e) => e.t));
    assert(firstApp > dtls[1].t, `${tag} data/media flow only after DTLS completes`);
  }

  // 2 · The signaling channel carries SDP + candidates — and NOTHING after nomination.
  {
    assert(at('sdp').every((e) => e.via === 'signal'), `${tag} offer/answer travel via signaling`);
    assert(at('candidate').every((e) => e.via === 'signal'), `${tag} trickled candidates travel via signaling`);
    const appKinds: RtcEvent['kind'][] = ['check', 'pair-selected', 'dtls', 'data', 'media'];
    assert(
      tl.filter((e) => appKinds.includes(e.kind)).every((e) => e.via !== 'signal'),
      `${tag} checks/DTLS/data/media never pass the signaling server`,
    );
    const sel = first('pair-selected')!;
    assert(tl.filter((e) => e.t > sel.t).every((e) => e.via !== 'signal'), `${tag} after nomination the server carries nothing`);
  }

  // 3 · Candidate provenance: srflx needs a STUN Binding first; relay needs a TURN Allocate first.
  {
    const srflx = tl.find((e) => e.kind === 'candidate' && e.cand === 'srflx');
    const stun = first('stun-query');
    if (srflx) assert(stun !== undefined && stun.t < srflx.t, `${tag} srflx candidate only after a STUN Binding`);
    const relay = tl.find((e) => e.kind === 'candidate' && e.cand === 'relay');
    const turn = first('turn-allocate');
    if (relay) assert(turn !== undefined && turn.t < relay.t, `${tag} relay candidate only after a TURN Allocate`);
    assert(
      tl.filter((e) => e.kind === 'candidate' && e.t === first('candidate')!.t).every((e) => e.cand === 'host'),
      `${tag} host candidates are gathered first (free, local)`,
    );
  }

  // 4 · The right checks fail/succeed per scenario, and the nominated pair matches.
  {
    const checks = at('check');
    const okChecks = checks.filter((e) => e.ok);
    assert(okChecks.length === 1 && okChecks[0].cand === selectedPair(s), `${tag} exactly one pair works: ${selectedPair(s)}`);
    if (s === 'open') assert(checks.length === 1 && checks[0].cand === 'host', `${tag} host↔host works immediately`);
    if (s === 'nat') assert(checks.some((e) => e.cand === 'host' && e.ok === false), `${tag} host check fails behind NATs`);
    if (s === 'relay') {
      assert(checks.some((e) => e.cand === 'srflx' && e.ok === false), `${tag} symmetric NAT defeats the srflx pair`);
      assert(checks.find((e) => e.ok)?.via === 'turn', `${tag} the working path goes via the TURN relay`);
    }
    const sel = first('pair-selected')!;
    assert(sel.cand === selectedPair(s), `${tag} nominated pair is ${selectedPair(s)}`);
    const expectVia = s === 'relay' ? 'turn' : 'direct';
    assert(
      [...at('dtls'), ...at('data'), ...at('media')].every((e) => e.via === expectVia),
      `${tag} DTLS + app traffic travel via ${expectVia}`,
    );
  }

  // 5 · Full-duplex: the final tick carries data from BOTH peers at once.
  {
    const end = lastTick(tl);
    const final = tl.filter((e) => e.t === end && e.kind === 'data');
    assert(
      final.some((e) => e.from === 'a') && final.some((e) => e.from === 'b'),
      `${tag} the last tick is a full-duplex data exchange`,
    );
  }

  // 6 · Phases progress monotonically signaling → ice → dtls → connected.
  {
    const order: Phase[] = ['signaling', 'ice', 'dtls', 'connected'];
    let prev = 0;
    let monotonic = true;
    for (let t = 0; t <= lastTick(tl); t++) {
      const i = order.indexOf(phaseAt(tl, t));
      if (i < prev) monotonic = false;
      prev = Math.max(prev, i);
    }
    assert(monotonic, `${tag} phases never move backwards`);
    assert(phaseAt(tl, lastTick(tl)) === 'connected', `${tag} the script ends connected`);
    assert(phaseAt(tl, 0) === 'signaling', `${tag} the script starts in signaling`);
  }

  // 7 · viaCounts is complete; open internet touches no STUN/TURN server at all.
  {
    const c = viaCounts(tl);
    assert(Object.values(c).reduce((a, b) => a + b, 0) === tl.length, `${tag} viaCounts covers every event`);
    if (s === 'open') assert(c.stun === 0 && c.turn === 0, `${tag} no STUN/TURN traffic on the open internet`);
    if (s === 'nat') assert(c.stun > 0 && c.turn === 0, `${tag} STUN but no TURN behind plain NATs`);
    if (s === 'relay') assert(c.stun > 0 && c.turn > 0, `${tag} symmetric NAT needs both STUN and TURN`);
  }

  // 8 · Determinism: identical calls → identical scripts.
  {
    assert(JSON.stringify(timeline(s)) === JSON.stringify(timeline(s)), `${tag} timeline() is deterministic`);
  }
}

// 9 · The scenarios genuinely differ (the switch teaches something).
{
  const lens = SCENARIOS.map((s: Scenario) => timeline(s).length);
  assert(new Set(lens).size === 3, 'each scenario has a distinct script length (open < nat < relay)');
  assert(lens[0] < lens[1] && lens[1] < lens[2], 'harder NATs → longer connection stories');
}

if (failures > 0) {
  console.error(`\n✖ test-webrtc: ${failures} failure(s).`);
  process.exit(1);
}
console.log(
  '✓ test-webrtc — WebRTC connect: JSEP ordering, signaling-only SDP/candidates, STUN→srflx / TURN→relay provenance, per-scenario pair, DTLS-before-data, full-duplex, determinism all pass.',
);
