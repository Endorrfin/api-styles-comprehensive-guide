/*
 * ws.ts — pure, deterministic engine for the `websocket-frames` signature sim (CLAUDE.md §6, m12).
 * No React, no DOM, no randomness — so scripts/test-ws.ts can assert the script exactly and the component
 * (WebsocketFramesSim) is a thin renderer over it.
 *
 * The model: a single WebSocket connection's life on a stepped clock — the HTTP Upgrade handshake
 * (GET Upgrade → 101 Switching Protocols), then a full-duplex exchange of frames flowing in BOTH
 * directions independently: text/binary data frames, a ping/pong keepalive pair, and the closing
 * handshake. Two rules from RFC 6455 §5 are baked in by construction so the test guards them:
 *   - client→server frames are ALWAYS masked; server→client frames are NEVER masked;
 *   - control frames (close 0x8, ping 0x9, pong 0xA) sit above the data opcodes (text 0x1, binary 0x2).
 * Refs: RFC 6455 (https://datatracker.ietf.org/doc/html/rfc6455); MDN Writing WebSocket servers
 * (frame format, opcodes, masking) (https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers).
 */

export type Dir = 'c2s' | 's2c'; // client→server · server→client

// The opcodes this sim shows (RFC 6455 §5.2); 0x0 continuation appears in the fragmented message below.
export type Opcode = 0x0 | 0x1 | 0x2 | 0x8 | 0x9 | 0xa;
export const OP = {
  continuation: 0x0,
  text: 0x1,
  binary: 0x2,
  close: 0x8,
  ping: 0x9,
  pong: 0xa,
} as const;
export const OP_NAME: Record<Opcode, string> = {
  0x0: 'continuation',
  0x1: 'text',
  0x2: 'binary',
  0x8: 'close',
  0x9: 'ping',
  0xa: 'pong',
};

/** Control frames are opcodes ≥ 0x8 (close, ping, pong). */
export const isControl = (op: Opcode): boolean => op >= 0x8;

export type EventKind = 'handshake-req' | 'handshake-res' | 'frame';

export interface WsEvent {
  /** clock tick this event occurs on (0-based; the handshake is ticks 0–1) */
  t: number;
  dir: Dir;
  kind: EventKind;
  /** handshake line (HTTP), present for the two handshake events */
  http?: string;
  /** frame fields (present for kind 'frame') */
  opcode?: Opcode;
  fin?: boolean;
  masked?: boolean;
  control?: boolean;
  /** short human label of the payload / purpose */
  label?: string;
}

/** Build a frame event with masking derived from direction (RFC 6455 §5.1) — correct by construction. */
function frame(t: number, dir: Dir, opcode: Opcode, label: string, fin = true): WsEvent {
  return { t, dir, kind: 'frame', opcode, fin, masked: dir === 'c2s', control: isControl(opcode), label };
}

/*
 * The scripted conversation. Ticks 0–1 are the handshake; from tick 2 the socket is open and both sides
 * send freely. Tick 4 carries a frame in EACH direction (server push + client ping) to make full-duplex
 * concurrency visible; the ping (0x9, tick 4) is answered by a pong (0xA, tick 5); ticks 8–9 are ONE
 * message fragmented across a text frame (FIN=0) and a continuation frame (0x0, FIN=1); ticks 10–11 are
 * the closing handshake.
 */
export const SCRIPT: WsEvent[] = [
  { t: 0, dir: 'c2s', kind: 'handshake-req', http: 'GET /chat · Upgrade: websocket' },
  { t: 1, dir: 's2c', kind: 'handshake-res', http: '101 Switching Protocols' },
  frame(2, 'c2s', OP.text, 'subscribe prices'),
  frame(3, 's2c', OP.text, 'ACK'),
  frame(4, 's2c', OP.text, 'AAPL 191.2'), // server push …
  frame(4, 'c2s', OP.ping, 'ping'), // … while the client pings — same tick, opposite ways
  frame(5, 's2c', OP.pong, 'pong'), // must echo the ping
  frame(5, 's2c', OP.text, 'AAPL 191.4'),
  frame(6, 'c2s', OP.binary, 'order.bin'),
  frame(7, 's2c', OP.text, 'order filled'),
  frame(8, 's2c', OP.text, 'daily report…', false), // fragmented message — first frame, FIN=0
  frame(9, 's2c', OP.continuation, '…report (cont.)'), // continuation frame (0x0), FIN=1 completes it
  frame(10, 'c2s', OP.close, 'close 1000'),
  frame(11, 's2c', OP.close, 'close 1000'),
];

/** The last tick in the script (the clock's end). */
export const LAST_TICK: number = SCRIPT.reduce((max, e) => Math.max(max, e.t), 0);

/** The scripted timeline (a fresh shallow copy so callers can’t mutate the module constant). */
export function timeline(): WsEvent[] {
  return SCRIPT.map((e) => ({ ...e }));
}

/** The leading frame byte: FIN in bit 0, opcode in bits 4–7 → (fin?0x80:0)|opcode. Exported for the test. */
export function firstByte(opcode: Opcode, fin: boolean): number {
  return (fin ? 0x80 : 0) | opcode;
}

/** Two-digit uppercase hex for a byte (UI helper). */
export function hex(b: number): string {
  return b.toString(16).toUpperCase().padStart(2, '0');
}
