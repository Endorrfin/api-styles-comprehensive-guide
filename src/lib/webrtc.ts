/*
 * webrtc.ts — pure, deterministic engine for the `webrtc-connect` signature sim (CLAUDE.md §6, m14).
 * No React, no DOM, no randomness, no real RTC — so scripts/test-webrtc.ts can assert each scenario's
 * script exactly and the component (WebrtcConnectSim) is a thin renderer over it.
 *
 * The model: one connection establishment on a stepped clock, in three deterministic NAT scenarios:
 *   - 'open'  — both peers publicly reachable → the host↔host pair works;
 *   - 'nat'   — both behind ordinary NATs → host checks fail, STUN-discovered srflx pair works;
 *   - 'relay' — a symmetric NAT re-maps ports per destination → srflx checks fail too, TURN relays.
 * Rules baked in by construction (guarded by the golden test):
 *   - SDP offer → answer, and every candidate, travel via the SIGNALING channel (RFC 9429 JSEP);
 *   - candidates trickle after the offer/answer (RFC 8838); srflx exists only after a STUN Binding
 *     (RFC 8489); relay only after a TURN Allocate (RFC 8656);
 *   - connectivity checks and everything after them run peer↔peer ('direct', or 'turn' when relayed) —
 *     media/data NEVER pass the signaling server;
 *   - DTLS comes after the selected pair and before any data (RFC 8831: SCTP over DTLS; RFC 5763/5764).
 * Refs: RFC 8825 (overview), RFC 8445 (ICE), MDN WebRTC connectivity
 * (https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Connectivity).
 */

export type Scenario = 'open' | 'nat' | 'relay';
export const SCENARIOS: readonly Scenario[] = ['open', 'nat', 'relay'] as const;

export type Peer = 'a' | 'b';
/** How an event travels: on-device API call, the signaling channel, a STUN/TURN server, or peer↔peer. */
export type Via = 'local' | 'signal' | 'stun' | 'turn' | 'direct';
export type Phase = 'signaling' | 'ice' | 'dtls' | 'connected';
export type CandType = 'host' | 'srflx' | 'relay';

export type EventKind =
  | 'api' // local RTCPeerConnection call
  | 'sdp' // offer/answer via signaling
  | 'stun-query' // STUN Binding: "what is my public address?"
  | 'turn-allocate' // TURN Allocate: lease a relay address
  | 'candidate' // trickled ICE candidate via signaling
  | 'check' // STUN connectivity check on a candidate pair (peer↔peer)
  | 'pair-selected' // ICE nominates the working pair
  | 'dtls' // DTLS handshake on the selected pair
  | 'data' // SCTP data-channel traffic
  | 'media'; // SRTP media traffic

export interface RtcEvent {
  /** clock tick (0-based) */
  t: number;
  /** originating peer */
  from: Peer;
  via: Via;
  phase: Phase;
  kind: EventKind;
  /** short label; technical tokens stay English in both languages */
  label: string;
  /** candidate type for candidate/check/pair-selected events */
  cand?: CandType;
  /** for checks: whether the pair works in this scenario */
  ok?: boolean;
}

/** The candidate-pair type each scenario ends up nominating. */
export function selectedPair(s: Scenario): CandType {
  return s === 'open' ? 'host' : s === 'nat' ? 'srflx' : 'relay';
}

const ev = (
  t: number,
  from: Peer,
  via: Via,
  phase: Phase,
  kind: EventKind,
  label: string,
  extra?: { cand?: CandType; ok?: boolean },
): RtcEvent => ({ t, from, via, phase, kind, label, ...extra });

/*
 * Build the deterministic script for a scenario. Addresses use the RFC 5737 documentation ranges;
 * host candidates use private-range examples (browsers actually publish them as mDNS `.local` names —
 * the module's ice-candidates topic covers that).
 */
