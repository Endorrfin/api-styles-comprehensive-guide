import type { Level, Localized, Module, Section } from './types';
// CHANGED (s2): m5-rest authored (golden). All other modules are navigable stubs until their session.
import { m5 } from './modules/m5-rest';
// CHANGED (s3): Foundations on-ramp + decision axes authored.
import { m1 } from './modules/m1-what-is-an-api';
import { m2 } from './modules/m2-decision-axes';
// CHANGED (s4): HTTP transport substrate + data formats authored.
import { m3 } from './modules/m3-http-transport';
import { m4 } from './modules/m4-data-formats';
// CHANGED (s5): gRPC authored (contract-first, signature).
import { m10 } from './modules/m10-grpc';
// CHANGED (s6): GraphQL authored (contract-first, signature).
import { m9 } from './modules/m9-graphql';
// CHANGED (s7): WebSockets authored (real-time, signature).
import { m12 } from './modules/m12-websockets';
// CHANGED (s8): WebRTC authored (real-time, signature).
import { m14 } from './modules/m14-webrtc';
// CHANGED (s9): Webhooks (signature) + SSE authored (real-time).
import { m13 } from './modules/m13-sse';
import { m15 } from './modules/m15-webhooks';
// CHANGED (s10a): the right-sized Section-I styles authored (OData, SOAP, JSON-RPC).
import { m6 } from './modules/m6-odata';
import { m7 } from './modules/m7-soap-xml';
import { m8 } from './modules/m8-json-rpc';
// CHANGED (s10b): the remaining right-sized styles authored (tRPC, async messaging).
import { m11 } from './modules/m11-trpc';
import { m16 } from './modules/m16-async-messaging';
// CHANGED (s11): Section IV cross-cutting begins — auth/identity, versioning, errors/status authored.
import { m17 } from './modules/m17-auth-identity';
import { m18 } from './modules/m18-versioning';
import { m19 } from './modules/m19-errors-status';
// CHANGED (s12a): pagination & rate limiting + idempotency/reliability authored.
import { m20 } from './modules/m20-pagination-limits';
import { m21 } from './modules/m21-idempotency';
// CHANGED (s12b): Section IV complete — security & threat models, observability & gateways authored.
import { m22 } from './modules/m22-security-threats';
import { m23 } from './modules/m23-observability';

/*
 * concepts.ts — the SINGLE SOURCE OF TRUTH (CLAUDE.md §2, §4).
 * 6 sections · 25 modules. m1, m2, m5-rest are fully authored; the rest are navigable stubs (empty
 * topics) filled in later sessions per CURRICULUM.md §G. A `stub()` produces the skeleton Module.
 */

export const sections: Section[] = [
  { id: 's0-foundations', roman: '0', accent: '#b6a6f0', title: { en: 'Foundations', uk: 'Основи' } },
  { id: 's1-req-resp-http', roman: 'I', accent: '#a78bfa', title: { en: 'Request/Response over HTTP', uk: 'Request/Response через HTTP' } },
  { id: 's2-contract-first', roman: 'II', accent: '#8b93e8', title: { en: 'Contract-first & typed', uk: 'Contract-first і типізовані' } },
  { id: 's3-realtime-events', roman: 'III', accent: '#56c5d4', title: { en: 'Real-time, push & event-driven', uk: 'Real-time, push та event-driven' } },
  { id: 's4-cross-cutting', roman: 'IV', accent: '#5cc0a4', title: { en: 'Cross-cutting concerns', uk: 'Наскрізні аспекти' } },
  { id: 's5-choosing', roman: 'V', accent: '#c58bd6', title: { en: 'Choosing', uk: 'Вибір' } },
];

type StubInput = {
  id: string;
  num: number;
  section: string;
  order: number;
  level: Level;
  signature?: boolean;
  title: Localized;
  tagline: Localized;
  mentalModel: Localized;
  readMins?: number;
};

function stub(s: StubInput): Module {
  return {
    id: s.id,
    num: s.num,
    section: s.section,
    order: s.order,
    level: s.level,
    signature: s.signature,
    title: s.title,
    tagline: s.tagline,
    readMins: s.readMins ?? 8,
    mentalModel: s.mentalModel,
    topics: [],
    keyPoints: [],
    pitfalls: [],
    seeAlso: [],
    sources: [],
  };
}

