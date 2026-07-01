# API Styles — The Comprehensive Guide

A deep, interactive, **bilingual (EN / UA)** guide to the **architectural styles & protocols for building
APIs** — REST, GraphQL, gRPC, WebSockets, SSE, WebRTC, Webhooks, SOAP/XML and OData (plus JSON-RPC/XML-RPC,
tRPC and the async-messaging landscape) — taught with prose **plus** diagrams, tables, mental models and
hero simulators. **Decision-first:** for every style you learn *what it is, the model it assumes, its
limits, its alternatives, its strengths and weaknesses, and when to use it — and when not.*

**Live:** https://endorrfin.github.io/api-styles-comprehensive-guide/
**Author:** Vasyl Krupka · Senior Fullstack Engineer · 🇺🇦

---

## What's here
- **6 sections · 25 modules** — from a beginner on-ramp ("what is an API?") to staff-level internals
  (WebRTC ICE/STUN/TURN, idempotency & delivery semantics, the decision framework).
- **★ Signature interactives** (curated, hand-built) — a REST request-lifecycle + cache engine, an
  HTTP/1.1-vs-2-vs-3 multiplexing visualizer, a protobuf wire-encoder, a GraphQL N+1/DataLoader tree, a
  WebSocket frame timeline, a WebRTC signaling/ICE walkthrough, a webhook delivery/retry sim, and an
  interactive style picker.
- **Bilingual** at the data layer — every string is `{ en, uk }`; technical terms stay English in both.
- A landing **Style Compass** (the decision axes as a map), collapsible sidebar, global search, a level
  filter, a mental-models gallery, and a glossary.

## Tech
Vite 8 + React 19 + TypeScript 6 (strict). No router library — a tiny hash router (`#/m/<module>/<topic>`)
+ `vite base:'./'` makes the build work under any GitHub Pages sub-path. All content is static data in
`src/data`; pages are **rendered from data**, never hand-written.

## Local development
```bash
npm install        # owner runs this (native darwin-arm64)
npm run dev        # start Vite dev server
npm run build      # tsc -b && vite build  → dist/
npm run preview    # preview the production build
```
Quality gates (also enforced in CI before every deploy):
```bash
npm run typecheck  # tsc -b --noEmit
npm run lint       # eslint (flat config)
npm run check:data # bilingual completeness, unique ids, registry + cross-link integrity
npm run test       # engine unit tests (scripts/test-*.ts)
npm run smoke      # SSR/render smoke over every sim, figure, and page (EN + UK)
npm run verify     # all of the above + build
```

## Project layout
```
src/
  data/        concepts.ts (SSOT) · modules/ · meta.ts/meta.json · glossary · mentalModels · decide · types
  i18n/        ui strings + EN/UA language provider
  theme/       tokens.css · global.css · components.css
  lib/         hashRouter · search · registry (sims + figures) · appState · utils · sim engines
  components/  layout/ · module/ · map/ · sims/ · figures/ · pages/
scripts/       check-data.ts · run-tests.ts · smoke.ts (+ engine tests)
```

## Adding content
Edit **only** `src/data/*`. Add a module file under `src/data/modules/`, reference figures/sims by key,
and register new widgets in `src/lib/registry.tsx`. Author EN first, UA second. Run `npm run check:data`.

## Status
**S1 delivered:** scaffold + the four meta-docs (this README, `PROJECT-BRIEF.md`, `CURRICULUM.md`,
`CLAUDE.md`) with the full 6-section / 25-module plan. **Next:** the golden **REST** module + its
signature simulator, on top of the ported React shell. Subsequent sessions author the remaining modules
and signature sims, 1–2 per session.

---

# API Styles — Вичерпний гайд (UA)

Глибокий, інтерактивний, **двомовний (EN / UA)** гайд про **архітектурні стилі та протоколи побудови API** —
REST, GraphQL, gRPC, WebSockets, SSE, WebRTC, Webhooks, SOAP/XML і OData (плюс JSON-RPC/XML-RPC, tRPC і
ландшафт async-messaging) — навчання прозою **плюс** діаграми, таблиці, mental models і hero-симулятори.
**Рішення передусім:** для кожного стилю ти дізнаєшся *що це, яку модель він припускає, його обмеження, його
альтернативи, сильні та слабкі сторони, і коли його варто — а коли не варто — застосовувати.*

**Live:** https://endorrfin.github.io/api-styles-comprehensive-guide/ · **Автор:** Vasyl Krupka · 🇺🇦

## Що тут
**6 секцій · 25 модулів** — від beginner on-ramp («що таке API?») до staff-level internals (WebRTC
ICE/STUN/TURN, idempotency і delivery semantics, decision framework). **★ Signature-інтерактиви** (дібрані,
зроблені вручну): движок REST request-lifecycle + cache, візуалізатор мультиплексування HTTP/1.1 vs 2 vs 3,
protobuf wire-encoder, дерево GraphQL N+1/DataLoader, таймлайн WebSocket-фреймів, розбір сигналінгу WebRTC,
sim доставки webhook, інтерактивний style-picker. **Двомовність** на шарі даних — кожен рядок `{ en, uk }`;
технічні терміни лишаються англійською. Лендінг **Style Compass** (осі рішень як мапа), згортний sidebar,
глобальний пошук, фільтр рівня, галерея mental models, glossary.

## Стек
Vite 8 + React 19 + TypeScript 6 (strict). Без router-бібліотеки — крихітний hash router + `vite base:'./'`.
Увесь контент — статичні дані в `src/data`; сторінки **рендеряться з даних**, не пишуться руками.

## Розробка локально / команди
Ті самі команди, що в EN-блоці (`npm run dev | build | preview | typecheck | lint | check:data | test |
smoke | verify`). `npm install` і деплой виконує **власник**.

## Додавання контенту
Редагуй **лише** `src/data/*`. Додай файл модуля в `src/data/modules/`, посилайся на figures/sims за
ключем, реєструй віджети в `src/lib/registry.tsx`. Спочатку EN, потім UA. Запусти `npm run check:data`.
