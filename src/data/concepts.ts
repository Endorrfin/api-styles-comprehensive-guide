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
  stub({
    id: 'm6-odata', num: 6, section: 's1-req-resp-http', order: 2, level: 'senior',
    title: { en: 'OData', uk: 'OData' },
    tagline: { en: 'A query language bolted onto REST.', uk: 'Мова запитів, прикручена до REST.' },
    mentalModel: { en: 'OData turns a URL into a query: $filter, $select, $expand — SQL-like power over an HTTP resource.', uk: 'OData перетворює URL на запит: $filter, $select, $expand — SQL-подібна сила над HTTP-ресурсом.' },
  }),
  stub({
    id: 'm7-soap-xml', num: 7, section: 's1-req-resp-http', order: 3, level: 'senior',
    title: { en: 'SOAP / XML Web Services', uk: 'SOAP / XML Web Services' },
    tagline: { en: 'The contract-heavy enterprise elder.', uk: 'Контрактно-важкий корпоративний старійшина.' },
    mentalModel: { en: 'SOAP is an envelope + a WSDL contract + WS-* add-ons: rigid, verbose, and still alive in the enterprise.', uk: 'SOAP — це envelope + контракт WSDL + WS-* доповнення: жорсткий, багатослівний і досі живий у enterprise.' },
  }),
  stub({
    id: 'm8-json-rpc', num: 8, section: 's1-req-resp-http', order: 4, level: 'middle',
    title: { en: 'JSON-RPC & XML-RPC', uk: 'JSON-RPC і XML-RPC' },
    tagline: { en: 'Call a function over HTTP — nothing more.', uk: 'Виклик функції через HTTP — не більше.' },
    mentalModel: { en: 'RPC drops REST’s resources: you name a method and pass params. Minimal, symmetric, transport-agnostic.', uk: 'RPC відкидає ресурси REST: ви називаєте метод і передаєте params. Мінімально, симетрично, transport-agnostic.' },
  }),

  // ── Section II · Contract-first & typed ────────────────────────────────────
  m9, // ★ s6 — GraphQL (contract-first) + graphql-nplus1 sim (fully authored)
  m10, // ★ s5 — gRPC (contract-first) + grpc-wire sim (fully authored)
  stub({
    id: 'm11-trpc', num: 11, section: 's2-contract-first', order: 3, level: 'senior',
    title: { en: 'tRPC', uk: 'tRPC' },
    tagline: { en: 'End-to-end types with no schema, no codegen.', uk: 'Наскрізні типи без schema, без codegen.' },
    mentalModel: { en: 'The TypeScript type IS the contract: import server types into the client — zero drift, TS-only.', uk: 'Тип TypeScript І Є контрактом: імпортуй серверні типи в клієнт — нуль дрейфу, тільки TS.' },
  }),

  // ── Section III · Real-time, push & event-driven ───────────────────────────
  m12, // ★ s7 — WebSockets (full-duplex) + websocket-frames sim (fully authored)
  m13, // s9 — SSE (server push over plain HTTP, fully authored)
  m14, // ★ s8 — WebRTC (P2P) + webrtc-connect sim (fully authored)
  m15, // ★ s9 — Webhooks (reverse API) + webhook-delivery sim (fully authored)
  stub({
    id: 'm16-async-messaging', num: 16, section: 's3-realtime-events', order: 5, level: 'senior',
    title: { en: 'Async messaging landscape', uk: 'Ландшафт async messaging' },
    tagline: { en: 'MQTT, AMQP, Kafka — when an API is a message.', uk: 'MQTT, AMQP, Kafka — коли API — це повідомлення.' },
    mentalModel: { en: 'A broker decouples sender from receiver in time: publish an event, let consumers read at their own pace.', uk: 'Брокер розчіплює відправника й отримувача в часі: публікуй подію, хай consumers читають у своєму темпі.' },
  }),

  // ── Section IV · Cross-cutting concerns ────────────────────────────────────
  stub({
    id: 'm17-auth-identity', num: 17, section: 's4-cross-cutting', order: 1, level: 'senior',
    title: { en: 'Authentication & authorization', uk: 'Автентифікація та авторизація' },
    tagline: { en: 'API keys, OAuth 2.1, OIDC, JWT, mTLS.', uk: 'API keys, OAuth 2.1, OIDC, JWT, mTLS.' },
    mentalModel: { en: 'AuthN proves who; AuthZ decides what. Every style carries the proof differently — header, metadata, or signature.', uk: 'AuthN доводить хто; AuthZ вирішує що. Кожен стиль несе доказ по-своєму — header, metadata чи підпис.' },
  }),
  stub({
    id: 'm18-versioning', num: 18, section: 's4-cross-cutting', order: 2, level: 'senior',
    title: { en: 'Versioning & evolution', uk: 'Версіонування та еволюція' },
    tagline: { en: 'Change the contract without breaking callers.', uk: 'Змінюй контракт, не ламаючи клієнтів.' },
    mentalModel: { en: 'A public API is a promise you must keep: add, never remove; deprecate, then sunset — or version explicitly.', uk: 'Публічний API — це обіцянка: додавай, не прибирай; deprecate, потім sunset — або версіонуй явно.' },
  }),
  stub({
    id: 'm19-errors-status', num: 19, section: 's4-cross-cutting', order: 3, level: 'middle',
    title: { en: 'Errors & status semantics', uk: 'Помилки та семантика статусів' },
    tagline: { en: 'Problem Details (RFC 9457), gRPC status, GraphQL errors.', uk: 'Problem Details (RFC 9457), gRPC status, GraphQL errors.' },
    mentalModel: { en: 'An error is data, not a stack trace: a typed, machine-readable shape the client can act on.', uk: 'Помилка — це дані, а не stack trace: типізована машиночитна форма, на яку клієнт може реагувати.' },
  }),
  stub({
    id: 'm20-pagination-limits', num: 20, section: 's4-cross-cutting', order: 4, level: 'senior',
    title: { en: 'Pagination & rate limiting', uk: 'Пагінація та rate limiting' },
    tagline: { en: 'Cursor vs offset; 429 and the token bucket.', uk: 'Cursor проти offset; 429 і token bucket.' },
    mentalModel: { en: 'Never return an unbounded list, never accept unbounded load: page with a cursor, shed with a limit.', uk: 'Ніколи не віддавай безмежний список і не приймай безмежне навантаження: сторінкуй cursor-ом, відсікай limit-ом.' },
  }),
  stub({
    id: 'm21-idempotency', num: 21, section: 's4-cross-cutting', order: 5, level: 'staff',
    title: { en: 'Idempotency, reliability & delivery', uk: 'Idempotency, надійність і доставка' },
    tagline: { en: 'At-least-once is the default; design for retries.', uk: 'At-least-once — це дефолт; проєктуй під retries.' },
    mentalModel: { en: 'The network will deliver twice or not at all: an idempotency key makes a retry safe to repeat.', uk: 'Мережа доставить двічі або жодного разу: idempotency key робить retry безпечним для повтору.' },
  }),
  stub({
    id: 'm22-security-threats', num: 22, section: 's4-cross-cutting', order: 6, level: 'staff',
    title: { en: 'Security & threat models', uk: 'Безпека та моделі загроз' },
    tagline: { en: 'Injection, SSRF, CORS/CSRF, DoS, deserialization.', uk: 'Injection, SSRF, CORS/CSRF, DoS, deserialization.' },
    mentalModel: { en: 'Every input is hostile until proven otherwise: validate at the boundary, least-privilege behind it.', uk: 'Кожен вхід ворожий, доки не доведено інше: валідуй на межі, least-privilege за нею.' },
  }),
  stub({
    id: 'm23-observability', num: 23, section: 's4-cross-cutting', order: 7, level: 'senior',
    title: { en: 'Observability & gateways', uk: 'Observability та gateways' },
    tagline: { en: 'Tracing, gateways/BFF, schema registries, contract testing.', uk: 'Tracing, gateways/BFF, schema registries, contract testing.' },
    mentalModel: { en: 'You cannot fix what you cannot see: a request carries a trace id from edge gateway to the last hop.', uk: 'Не полагодиш те, чого не бачиш: запит несе trace id від edge gateway до останнього стрибка.' },
  }),

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