export const modules: Module[] = [
  // ── Section 0 · Foundations ────────────────────────────────────────────────
  m1, // ★ s3 — beginner on-ramp (fully authored)
  m2, // ★ s3 — decision axes + style-compass (fully authored)
  m3, // ★ s4 — HTTP transport substrate + http-multiplexing sim (fully authored)
  m4, // s4 — data formats & serialization + encoding-size figure (fully authored)

  // ── Section I · Request/Response over HTTP ─────────────────────────────────
  m5, // ★ GOLDEN — REST (fully authored)
  m6, // s10a — OData (query-over-REST, fully authored)
  m7, // s10a — SOAP/XML (enterprise contracts, fully authored)
  m8, // s10a — JSON-RPC & XML-RPC (minimal RPC, fully authored)

  // ── Section II · Contract-first & typed ────────────────────────────────────
  m9, // ★ s6 — GraphQL (contract-first) + graphql-nplus1 sim (fully authored)
  m10, // ★ s5 — gRPC (contract-first) + grpc-wire sim (fully authored)
  m11, // s10b — tRPC (TS-native RPC, no codegen) + trpc-inference figure (fully authored)

  // ── Section III · Real-time, push & event-driven ───────────────────────────
  m12, // ★ s7 — WebSockets (full-duplex) + websocket-frames sim (fully authored)
  m13, // s9 — SSE (server push over plain HTTP, fully authored)
  m14, // ★ s8 — WebRTC (P2P) + webrtc-connect sim (fully authored)
  m15, // ★ s9 — Webhooks (reverse API) + webhook-delivery sim (fully authored)
  m16, // s10b — Async messaging (MQTT/AMQP/Kafka) + broker-topologies figure (fully authored)

  // ── Section IV · Cross-cutting concerns ────────────────────────────────────
  m17, // s11 — Authentication & authorization + oauth-flow figure (fully authored)
  m18, // s11 — Versioning & evolution + version-strategies figure (fully authored)
  m19, // s11 — Errors & status semantics + problem-details figure (fully authored)
  m20, // s12a — Pagination & rate limiting + pagination-compare interactive (fully authored)
  m21, // s12a — Idempotency, reliability & delivery + outbox-saga figure (fully authored)
  m22, // s12b — Security & threat models + trust-boundaries figure (fully authored)
  m23, // s12b — Observability & gateways + gateway-topology figure (fully authored)

  // ── Section V · Choosing ───────────────────────────────────────────────────
  stub({
    id: 'm24-decision-framework', num: 24, section: 's5-choosing', order: 1, level: 'staff', signature: true,
    title: { en: 'The decision framework', uk: 'Фреймворк рішення' },
    tagline: { en: 'Pick a style per boundary — and defend it.', uk: 'Обери стиль під boundary — і захисти вибір.' },
    mentalModel: { en: 'There is no best style, only a best fit per boundary: latency, payload, streaming, reach, and coupling decide.', uk: 'Немає найкращого стилю, є найкращий fit під boundary: latency, payload, streaming, reach і coupling вирішують.' },
  }),
  stub({
    id: 'm25-mental-models', num: 25, section: 's5-choosing', order: 2, level: 'beginner',
    title: { en: 'Mental models & when-NOT gallery', uk: 'Ментальні моделі та галерея коли-НЕ' },
    tagline: { en: 'One line per style; when NOT to use each.', uk: 'Один рядок на стиль; коли НЕ використовувати кожен.' },
    mentalModel: { en: 'Master the one-liners and you can place, compare, and reject any style on demand.', uk: 'Опануй однорядковики — і зможеш розмістити, порівняти й відкинути будь-який стиль на вимогу.' },
  }),
];

// ── Lookups ────────────────────────────────────────────────────────────────
const moduleById = new Map(modules.map((m) => [m.id, m]));
const sectionById = new Map(sections.map((s) => [s.id, s]));

export function getModule(id: string): Module | undefined {
  return moduleById.get(id);
}
export function getSection(id: string): Section | undefined {
  return sectionById.get(id);
}
export function modulesBySection(sectionId: string): Module[] {
  return modules.filter((m) => m.section === sectionId).sort((a, b) => a.order - b.order);
}
/** Previous / next module in global order (by `num`). */
export function adjacentModules(id: string): { prev?: Module; next?: Module } {
  const ordered = [...modules].sort((a, b) => a.num - b.num);
  const i = ordered.findIndex((m) => m.id === id);
  if (i === -1) return {};
  return { prev: ordered[i - 1], next: ordered[i + 1] };
}
/** A module is "authored" (vs a navigable stub) once it has topics. */
export function isAuthored(m: Module): boolean {
  return m.topics.length > 0;
}

export const LEVELS: Level[] = ['beginner', 'middle', 'senior', 'staff'];

export const COUNTS = {
  sections: sections.length,
  modules: modules.length,
  sims: modules.filter((m) => m.signature).length,
};

// Alias for the SSR smoke (scripts/smoke.ts imports `MODULES`).
export const MODULES = modules;

export type { Level, Localized, Module, Section };
