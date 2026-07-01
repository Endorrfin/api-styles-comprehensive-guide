/*
 * grpc.ts — pure, deterministic engine for the `grpc-wire` signature sim (m10). Encodes a fixed
 * protobuf message to its on-the-wire bytes so scripts/test-grpc.ts can assert them exactly and the
 * component (GrpcWireSim) is a thin renderer over it. No React, no DOM, no randomness.
 *
 * Models proto3 encoding: each field is a tag = (field_number << 3) | wire_type (itself a varint),
 * followed by a varint value (wire type 0) or a length-prefixed payload (wire type 2, LEN). Scalar
 * fields equal to their default (0, "") are NOT serialised — proto3's field-presence rule.
 * Reference: Protocol Buffers — Encoding (https://protobuf.dev/programming-guides/encoding/).
 */

// This demo message needs only two of protobuf's wire types.
export type WireType = 0 | 2; // 0 = VARINT (int64) · 2 = LEN (length-delimited string)

export type FieldType = 'int64' | 'string' | 'repeated-string';

export interface FieldSpec {
  num: number;
  name: string;
  type: FieldType;
  wire: WireType;
}

// The demo schema — the same Article used in m4's Protobuf example, for continuity.
export const SCHEMA: FieldSpec[] = [
  { num: 1, name: 'id', type: 'int64', wire: 0 },
  { num: 2, name: 'title', type: 'string', wire: 2 },
  { num: 3, name: 'tags', type: 'repeated-string', wire: 2 },
];

export interface ArticleValue {
  id: number;
  title: string;
  tags: string[];
}

export interface EncodedField {
  num: number;
  name: string;
  wire: WireType;
  /** the value shown to the reader ("42", "grpc", …) */
  display: string;
  tagBytes: number[]; // varint((num << 3) | wire)
  lenBytes: number[]; // length varint (LEN fields only; [] for varint fields)
  valueBytes: number[]; // varint value, or UTF-8 string bytes
  bytes: number[]; // tagBytes + lenBytes + valueBytes
}

export interface Omitted {
  num: number;
  name: string;
}

export interface Encoded {
  /** emitted fields, in wire order (a repeated field yields several entries with the same num) */
  fields: EncodedField[];
  /** scalar fields left off the wire because they equal the proto3 default */
  omitted: Omitted[];
  bytes: number[]; // the whole message
  totalBytes: number;
  jsonBytes: number; // UTF-8 size of JSON.stringify(value), for the size comparison
}

const utf8 = (s: string): number[] => Array.from(new TextEncoder().encode(s));

/** Unsigned LEB128 varint (protobuf). Non-negative integers only. Exported for the golden test. */
export function varint(n: number): number[] {
  const out: number[] = [];
  let x = Math.max(0, Math.floor(n));
  do {
    let byte = x % 128;
    x = Math.floor(x / 128);
    if (x > 0) byte += 128; // set the continuation bit while more 7-bit groups remain
    out.push(byte);
  } while (x > 0);
  return out;
}

/** Field tag = (field_number << 3) | wire_type, itself varint-encoded. Exported for the test. */
export function tag(field: number, wire: WireType): number[] {
  return varint(field * 8 + wire);
}

function lenField(spec: FieldSpec, value: string): EncodedField {
  const valueBytes = utf8(value);
  const tagBytes = tag(spec.num, 2);
  const lenBytes = varint(valueBytes.length);
  return {
    num: spec.num,
    name: spec.name,
    wire: 2,
    display: value,
    tagBytes,
    lenBytes,
    valueBytes,
    bytes: [...tagBytes, ...lenBytes, ...valueBytes],
  };
}

function varintField(spec: FieldSpec, value: number): EncodedField {
  const valueBytes = varint(value);
  const tagBytes = tag(spec.num, 0);
  return {
    num: spec.num,
    name: spec.name,
    wire: 0,
    display: String(value),
    tagBytes,
    lenBytes: [],
    valueBytes,
    bytes: [...tagBytes, ...valueBytes],
  };
}

/** Encode the Article to protobuf wire bytes under proto3 rules. Deterministic & total. */
export function encode(v: ArticleValue): Encoded {
  const fields: EncodedField[] = [];
  const omitted: Omitted[] = [];

  // id (int64, field 1) — omitted when 0 (proto3 default).
  if (Math.floor(v.id) === 0) omitted.push({ num: 1, name: 'id' });
  else fields.push(varintField(SCHEMA[0], Math.floor(v.id)));

  // title (string, field 2) — omitted when "" (proto3 default).
  if (v.title === '') omitted.push({ num: 2, name: 'title' });
  else fields.push(lenField(SCHEMA[1], v.title));

  // tags (repeated string, field 3) — one LEN record per element; an empty list emits nothing.
  for (const tagVal of v.tags) fields.push(lenField(SCHEMA[2], tagVal));

  const bytes = fields.flatMap((f) => f.bytes);
  return { fields, omitted, bytes, totalBytes: bytes.length, jsonBytes: utf8(JSON.stringify(v)).length };
}

/** Two-digit uppercase hex for a byte (UI helper). */
export function hex(b: number): string {
  return b.toString(16).toUpperCase().padStart(2, '0');
}

export const DEFAULT_ARTICLE: ArticleValue = { id: 42, title: 'grpc', tags: ['fast', 'typed'] };
export const ID_CHOICES: number[] = [1, 42, 150, 300];
export const TAG_POOL: string[] = ['fast', 'typed', 'http2'];
