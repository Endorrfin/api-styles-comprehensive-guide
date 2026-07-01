/*
 * compass.ts — pure, deterministic engine for the `style-compass` signature sim (CLAUDE.md §6, m2).
 * No React, no DOM, no randomness — so scripts/test-compass.ts can assert it exactly and the component
 * (StyleCompassSim) + the landing hero are thin renderers over it.
 *
 * The model: every API style is a POINT on a handful of decision axes (m2's seven topics). Each axis is
 * a 0..1 scale (0 = the left endpoint, 1 = the right). The user picks a target on any subset of axes; a
 * style's match score is 1 minus its mean distance to those targets, over the axes the user actually set.
 * Unset axes are "Any" and never penalise. Deterministic and total — same input, same ranking, always.
 */
import type { Localized } from '../data/types';

// ── Axes ───────────────────────────────────────────────────────────────────
// Order matches m2's topic order. Ids are stable (used as object keys + test selectors).
export type AxisId =
  | 'timing' // sync-vs-async
  | 'flow' // reqresp-streaming-push
  | 'direction' // unary-vs-bidirectional
  | 'initiative' // client-vs-server-driven
  | 'encoding' // text-vs-binary
  | 'topology' // p2p-vs-broker
  | 'coupling'; // coupling-spectrum

export interface AxisOption {
  /** value on the 0..1 axis */
  v: number;
  label: Localized;
}
export interface Axis {
  id: AxisId;
  /** short axis name (chip / control legend) */
  label: Localized;
  /** the decision question this axis answers */
  question: Localized;
  left: Localized; // caption at v=0
  right: Localized; // caption at v=1
  /** selectable stops (2 for a binary axis, 3 for a spectrum) */
  options: AxisOption[];
}

export const AXES: Axis[] = [
  {
    id: 'timing',
    label: { en: 'Timing', uk: 'Timing' },
    question: { en: 'Does the caller wait for the result?', uk: 'Чи чекає викликач на результат?' },
    left: { en: 'Synchronous', uk: 'Synchronous' },
    right: { en: 'Asynchronous', uk: 'Asynchronous' },
    options: [
      { v: 0, label: { en: 'Sync — wait for the reply', uk: 'Sync — чекати на відповідь' } },
      { v: 1, label: { en: 'Async — decoupled in time', uk: 'Async — розчеплено в часі' } },
    ],
  },
  {
    id: 'flow',
    label: { en: 'Flow', uk: 'Flow' },
    question: { en: 'How does data move — one answer, a stream, or a push?', uk: 'Як рухаються дані — одна відповідь, потік чи push?' },
    left: { en: 'Request / response', uk: 'Request / response' },
    right: { en: 'Server push', uk: 'Server push' },
    options: [
      { v: 0, label: { en: 'Request/response', uk: 'Request/response' } },
      { v: 0.5, label: { en: 'Streaming', uk: 'Streaming' } },
      { v: 1, label: { en: 'Event push', uk: 'Event push' } },
    ],
  },
  {
    id: 'direction',
    label: { en: 'Direction', uk: 'Direction' },
    question: { en: 'Who can send — one side, or both at once?', uk: 'Хто може надсилати — одна сторона чи обидві водночас?' },
    left: { en: 'One-way / unary', uk: 'One-way / unary' },
    right: { en: 'Bidirectional', uk: 'Bidirectional' },
    options: [
      { v: 0, label: { en: 'One-way / unary', uk: 'One-way / unary' } },
      { v: 1, label: { en: 'Bidirectional', uk: 'Bidirectional' } },
    ],
  },
  {
    id: 'initiative',
    label: { en: 'Initiative', uk: 'Initiative' },
    question: { en: 'Who starts the conversation?', uk: 'Хто починає розмову?' },
    left: { en: 'Client-initiated', uk: 'Client-initiated' },
    right: { en: 'Server-initiated', uk: 'Server-initiated' },
    options: [
      { v: 0, label: { en: 'Client asks first', uk: 'Клієнт питає першим' } },
      { v: 1, label: { en: 'Server pushes first', uk: 'Сервер пушить першим' } },
    ],
  },
  {
    id: 'encoding',
    label: { en: 'Encoding', uk: 'Encoding' },
    question: { en: 'Is the payload human-readable text or a binary format?', uk: 'Payload — це читабельний текст чи binary-формат?' },
    left: { en: 'Text', uk: 'Text' },
    right: { en: 'Binary', uk: 'Binary' },
    options: [
      { v: 0, label: { en: 'Text (JSON/XML)', uk: 'Text (JSON/XML)' } },
      { v: 1, label: { en: 'Binary (Protobuf…)', uk: 'Binary (Protobuf…)' } },
    ],
  },
  {
    id: 'topology',
    label: { en: 'Topology', uk: 'Topology' },
    question: { en: 'Do the two sides talk directly, or through a broker?', uk: 'Сторони говорять напряму чи через broker?' },
    left: { en: 'Point-to-point', uk: 'Point-to-point' },
    right: { en: 'Broker-mediated', uk: 'Broker-mediated' },
    options: [
      { v: 0, label: { en: 'Direct point-to-point', uk: 'Прямий point-to-point' } },
      { v: 1, label: { en: 'Through a broker', uk: 'Через broker' } },
    ],
  },
  {
    id: 'coupling',
    label: { en: 'Coupling', uk: 'Coupling' },
    question: { en: 'How tightly is the contract shared between the two sides?', uk: 'Наскільки тісно контракт розділено між сторонами?' },
    left: { en: 'Loose / self-describing', uk: 'Loose / self-describing' },
    right: { en: 'Tight / shared schema', uk: 'Tight / shared schema' },
    options: [
      { v: 0, label: { en: 'Loose — self-describing', uk: 'Loose — self-describing' } },
      { v: 1, label: { en: 'Tight — schema/IDL', uk: 'Tight — schema/IDL' } },
    ],
  },
];

