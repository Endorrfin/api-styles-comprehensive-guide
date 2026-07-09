/*
 * picker.ts — pure, deterministic engine for the `style-picker` signature interactive (CLAUDE.md §6,
 * m24 + the #/decide page). No React, no DOM, no randomness — scripts/test-picker.ts asserts it exactly
 * and StylePickerSim is a thin renderer over it.
 *
 * The model, and how it differs from the compass (lib/compass.ts): the compass asks you to place
 * yourself on the seven ABSTRACT axes; the picker asks five PLAIN-LANGUAGE questions about your
 * boundary (who calls · conversation shape · contract discipline · payload · reach) and translates the
 * answers itself. Each answer contributes (a) targets on the compass axes — merged as a per-axis mean,
 * scored by the same distance fit — and (b) named per-style ADJUSTMENTS (boosts and vetoes) carrying a
 * human-readable reason. Fit finds the geometric neighbourhood; adjustments encode the deal-breakers
 * geometry can't see (browsers don't speak native gRPC; a TS-type contract can't cross a company
 * boundary). The verdict = top pick + runner-up + every reason that moved a score, plus the style's
 * when-NOT line — a recommendation you can argue with, which is the point of m24.
 */
import type { Localized } from '../data/types';
import { STYLES, type AxisId, type StyleProfile } from './compass';

// ── Questions ──────────────────────────────────────────────────────────────
export type QuestionId = 'consumers' | 'shape' | 'contract' | 'payload' | 'reach';

/** A named score adjustment: the deal-breakers and deal-makers geometry can't express. */
export interface Adjustment {
  style: string; // StyleProfile.key
  delta: number; // score points, applied after the axis fit (negative = veto-grade penalty)
  reason: Localized;
}

export interface PickerOption {
  id: string;
  label: Localized;
  /** targets on the compass axes this answer implies (merged across questions as a per-axis mean) */
  sel?: Partial<Record<AxisId, number>>;
  adjust?: Adjustment[];
}

export interface PickerQuestion {
  id: QuestionId;
  prompt: Localized;
  options: PickerOption[];
}

