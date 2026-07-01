/*
 * test-ws.ts — golden test for the WebSocket timeline engine (src/lib/ws.ts). Run by run-tests.ts.
 * Deterministic assertions; process.exit(1) on any failure so the runner marks it red.
 * Scenarios pin the module's core claims: the handshake precedes all frames and returns 101; opcodes are
 * correct; client→server frames are masked and server→client are not (RFC 6455 §5.1); control frames sit
 * at opcodes ≥ 0x8; a ping is answered by a pong; the exchange is genuinely full-duplex; leading-byte
 * math (FIN|opcode) is right; and the timeline is deterministic.
 */
import { timeline, firstByte, hex, isControl, OP, OP_NAME, LAST_TICK, type WsEvent } from '../src/lib/ws';

let failures = 0;
function assert(cond: unknown, msg: string): void {
  if (!cond) {
    failures++;
    console.error('  ✖ ' + msg);
  }
}
const tl = timeline();
const frames = tl.filter((e) => e.kind === 'frame');

// 0 · Opcode constants match RFC 6455 §5.2.
{
  assert(OP.text === 0x1 && OP.binary === 0x2, 'data opcodes: text 0x1, binary 0x2');
  assert(OP.close === 0x8 && OP.ping === 0x9 && OP.pong === 0xa, 'control opcodes: close 0x8, ping 0x9, pong 0xA');
  assert(OP_NAME[0x1] === 'text' && OP_NAME[0xa] === 'pong', 'opcode names resolve');
}

// 1 · Handshake first: the first two events are the Upgrade request then the 101 response, before frames.
{
  assert(tl[0].kind === 'handshake-req' && tl[0].dir === 'c2s', 'first event is the client Upgrade request');
  assert(tl[1].kind === 'handshake-res' && tl[1].dir === 's2c', 'second event is the server response');
  assert((tl[1].http ?? '').includes('101'), 'server response is 101 Switching Protocols');
  assert((tl[0].http ?? '').toLowerCase().includes('upgrade'), 'client request carries Upgrade');
  const firstFrameTick = Math.min(...frames.map((f) => f.t));
  assert(firstFrameTick > tl[1].t, 'all frames come after the handshake completes');
}

// 2 · Masking rule (RFC 6455 §5.1): client→server MUST be masked; server→client MUST NOT be.
{
  assert(
    frames.filter((f) => f.dir === 'c2s').every((f) => f.masked === true),
    'every client→server frame is masked',
  );
  assert(
    frames.filter((f) => f.dir === 's2c').every((f) => f.masked === false),
    'no server→client frame is masked',
  );
}

// 3 · Control vs data framing: close/ping/pong are control (≥0x8); text/binary are not.
{
  assert(isControl(OP.ping) && isControl(OP.pong) && isControl(OP.close), 'ping/pong/close are control frames');
  assert(!isControl(OP.text) && !isControl(OP.binary), 'text/binary are data frames');
  assert(
    frames.every((f) => f.control === (f.opcode !== undefined && f.opcode >= 0x8)),
    "each frame's control flag matches its opcode",
  );
}

// 4 · Keepalive: every ping is answered by a later pong.
{
  const pings = frames.filter((f) => f.opcode === OP.ping);
  const pongs = frames.filter((f) => f.opcode === OP.pong);
  assert(pings.length >= 1 && pongs.length >= 1, 'the script contains a ping and a pong');
  assert(
    pings.every((ping) => pongs.some((pong) => pong.t > ping.t)),
    'each ping is followed by a pong',
  );
}

// 5 · Full-duplex: at least one tick carries frames in BOTH directions at once.
{
  const ticks = new Map<number, Set<WsEvent['dir']>>();
  for (const f of frames) {
    if (!ticks.has(f.t)) ticks.set(f.t, new Set());
    ticks.get(f.t)!.add(f.dir);
  }
  const overlap = [...ticks.values()].some((dirs) => dirs.has('c2s') && dirs.has('s2c'));
  assert(overlap, 'some tick has both a client→server and a server→client frame (full-duplex)');
}

// 6 · Closing handshake: both sides send a close frame.
{
  const closes = frames.filter((f) => f.opcode === OP.close);
  assert(closes.some((c) => c.dir === 'c2s') && closes.some((c) => c.dir === 's2c'), 'both peers send a close frame');
}

// 7 · Leading byte: FIN in bit 0, opcode in bits 4–7 → 0x80 | opcode when FIN set.
{
  assert(firstByte(OP.text, true) === 0x81, 'firstByte(text, FIN) = 0x81');
  assert(firstByte(OP.binary, true) === 0x82, 'firstByte(binary, FIN) = 0x82');
  assert(firstByte(OP.ping, true) === 0x89, 'firstByte(ping, FIN) = 0x89');
  assert(firstByte(OP.close, true) === 0x88, 'firstByte(close, FIN) = 0x88');
  assert(firstByte(OP.text, false) === 0x01, 'firstByte(text, no FIN) = 0x01 (continuation follows)');
  assert(hex(0x81) === '81' && hex(0x0a) === '0A', 'hex() pads to two uppercase digits');
}

// 8 · Determinism: identical calls → identical timeline; LAST_TICK is the max tick.
{
  assert(JSON.stringify(timeline()) === JSON.stringify(timeline()), 'timeline() is deterministic');
  assert(LAST_TICK === Math.max(...tl.map((e) => e.t)), 'LAST_TICK is the final tick');
}

if (failures > 0) {
  console.error(`\n✖ test-ws: ${failures} failure(s).`);
  process.exit(1);
}
console.log('✓ test-ws — WebSocket timeline: handshake→101, opcodes, masking rule, ping→pong, full-duplex, framing all pass.');