// ── Style profiles ─────────────────────────────────────────────────────────
// Each style's canonical position on every axis (0..1). Values are deliberate and defensible; the inline
// note explains the coordinate. Order = curriculum module order (also the stable tie-break for ranking).
export interface StyleProfile {
  key: string; // stable id
  name: string; // display name — a technical term, identical in both languages
  moduleId: string; // deep-link target (#/m/<moduleId>)
  section: string; // section id → accent colour
  blurb: Localized; // one line: why it sits where it sits
  axes: Record<AxisId, number>;
}

export const STYLES: StyleProfile[] = [
  {
    key: 'rest',
    name: 'REST',
    moduleId: 'm5-rest',
    section: 's1-req-resp-http',
    blurb: { en: 'Synchronous request/response over resources; text, cacheable, loosely coupled.', uk: 'Синхронний request/response над ресурсами; текст, кешований, слабко звʼязаний.' },
    axes: { timing: 0, flow: 0, direction: 0, initiative: 0, encoding: 0, topology: 0, coupling: 0.2 },
  },
  {
    key: 'odata',
    name: 'OData',
    moduleId: 'm6-odata',
    section: 's1-req-resp-http',
    blurb: { en: 'REST plus a query grammar and CSDL metadata — more shared contract than plain REST.', uk: 'REST плюс граматика запитів і метадані CSDL — більше спільного контракту, ніж у звичайного REST.' },
    axes: { timing: 0, flow: 0, direction: 0, initiative: 0, encoding: 0, topology: 0, coupling: 0.55 },
  },
  {
    key: 'soap',
    name: 'SOAP',
    moduleId: 'm7-soap-xml',
    section: 's1-req-resp-http',
    blurb: { en: 'XML envelope bound to a rigid WSDL contract — the tightest-coupled text style.', uk: 'XML-envelope, привʼязаний до жорсткого WSDL-контракту — найтісніше звʼязаний текстовий стиль.' },
    axes: { timing: 0, flow: 0, direction: 0, initiative: 0, encoding: 0.1, topology: 0, coupling: 1 },
  },
  {
    key: 'json-rpc',
    name: 'JSON-RPC',
    moduleId: 'm8-json-rpc',
    section: 's1-req-resp-http',
    blurb: { en: 'Name a method, pass params — a thin, symmetric RPC with a light method contract.', uk: 'Назви метод, передай params — тонкий, симетричний RPC з легким контрактом методу.' },
    axes: { timing: 0, flow: 0, direction: 0, initiative: 0, encoding: 0, topology: 0, coupling: 0.4 },
  },
  {
    key: 'graphql',
    name: 'GraphQL',
    moduleId: 'm9-graphql',
    section: 's2-contract-first',
    blurb: { en: 'A typed schema the client queries; mostly request/response, tightly contracted by the SDL.', uk: 'Типізована schema, яку запитує клієнт; переважно request/response, тісно законтрактовано SDL.' },
    axes: { timing: 0, flow: 0.15, direction: 0, initiative: 0, encoding: 0, topology: 0, coupling: 0.75 },
  },
  {
    key: 'grpc',
    name: 'gRPC',
    moduleId: 'm10-grpc',
    section: 's2-contract-first',
    blurb: { en: 'Protobuf-typed calls over HTTP/2 with four call types (unary + 3 streaming) — binary and tightly coupled.', uk: 'Protobuf-типізовані виклики над HTTP/2 з чотирма типами (unary + 3 streaming) — binary і тісно звʼязані.' },
    axes: { timing: 0.1, flow: 0.5, direction: 0.6, initiative: 0.3, encoding: 1, topology: 0, coupling: 1 },
  },
  {
    key: 'trpc',
    name: 'tRPC',
    moduleId: 'm11-trpc',
    section: 's2-contract-first',
    blurb: { en: 'The TypeScript type is the contract — end-to-end typed, JSON on the wire, no codegen.', uk: 'Тип TypeScript і є контрактом — наскрізно типізовано, JSON на дроті, без codegen.' },
    axes: { timing: 0, flow: 0.1, direction: 0, initiative: 0, encoding: 0, topology: 0, coupling: 0.9 },
  },
  {
    key: 'websockets',
    name: 'WebSockets',
    moduleId: 'm12-websockets',
    section: 's3-realtime-events',
    blurb: { en: 'One persistent full-duplex pipe: both sides send frames at once, text or binary.', uk: 'Одна постійна full-duplex труба: обидві сторони шлють фрейми водночас, текст чи binary.' },
    axes: { timing: 0.3, flow: 0.8, direction: 1, initiative: 0.5, encoding: 0.5, topology: 0, coupling: 0.3 },
  },
  {
    key: 'sse',
    name: 'SSE',
    moduleId: 'm13-sse',
    section: 's3-realtime-events',
    blurb: { en: 'A one-way text stream the server pushes and the browser auto-reconnects.', uk: 'Односторонній текстовий потік, який пушить сервер і сам перепідключає браузер.' },
    axes: { timing: 0.3, flow: 1, direction: 0, initiative: 1, encoding: 0, topology: 0, coupling: 0.2 },
  },
  {
    key: 'webrtc',
    name: 'WebRTC',
    moduleId: 'm14-webrtc',
    section: 's3-realtime-events',
    blurb: { en: 'Peers talk directly — bidirectional binary media/data, the purest point-to-point style.', uk: 'Peer-и говорять напряму — двонапрямлені binary медіа/дані, найчистіший point-to-point стиль.' },
    axes: { timing: 0.4, flow: 0.85, direction: 1, initiative: 0.5, encoding: 1, topology: 0.05, coupling: 0.4 },
  },
  {
    key: 'webhooks',
    name: 'Webhooks',
    moduleId: 'm15-webhooks',
    section: 's3-realtime-events',
    blurb: { en: 'A reverse call: the provider pushes an event to your URL, fire-and-forget and async.', uk: 'Зворотний виклик: провайдер пушить подію на ваш URL, fire-and-forget і async.' },
    axes: { timing: 1, flow: 1, direction: 0, initiative: 1, encoding: 0, topology: 0.35, coupling: 0.3 },
  },
  {
    key: 'messaging',
    name: 'Async messaging',
    moduleId: 'm16-async-messaging',
    section: 's3-realtime-events',
    blurb: { en: 'A broker decouples producer from consumer in time — publish an event, read at your pace.', uk: 'Broker розчіплює producer і consumer у часі — публікуй подію, читай у своєму темпі.' },
    axes: { timing: 1, flow: 1, direction: 0.2, initiative: 1, encoding: 0.5, topology: 1, coupling: 0.5 },
  },
];