export const QUESTIONS: PickerQuestion[] = [
  {
    id: 'consumers',
    prompt: { en: 'Who calls this API?', uk: 'Хто викликає цей API?' },
    options: [
      {
        id: 'public',
        label: { en: 'Public third parties', uk: 'Публічні треті сторони' },
        sel: { coupling: 0.2 },
        adjust: [
          {
            style: 'trpc',
            delta: -50,
            reason: {
              en: 'tRPC’s contract is a TypeScript type — public callers are not in your repo.',
              uk: 'Контракт tRPC — це TypeScript-тип, а публічні викликачі не живуть у вашому repo.',
            },
          },
          {
            style: 'rest',
            delta: 10,
            reason: {
              en: 'Public defaults are boring on purpose: REST + OpenAPI is what strangers integrate fastest.',
              uk: 'Публічні дефолти нудні навмисно: REST + OpenAPI — те, що незнайомці інтегрують найшвидше.',
            },
          },
          {
            style: 'grpc',
            delta: -15,
            reason: {
              en: 'Handing .proto files and channel tooling to strangers raises every integration’s floor.',
              uk: 'Роздавати незнайомцям .proto-файли й channel-тулінг — підняти поріг кожної інтеграції.',
            },
          },
        ],
      },
      {
        id: 'own-app',
        label: { en: 'Our own web/mobile app', uk: 'Наш власний web/mobile застосунок' },
        sel: {},
      },
      {
        id: 'internal',
        label: { en: 'Internal services (same org)', uk: 'Внутрішні сервіси (та сама організація)' },
        sel: { coupling: 0.8 },
        adjust: [
          {
            style: 'grpc',
            delta: 10,
            reason: {
              en: 'Inside one org the shared-IDL tax is cheap and the perf/typing payoff is real.',
              uk: 'Всередині однієї організації податок спільного IDL дешевий, а виграш у perf/типах реальний.',
            },
          },
        ],
      },
      {
        id: 'devices',
        label: { en: 'A fleet of devices / IoT', uk: 'Парк пристроїв / IoT' },
        sel: { timing: 0.8, topology: 0.8 },
        adjust: [
          {
            style: 'messaging',
            delta: 20,
            reason: {
              en: 'MQTT’s QoS levels and tiny headers exist precisely for flaky, constrained fleets.',
              uk: 'Рівні QoS у MQTT і крихітні заголовки існують саме для нестабільних, обмежених флотів.',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'shape',
    prompt: { en: 'What shape is the conversation?', uk: 'Якої форми розмова?' },
    options: [
      {
        id: 'ask-answer',
        label: { en: 'Ask, get an answer', uk: 'Запитав — отримав відповідь' },
        sel: { timing: 0, flow: 0, direction: 0, initiative: 0 },
      },
      {
        id: 'live-feed',
        label: { en: 'One-way live feed to clients', uk: 'Односторонній живий потік до клієнтів' },
        sel: { timing: 0.3, flow: 1, direction: 0, initiative: 1 },
      },
      {
        id: 'two-way',
        label: { en: 'Two-way live session', uk: 'Двостороння жива сесія' },
        sel: { timing: 0.3, flow: 0.8, direction: 1, initiative: 0.5 },
      },
      {
        id: 'p2p',
        label: { en: 'Peer-to-peer media or data', uk: 'Peer-to-peer медіа чи дані' },
        sel: { flow: 0.85, direction: 1, topology: 0.05 },
        adjust: [
          {
            style: 'webrtc',
            delta: 25,
            reason: {
              en: 'Only WebRTC takes the server out of the media path — everything else relays.',
              uk: 'Лише WebRTC прибирає сервер з медіа-шляху — все інше ретранслює.',
            },
          },
        ],
      },
      {
        id: 'notify-server',
        label: { en: 'Notify another server that something happened', uk: 'Сповістити інший сервер, що щось сталося' },
        sel: { timing: 1, flow: 1, direction: 0, initiative: 1 },
        adjust: [
          {
            style: 'webhooks',
            delta: 20,
            reason: {
              en: 'A server→server callback IS a webhook — the receiver just exposes one URL.',
              uk: 'Server→server callback і Є webhook — отримувач просто виставляє один URL.',
            },
          },
        ],
      },
      {
        id: 'broker-events',
        label: { en: 'Decoupled events through a broker', uk: 'Розчеплені події через broker' },
        sel: { timing: 1, flow: 1, initiative: 1, topology: 1 },
        adjust: [
          {
            style: 'messaging',
            delta: 20,
            reason: {
              en: 'A broker that buffers, fans out and replays is the point — that is the messaging landscape.',
              uk: 'Broker, що буферизує, розгалужує і відтворює, — і є суть: це landscape messaging-у.',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'contract',
    prompt: { en: 'How much contract discipline can both sides carry?', uk: 'Скільки контрактної дисципліни потягнуть обидві сторони?' },
    options: [
      {
        id: 'loose',
        label: { en: 'Loose — self-describing JSON', uk: 'Слабка — self-describing JSON' },
        sel: { coupling: 0.2, encoding: 0 },
      },
      {
        id: 'e2e-ts',
        label: { en: 'End-to-end TypeScript, one codebase', uk: 'Наскрізний TypeScript, один codebase' },
        sel: { coupling: 0.9 },
        adjust: [
          {
            style: 'trpc',
            delta: 20,
            reason: {
              en: 'When both ends live in one TS repo, inference beats codegen — zero drift, zero build step.',
              uk: 'Коли обидва кінці живуть в одному TS-repo, inference б’є codegen — нуль дрейфу, нуль build-кроку.',
            },
          },
          {
            style: 'soap',
            delta: -15,
            reason: {
              en: 'A WSDL toolchain has no seat in a TypeScript monorepo — the coupling matches, the world doesn’t.',
              uk: 'WSDL-тулчейн не має місця в TypeScript-monorepo — coupling збігається, а світ — ні.',
            },
          },
        ],
      },
      {
        id: 'strict-idl',
        label: { en: 'Strict shared IDL across teams', uk: 'Суворий спільний IDL між командами' },
        sel: { coupling: 1 },
        adjust: [
          {
            style: 'grpc',
            delta: 10,
            reason: {
              en: '.proto as the org-wide contract: breaking changes surface at compile time, not at 3 a.m.',
              uk: '.proto як контракт на всю організацію: breaking changes спливають на compile time, а не о 3-й ночі.',
            },
          },
          {
            style: 'graphql',
            delta: 5,
            reason: {
              en: 'An SDL schema is also a real contract — typed, introspectable, lintable in CI.',
              uk: 'SDL-schema — теж справжній контракт: типізований, introspectable, лінтований у CI.',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'payload',
    prompt: { en: 'What does the payload look like?', uk: 'Як виглядає payload?' },
    options: [
      {
        id: 'small-json',
        label: { en: 'Small, fixed JSON documents', uk: 'Малі, фіксовані JSON-документи' },
        sel: { encoding: 0 },
      },
      {
        id: 'client-shaped',
        label: { en: 'Each client view picks its own fields', uk: 'Кожен клієнтський view обирає свої поля' },
        sel: { encoding: 0 },
        adjust: [
          {
            style: 'graphql',
            delta: 25,
            reason: {
              en: 'Client-driven field selection is GraphQL’s founding feature — one schema, many shapes.',
              uk: 'Клієнт-керований вибір полів — засаднича фіча GraphQL: одна schema, багато форм.',
            },
          },
          {
            style: 'odata',
            delta: 10,
            reason: {
              en: '$select/$expand/$filter give REST a query grammar without leaving HTTP semantics.',
              uk: '$select/$expand/$filter дають REST граматику запитів, не покидаючи семантики HTTP.',
            },
          },
          {
            style: 'rest',
            delta: -15,
            reason: {
              en: 'Fixed representations answer every view the same way — per-view shaping means over/under-fetching (m9).',
              uk: 'Фіксовані representations відповідають кожному view однаково — per-view форма означає over/under-fetching (m9).',
            },
          },
        ],
      },
      {
        id: 'binary-large',
        label: { en: 'Large or binary (files, media)', uk: 'Великі або binary (файли, медіа)' },
        sel: { encoding: 1 },
      },
      {
        id: 'high-freq',
        label: { en: 'High-frequency tiny messages', uk: 'Високочастотні крихітні повідомлення' },
        sel: { encoding: 0.5 },
        adjust: [
          {
            style: 'websockets',
            delta: 10,
            reason: {
              en: 'Per-message cost is a few frame bytes — no headers, no handshake, no connection churn.',
              uk: 'Ціна повідомлення — кілька байтів фрейма: без заголовків, handshake і churn з’єднань.',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'reach',
    prompt: { en: 'Must it pass browsers, proxies and CDNs as-is?', uk: 'Чи мусить воно проходити браузери, проксі та CDN як є?' },
    options: [
      {
        id: 'max-reach',
        label: { en: 'Yes — maximum reach, zero custom infra', uk: 'Так — максимальне охоплення, нуль кастомної інфри' },
        sel: { encoding: 0 },
        adjust: [
          {
            style: 'grpc',
            delta: -40,
            reason: {
              en: 'Browsers can’t speak native gRPC (HTTP/2 trailers) — you’d be signing up for a gRPC-Web proxy.',
              uk: 'Браузери не розмовляють нативним gRPC (HTTP/2 trailers) — ви підписуєтесь на gRPC-Web proxy.',
            },
          },
          {
            style: 'rest',
            delta: 10,
            reason: {
              en: 'Plain HTTP is the most middlebox-proof wire there is: every cache, proxy and curl understands it.',
              uk: 'Простий HTTP — найстійкіший до middlebox-ів дріт: його розуміє кожен кеш, проксі й curl.',
            },
          },
          {
            style: 'sse',
            delta: 10,
            reason: {
              en: 'SSE is just a long HTTP response — it survives proxies that break WebSocket upgrades.',
              uk: 'SSE — просто довга HTTP-відповідь: переживає проксі, які ламають WebSocket upgrade.',
            },
          },
          {
            style: 'websockets',
            delta: -10,
            reason: {
              en: 'The Upgrade handshake needs cooperation from every LB and proxy on the path.',
              uk: 'Upgrade-handshake вимагає співпраці кожного LB і проксі на шляху.',
            },
          },
          {
            style: 'webrtc',
            delta: -15,
            reason: {
              en: 'NAT traversal means STUN/TURN infrastructure — reach here is bought, not free.',
              uk: 'Обхід NAT означає інфраструктуру STUN/TURN — охоплення тут купується, не дається.',
            },
          },
        ],
      },
      {
        id: 'controlled',
        label: { en: 'No — we control both ends', uk: 'Ні — ми контролюємо обидва кінці' },
        sel: {},
      },
    ],
  },
];

// ── When-NOT lines ─────────────────────────────────────────────────────────
// One honest boundary per style: shown on the verdict card so every recommendation ships with its own
// counter-argument (and previews m25's when-NOT gallery).
export const WHEN_NOT: Record<string, Localized> = {
  rest: {
    en: 'Not for server-push, live sessions, or call-shaped internal chatter — polling REST for “now” is the classic smell.',
    uk: 'Не для server-push, живих сесій чи виклико-подібної внутрішньої балачки — polling REST заради «зараз» є класичним запахом.',
  },
  odata: {
    en: 'Not on a public edge without query cost controls — you’re exposing a queryable surface, almost a database.',
    uk: 'Не на публічному краї без контролю вартості запитів — ви відкриваєте запитувану поверхню, майже базу даних.',
  },
  soap: {
    en: 'Not for anything new outside regulated enterprise integrations that already live in WSDL tooling.',
    uk: 'Не для нового поза регульованими enterprise-інтеграціями, що вже живуть у WSDL-тулінгу.',
  },
  'json-rpc': {
    en: 'Not when you need HTTP semantics — one POST URL forfeits caching, status codes and per-method authz for free.',
    uk: 'Не там, де потрібна семантика HTTP: один POST-URL задарма віддає кешування, статус-коди і per-method authz.',
  },
  graphql: {
    en: 'Not as a default for simple CRUD or file-ish payloads — you inherit N+1, query-cost policing and cache loss on day one.',
    uk: 'Не як дефолт для простого CRUD чи файло-подібних payload-ів — з першого дня успадковуєте N+1, контроль вартості запитів і втрату кешу.',
  },
  grpc: {
    en: 'Not straight to browsers or anonymous third parties — the proxy tax and .proto handshake outweigh the wins.',
    uk: 'Не напряму в браузери чи анонімним третім сторонам — податок на proxy і .proto-handshake переважує виграші.',
  },
  trpc: {
    en: 'Not across a company or language boundary — the moment a consumer isn’t in your TS repo, the contract evaporates.',
    uk: 'Не через межу компанії чи мови — щойно споживач не у вашому TS-repo, контракт випаровується.',
  },
  websockets: {
    en: 'Not for request/response work or one-way feeds — you’d hand-build ordering, reconnect and backpressure HTTP already has.',
    uk: 'Не для request/response чи односторонніх потоків — вручну збудуєте ordering, reconnect і backpressure, які HTTP вже має.',
  },
  sse: {
    en: 'Not when clients must talk back on the same channel, or push binary — it is text, one-way, by design.',
    uk: 'Не коли клієнти мусять відповідати тим самим каналом чи пушити binary — воно текстове й одностороннє за задумом.',
  },
  webrtc: {
    en: 'Not for server-shaped jobs a WebSocket does in a tenth of the code — and never without TURN in the budget.',
    uk: 'Не для серверо-подібних задач, які WebSocket робить у десять разів меншим кодом, — і ніколи без TURN у бюджеті.',
  },
  webhooks: {
    en: 'Not when the consumer can’t run a public HTTPS endpoint, or needs the answer *now* — it’s async, at-least-once, unordered.',
    uk: 'Не коли споживач не може тримати публічний HTTPS-endpoint або потребує відповіді *зараз* — це async, at-least-once, без порядку.',
  },
  messaging: {
    en: 'Not for a simple ask-and-answer between two services — a broker is real infrastructure with real on-call.',
    uk: 'Не для простого «запитав-відповів» між двома сервісами — broker є справжньою інфраструктурою зі справжнім on-call.',
  },
};

// ── Scoring ────────────────────────────────────────────────────────────────
export type Answers = Partial<Record<QuestionId, string>>;

export interface RankedPick {
  profile: StyleProfile;
  /** axis fit 0..100 (compass distance on the merged targets; 100 when no axes are implied) */
  fit: number;
  /** fit + Σ adjustment deltas, clamped to [0,100] for display */
  score: number;
  /** unclamped fit + Σ deltas — the ranking key, so a boost is never erased by the 100 cap */
  raw: number;
  /** the named reasons that moved this style’s score (empty when none) */
  adjustments: Adjustment[];
}

const orderIndex = (key: string): number => STYLES.findIndex((s) => s.key === key);

function optionFor(qid: QuestionId, oid: string | undefined): PickerOption | undefined {
  if (!oid) return undefined;
  return QUESTIONS.find((q) => q.id === qid)?.options.find((o) => o.id === oid);
}

/** How many questions are answered (with a valid option id). */
export function answeredCount(a: Answers): number {
  return QUESTIONS.filter((q) => optionFor(q.id, a[q.id])).length;
}

/**
 * Rank every style for the current answers. Pure & total: unanswered questions contribute nothing;
 * with nothing answered every style scores 100 in curriculum order (the neutral state).
 */
export function rankPicks(a: Answers): RankedPick[] {
  // 1 · Merge axis targets: per-axis MEAN over every answered option that sets the axis.
  const sums = new Map<AxisId, { sum: number; n: number }>();
  const adjustments: Adjustment[] = [];
  for (const q of QUESTIONS) {
    const opt = optionFor(q.id, a[q.id]);
    if (!opt) continue;
    for (const [axis, v] of Object.entries(opt.sel ?? {}) as [AxisId, number][]) {
      const acc = sums.get(axis) ?? { sum: 0, n: 0 };
      acc.sum += v;
      acc.n += 1;
      sums.set(axis, acc);
    }
    if (opt.adjust) adjustments.push(...opt.adjust);
  }
  const axes = [...sums.entries()].map(([axis, { sum, n }]) => ({ axis, target: sum / n }));

  // 2 · Fit (compass distance) + named adjustments, clamped.
  return STYLES.map((profile) => {
    let fit = 100;
    if (axes.length > 0) {
      let dist = 0;
      for (const { axis, target } of axes) dist += Math.abs(profile.axes[axis] - target);
      fit = Math.round((1 - dist / axes.length) * 100);
    }
    const mine = adjustments.filter((adj) => adj.style === profile.key);
    const delta = mine.reduce((s, adj) => s + adj.delta, 0);
    const raw = fit + delta;
    const score = Math.max(0, Math.min(100, raw));
    return { profile, fit, score, raw, adjustments: mine };
  }).sort((x, y) => y.raw - x.raw || orderIndex(x.profile.key) - orderIndex(y.profile.key));
}

export interface Verdict {
  top: RankedPick;
  runnerUp: RankedPick;
  answered: number;
}

/** The verdict for the current answers, or null while nothing is answered (neutral state). */
export function pickVerdict(a: Answers): Verdict | null {
  const answered = answeredCount(a);
  if (answered === 0) return null;
  const ranked = rankPicks(a);
  return { top: ranked[0], runnerUp: ranked[1], answered };
}
