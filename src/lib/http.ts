/*
 * http.ts — pure, deterministic engine for the `http-multiplexing` signature sim (CLAUDE.md §6, m3).
 * No React, no DOM, no randomness — so scripts/test-http.ts can assert it exactly and the component
 * (HttpMultiplexingSim) is a thin renderer over it.
 *
 * The model: fetch N requests under HTTP/1.1, /2, or /3 and schedule them on a stepped integer clock.
 *   - h1: a small pool of parallel TCP connections; each connection serves its queue in order, so
 *     requests beyond the pool wait — and a stalled response blocks the ones queued behind it on the
 *     SAME connection (per-connection head-of-line blocking). No multiplexing (RFC 9112).
 *   - h2: one TCP connection, every request multiplexed as a concurrent stream (no queue) — but one
 *     lost segment stalls EVERY stream on that connection until it is retransmitted, because all
 *     streams share TCP's single ordered byte-stream (TCP-level HOL blocking; RFC 9113).
 *   - h3: one QUIC connection, streams multiplexed with independent per-stream loss recovery — a lost
 *     packet stalls only its own stream; the others keep flowing (QUIC removes transport HOL;
 *     RFC 9114 over RFC 9000).
 * Ticks are abstract scheduling units, not milliseconds. Deterministic and total: same options → same
 * schedule, so the golden test and the component agree by construction.
 */

export type Protocol = 'h1' | 'h2' | 'h3';

export const PROTOCOLS: Protocol[] = ['h1', 'h2', 'h3'];

export interface ProtocolFacts {
  id: Protocol;
  /** wire name for the display badge */
  wire: string;
  transport: 'TCP' | 'QUIC / UDP';
  /** many short-lived TCP connections (h1) vs one long-lived connection carrying streams (h2/h3) */
  multiplexed: boolean;
  /** where a lost packet blocks progress */
  holScope: 'per-connection' | 'all-streams' | 'single-stream';
}

export const PROTOCOL_FACTS: Record<Protocol, ProtocolFacts> = {
  h1: { id: 'h1', wire: 'HTTP/1.1', transport: 'TCP', multiplexed: false, holScope: 'per-connection' },
  h2: { id: 'h2', wire: 'HTTP/2', transport: 'TCP', multiplexed: true, holScope: 'all-streams' },
  h3: { id: 'h3', wire: 'HTTP/3', transport: 'QUIC / UDP', multiplexed: true, holScope: 'single-stream' },
};

export interface SimOptions {
  protocol: Protocol;
  /** how many resources the page fetches at once */
  requests: number;
  /** parallel TCP connections HTTP/1.1 may open to one host (browsers cap around 6) */
  h1Connections: number;
  /** ticks of service one request needs on an unobstructed connection */
  cost: number;
  /** inject one lost packet */
  loss: boolean;
  /** extra ticks a stall costs while the loss is detected and retransmitted */
  lossPenalty: number;
  /** the request index the lost packet belongs to (deterministic, so the test can pin it) */
  lossStream: number;
}

/** Teaching defaults: 8 requests past a 6-connection cap makes multiplexing visible; loss off. */
export const DEFAULTS: Omit<SimOptions, 'protocol'> = {
  requests: 8,
  h1Connections: 6,
  cost: 3,
  loss: false,
  lossPenalty: 3,
  lossStream: 0,
};

/** Request-count presets the UI offers (kept small so lanes stay legible). */
export const REQUEST_CHOICES: number[] = [4, 8, 12];

export interface StreamTrace {
  /** request index (0-based) */
  id: number;
  /** visual row: h1 → connection index; h2/h3 → its own stream row */
  lane: number;
  /** tick service begins */
  start: number;
  /** tick it completes */
  end: number;
  /** its completion was pushed out by the injected loss */
  stalled: boolean;
}

export interface SimResult {
  protocol: Protocol;
  /** sockets opened: h1 → min(pool, requests); h2/h3 → 1 */
  connections: number;
  streams: StreamTrace[];
  /** last completion — time to fetch every resource */
  totalTicks: number;
  /** mean completion — the latency metric head-of-line blocking actually moves */
  avgTicks: number;
  stalledStreams: number;
  facts: ProtocolFacts;
}

const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Rank every stream's schedule for one protocol under the given options. Pure & total. */
export function simulate(opts: SimOptions): SimResult {
  const n = Math.max(1, Math.floor(opts.requests));
  const streams = opts.protocol === 'h1' ? scheduleH1(opts, n) : scheduleMux(opts, n);
  const ends = streams.map((s) => s.end);
  const connections = opts.protocol === 'h1' ? Math.min(Math.max(1, opts.h1Connections), n) : 1;
  return {
    protocol: opts.protocol,
    connections,
    streams,
    totalTicks: Math.max(...ends),
    avgTicks: round2(mean(ends)),
    stalledStreams: streams.filter((s) => s.stalled).length,
    facts: PROTOCOL_FACTS[opts.protocol],
  };
}

// HTTP/1.1 — round-robin requests onto a fixed pool of connections; each connection is a FIFO queue.
// A request beyond the pool waits its turn; the loss victim's retransmit lengthens its connection, so
// whatever is queued behind it on that SAME connection is delayed too (per-connection HOL).
function scheduleH1(o: SimOptions, n: number): StreamTrace[] {
  const conns = Math.min(Math.max(1, o.h1Connections), n);
  const freeAt = new Array<number>(conns).fill(0); // next free tick per connection
  const victimLane = o.lossStream % conns;
  const victimPos = Math.floor(o.lossStream / conns);
  const hasVictim = o.loss && o.lossStream >= 0 && o.lossStream < n;
  const streams: StreamTrace[] = [];
  for (let i = 0; i < n; i++) {
    const lane = i % conns;
    const pos = Math.floor(i / conns);
    const start = freeAt[lane];
    let end = start + o.cost;
    // The retransmit cost lands once, on the victim request itself; followers inherit the delay purely
    // through freeAt (a 1.1 connection returns responses in order, so they simply start later).
    if (hasVictim && i === o.lossStream) end += o.lossPenalty;
    const stalled = hasVictim && lane === victimLane && pos >= victimPos;
    freeAt[lane] = end;
    streams.push({ id: i, lane, start, end, stalled });
  }
  return streams;
}

// HTTP/2 & HTTP/3 — one connection, all requests are concurrent streams starting at t=0.
//   h2: a lost segment stalls the whole shared TCP byte-stream → every stream waits (all-streams HOL).
//   h3: QUIC recovers each stream independently → only the loss's own stream waits (single-stream).
function scheduleMux(o: SimOptions, n: number): StreamTrace[] {
  const stallAll = o.protocol === 'h2';
  const streams: StreamTrace[] = [];
  for (let i = 0; i < n; i++) {
    const stalled = o.loss && (stallAll || i === o.lossStream);
    const end = o.cost + (stalled ? o.lossPenalty : 0);
    streams.push({ id: i, lane: i, start: 0, end, stalled });
  }
  return streams;
}