// ── Scoring ────────────────────────────────────────────────────────────────
/** The user's chosen target per axis; a missing axis = "Any" (ignored in scoring). */
export type Selection = Partial<Record<AxisId, number>>;

export interface ScoredStyle {
  profile: StyleProfile;
  /** 0..100 match; 100 when every set axis matches exactly (or when nothing is set). */
  score: number;
  /** how many axes the user constrained (0 = neutral "show everything"). */
  setCount: number;
}

const orderIndex = (key: string): number => STYLES.findIndex((s) => s.key === key);

/**
 * Rank every style against the current selection. Pure & total.
 * With no axes set, every style scores 100 and keeps curriculum order (the neutral landscape view).
 */
export function scoreStyles(sel: Selection): ScoredStyle[] {
  const setAxes = (Object.keys(sel) as AxisId[]).filter((a) => typeof sel[a] === 'number');
  return STYLES.map((profile) => {
    if (setAxes.length === 0) return { profile, score: 100, setCount: 0 };
    let dist = 0;
    for (const a of setAxes) dist += Math.abs(profile.axes[a] - (sel[a] as number));
    const score = Math.round((1 - dist / setAxes.length) * 100);
    return { profile, score, setCount: setAxes.length };
  }).sort((a, b) => b.score - a.score || orderIndex(a.profile.key) - orderIndex(b.profile.key));
}

