/*
 * test-grpc.ts — golden test for the protobuf wire encoder (src/lib/grpc.ts). Run by run-tests.ts.
 * Deterministic assertions; process.exit(1) on any failure so the runner marks it red.
 * Scenarios pin the module's core claims: tag = (field<<3)|wire, varint value encoding, length-delimited
 * strings, proto3 default omission, and that Protobuf is smaller than the equivalent JSON.
 */
import { encode, varint, tag, SCHEMA, DEFAULT_ARTICLE, type ArticleValue } from '../src/lib/grpc';

let failures = 0;
function assert(cond: unknown, msg: string): void {
  if (!cond) {
    failures++;
    console.error('  ✖ ' + msg);
  }
}
const eq = (a: number[], b: number[]): boolean => a.length === b.length && a.every((x, i) => x === b[i]);
const enc = (v: Partial<ArticleValue>): ReturnType<typeof encode> => encode({ id: 0, title: '', tags: [], ...v });

// 0 · Structural: the demo schema is the Article message, fields 1..3 with the right wire types.
{
  assert(SCHEMA.length === 3, `schema: 3 fields (got ${SCHEMA.length})`);
  assert(SCHEMA.map((f) => f.num).join(',') === '1,2,3', 'schema: field numbers 1,2,3');
  assert(SCHEMA[0].wire === 0, 'id is a varint field (wire 0)');
  assert(SCHEMA[1].wire === 2 && SCHEMA[2].wire === 2, 'title & tags are length-delimited (wire 2)');
}

// 1 · Varint (LEB128): little-endian base-128 with a continuation bit.
{
  assert(eq(varint(0), [0]), 'varint(0) = [00]');
  assert(eq(varint(1), [1]), 'varint(1) = [01]');
  assert(eq(varint(42), [0x2a]), 'varint(42) = [2A]');
  assert(eq(varint(150), [0x96, 0x01]), 'varint(150) = [96 01]');
  assert(eq(varint(300), [0xac, 0x02]), 'varint(300) = [AC 02]');
  assert(eq(varint(16384), [0x80, 0x80, 0x01]), 'varint(16384) = [80 80 01]');
}

// 2 · Tag = (field_number << 3) | wire_type, varint-encoded (single byte for fields < 16).
{
  assert(eq(tag(1, 0), [0x08]), 'tag(1, varint) = 0x08');
  assert(eq(tag(2, 2), [0x12]), 'tag(2, len) = 0x12');
  assert(eq(tag(3, 2), [0x1a]), 'tag(3, len) = 0x1A');
}

// 3 · Full message: id=42, title="hi", tags=["a"] → exact bytes.
{
  const r = enc({ id: 42, title: 'hi', tags: ['a'] });
  // 08 2A | 12 02 68 69 | 1A 01 61
  assert(eq(r.bytes, [0x08, 0x2a, 0x12, 0x02, 0x68, 0x69, 0x1a, 0x01, 0x61]), `encode bytes exact (got ${r.bytes.map((b) => b.toString(16)).join(' ')})`);
  assert(r.totalBytes === 9, `total = 9 bytes (got ${r.totalBytes})`);
  assert(r.omitted.length === 0, 'nothing omitted when all fields are non-default');
  assert(r.fields.length === 3, '3 emitted records (id, title, one tag)');
}

// 4 · proto3 default omission: id=0 and title="" are NOT serialised.
{
  const r = enc({ id: 0, title: '', tags: [] });
  assert(r.bytes.length === 0, 'all-default message serialises to 0 bytes');
  assert(r.fields.length === 0, 'no fields emitted');
  assert(r.omitted.some((o) => o.num === 1) && r.omitted.some((o) => o.num === 2), 'id & title reported as omitted defaults');
}
{
  const r = enc({ id: 0, title: 'grpc', tags: [] });
  assert(r.omitted.length === 1 && r.omitted[0].num === 1, 'only id omitted when title is set');
  assert(r.fields.length === 1 && r.fields[0].name === 'title', 'title is the sole emitted field');
}

// 5 · Length-delimited string: tag, length varint, then UTF-8 bytes. "grpc" → 04 67 72 70 63.
{
  const r = enc({ id: 0, title: 'grpc', tags: [] });
  const title = r.fields[0];
  assert(eq(title.lenBytes, [0x04]), 'title length prefix = 04');
  assert(eq(title.valueBytes, [0x67, 0x72, 0x70, 0x63]), 'title UTF-8 = 67 72 70 63');
  assert(eq(title.bytes, [0x12, 0x04, 0x67, 0x72, 0x70, 0x63]), 'title record = 12 04 67 72 70 63');
}

// 6 · Repeated strings: one record per element, each with field number 3.
{
  const r = enc({ id: 0, title: '', tags: ['a', 'b'] });
  assert(r.fields.length === 2, 'two records for two tags');
  assert(r.fields.every((f) => f.num === 3), 'both carry field number 3');
}

// 7 · Multi-byte varint value inside a message: id=300 → 08 AC 02.
{
  const r = enc({ id: 300, title: '', tags: [] });
  assert(eq(r.fields[0].valueBytes, [0xac, 0x02]), 'id=300 value = AC 02');
  assert(eq(r.bytes, [0x08, 0xac, 0x02]), 'id=300 record = 08 AC 02');
}

// 8 · Protobuf beats JSON on size for the default record (field numbers, not names, on the wire).
{
  const r = encode(DEFAULT_ARTICLE);
  assert(r.totalBytes < r.jsonBytes, `protobuf (${r.totalBytes}) < JSON (${r.jsonBytes})`);
  assert(r.totalBytes === 21, `default record = 21 bytes (got ${r.totalBytes})`);
}

// 9 · Determinism: identical input → identical bytes.
{
  const a = encode(DEFAULT_ARTICLE);
  const b = encode(DEFAULT_ARTICLE);
  assert(JSON.stringify(a) === JSON.stringify(b), 'encode is deterministic');
}

if (failures > 0) {
  console.error(`\n✖ test-grpc: ${failures} failure(s).`);
  process.exit(1);
}
console.log('✓ test-grpc — protobuf wire encoder: varint, tags, length-delimited, proto3 omission, size all pass.');