export function timeline(s: Scenario): RtcEvent[] {
  const out: RtcEvent[] = [];
  let t = 0;

  // ── Phase 1 · signaling: JSEP offer/answer via YOUR channel ────────────────
  out.push(ev(t++, 'a', 'local', 'signaling', 'api', "createDataChannel('game') · createOffer() · setLocalDescription"));
  out.push(ev(t++, 'a', 'signal', 'signaling', 'sdp', 'SDP offer (m-lines · DTLS fingerprint)'));
  out.push(ev(t, 'b', 'local', 'signaling', 'api', 'setRemoteDescription · createAnswer() · setLocalDescription'));
  out.push(ev(++t, 'b', 'signal', 'signaling', 'sdp', 'SDP answer (m-lines · DTLS fingerprint)'));
  t++;

  // ── Phase 2 · ICE: trickle candidates (via signaling), then checks (direct) ─
  // Open internet → the peers' own interfaces carry public addresses, which is exactly why the
  // host↔host pair can work; behind NATs the host candidates are private-range (unroutable across NAT).
  const hostA = s === 'open' ? 'candidate: host 203.0.113.7' : 'candidate: host 10.0.1.7';
  const hostB = s === 'open' ? 'candidate: host 198.51.100.9' : 'candidate: host 192.168.1.22';
  out.push(ev(t, 'a', 'signal', 'ice', 'candidate', hostA, { cand: 'host' }));
  out.push(ev(t, 'b', 'signal', 'ice', 'candidate', hostB, { cand: 'host' }));
  t++;

  if (s !== 'open') {
    out.push(ev(t, 'a', 'stun', 'ice', 'stun-query', 'STUN Binding → srflx 203.0.113.7:61000'));
    out.push(ev(t, 'b', 'stun', 'ice', 'stun-query', 'STUN Binding → srflx 198.51.100.9:52011'));
    t++;
    out.push(ev(t, 'a', 'signal', 'ice', 'candidate', 'candidate: srflx 203.0.113.7:61000', { cand: 'srflx' }));
    out.push(ev(t, 'b', 'signal', 'ice', 'candidate', 'candidate: srflx 198.51.100.9:52011', { cand: 'srflx' }));
    t++;
  }
  if (s === 'relay') {
    out.push(ev(t, 'a', 'turn', 'ice', 'turn-allocate', 'TURN Allocate → relay 192.0.2.15:49152'));
    out.push(ev(t, 'b', 'turn', 'ice', 'turn-allocate', 'TURN Allocate → relay 192.0.2.15:49153'));
    t++;
    out.push(ev(t, 'a', 'signal', 'ice', 'candidate', 'candidate: relay 192.0.2.15:49152', { cand: 'relay' }));
    out.push(ev(t, 'b', 'signal', 'ice', 'candidate', 'candidate: relay 192.0.2.15:49153', { cand: 'relay' }));
    t++;
  }

  // Connectivity checks — peer↔peer STUN probes on each pair, cheapest-first (host → srflx → relay),
  // stopping at the first pair that answers.
  const hostOk = s === 'open';
  out.push(ev(t++, 'a', 'direct', 'ice', 'check', 'check: host ↔ host', { cand: 'host', ok: hostOk }));
  if (!hostOk && s === 'nat') {
    out.push(ev(t++, 'a', 'direct', 'ice', 'check', 'check: srflx ↔ srflx', { cand: 'srflx', ok: true }));
  }
  if (s === 'relay') {
    out.push(ev(t++, 'a', 'direct', 'ice', 'check', 'check: srflx ↔ srflx (symmetric NAT re-maps ports)', { cand: 'srflx', ok: false }));
    out.push(ev(t++, 'a', 'turn', 'ice', 'check', 'check: via TURN relay', { cand: 'relay', ok: true }));
  }
  const pair = selectedPair(s);
  const pathVia: Via = pair === 'relay' ? 'turn' : 'direct';
  out.push(ev(t++, 'a', pathVia, 'ice', 'pair-selected', `selected pair: ${pair} ↔ ${pair}`, { cand: pair }));

  // ── Phase 3 · DTLS on the selected pair (keys for SRTP media + SCTP data) ──
  out.push(ev(t++, 'a', pathVia, 'dtls', 'dtls', 'DTLS ClientHello (cert ⇄ SDP fingerprint)'));
  out.push(ev(t++, 'b', pathVia, 'dtls', 'dtls', 'DTLS done → keys for SRTP + SCTP'));

  // ── Phase 4 · connected: full-duplex data + media, never via the server ────
  out.push(ev(t, 'a', pathVia, 'connected', 'data', "datachannel 'game': open (DCEP)"));
  out.push(ev(t, 'b', pathVia, 'connected', 'media', 'SRTP media flows'));
  t++;
  out.push(ev(t, 'a', pathVia, 'connected', 'data', "datachannel: 'move e2e4'"));
  out.push(ev(t, 'b', pathVia, 'connected', 'data', "datachannel: 'move e7e5'"));

  return out;
}

/** The final tick of a scenario's script. */
export function lastTick(tl: RtcEvent[]): number {
  return tl.reduce((max, e) => Math.max(max, e.t), 0);
}

/** The phase in force at tick `t` (phase of the latest event at or before `t`). */
export function phaseAt(tl: RtcEvent[], t: number): Phase {
  let phase: Phase = 'signaling';
  for (const e of tl) if (e.t <= t) phase = e.phase;
  return phase;
}

/** How many events travelled each way — proves the server only ever carries signaling. */
export function viaCounts(tl: RtcEvent[]): Record<Via, number> {
  const c: Record<Via, number> = { local: 0, signal: 0, stun: 0, turn: 0, direct: 0 };
  for (const e of tl) c[e.via]++;
  return c;
}