/** The single best-fit style for the current selection (stable, deterministic). */
export function topMatch(sel: Selection): ScoredStyle {
  return scoreStyles(sel)[0];
}

/** How many axes are currently constrained. */
export function selectionSize(sel: Selection): number {
  return (Object.keys(sel) as AxisId[]).filter((a) => typeof sel[a] === 'number').length;
}

/** Deep-equality on two selections (order-independent) — used to highlight the active preset. */
export function selectionsEqual(a: Selection, b: Selection): boolean {
  const ak = (Object.keys(a) as AxisId[]).filter((k) => typeof a[k] === 'number');
  const bk = (Object.keys(b) as AxisId[]).filter((k) => typeof b[k] === 'number');
  if (ak.length !== bk.length) return false;
  return ak.every((k) => a[k] === b[k]);
}

// ── Presets ────────────────────────────────────────────────────────────────
// Real-world boundaries expressed as axis selections. They translate a scenario the reader recognises
// into the axes they're still learning — and each lands on a different section's signature style, so the
// set doubles as a tour of the whole landscape. The first is the seeded default (REST = the baseline).
export interface Preset {
  id: string;
  label: Localized;
  sel: Selection;
}

export const PRESETS: Preset[] = [
  {
    id: 'public-web',
    label: { en: 'Public web API', uk: 'Публічний web API' },
    sel: { timing: 0, flow: 0, encoding: 0, coupling: 0 }, // → REST
  },
  {
    id: 'internal-typed',
    label: { en: 'Typed internal services', uk: 'Типізовані внутрішні сервіси' },
    sel: { encoding: 1, coupling: 1 }, // → gRPC
  },
  {
    id: 'live-ui',
    label: { en: 'Live UI updates', uk: 'Живі оновлення UI' },
    sel: { flow: 1, direction: 0, initiative: 1, topology: 0 }, // → SSE
  },
  {
    id: 'two-way',
    label: { en: 'Two-way real-time', uk: 'Двостороннє real-time' },
    sel: { direction: 1, flow: 1, encoding: 0 }, // → WebSockets
  },
  {
    id: 'async-events',
    label: { en: 'Decoupled async events', uk: 'Розчеплені async-події' },
    sel: { timing: 1, flow: 1, topology: 1 }, // → async messaging
  },
];
