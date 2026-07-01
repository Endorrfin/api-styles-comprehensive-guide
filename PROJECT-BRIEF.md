# PROJECT BRIEF — the ideal commission for this guide

> **The single upstream instruction** that, handed to a capable agent at the start, lets it build the
> whole guide with **near-zero clarification**. Complements `CLAUDE.md` (the living contract). §5 (locked
> decisions) and §10 (decision rights) are authoritative — do **not** re-ask anything answered here.
> Language: English (meta-doc). Conforms to `../_standard/GUIDE-AUTHORING-STANDARD.md` (Tier 1).

---

## 0. TL;DR — the one-paragraph commission

Build a **deep, interactive, bilingual (EN/UA) web guide to the architectural styles & protocols for
building APIs** — **REST, GraphQL, gRPC, WebSockets, SSE, WebRTC, Webhooks, SOAP/XML, OData**, plus the
extras **JSON-RPC/XML-RPC, tRPC, and the async-messaging landscape (MQTT · AMQP · Kafka)** — modelled on
the `../database guide` / `../Node-js guide` quality bar. It is **decision-first**: for every style the
reader learns *what it is, the model it assumes, its limits, its alternatives, its strengths/weaknesses,
and when to use it — and when NOT to.* For **senior → staff engineers, with a real beginner on-ramp**.
**Tier 1:** Vite + React 19 + TS (strict), static, GitHub Pages. Teach with prose **plus** diagrams,
tables, mental models and a handful of **curated signature simulators** that let the reader *feel* each
style (an HTTP/1.1-vs-2-vs-3 multiplexing visualizer, a REST request-lifecycle + cache engine, a
protobuf wire-encoder, a GraphQL N+1/DataLoader tree, a WebSocket frame timeline, a WebRTC
signaling/ICE walkthrough, a webhook delivery/retry sim, an interactive style picker); diagram-first
everywhere else. Work **plan-first, 1–2 modules per session, quality over speed**, verify every session.
Decisions in §5 are locked — don't re-ask them.

## 1. Goal & why
A guide that makes a professional **understand, internalize and remember** the landscape of API styles —
not a feature list or cheat-sheet, but **the models each style assumes + the trade-offs + hands-on
interactives + a decision framework**. The reader should leave able to *choose the right style for a
given system boundary and defend the choice*. Doubles as a public portfolio piece (GitHub Pages, LinkedIn).

## 2. Audience & outcomes
- **Primary:** professionals **middle → senior → staff** designing/​integrating APIs and system
  boundaries. **Secondary:** a short **beginner on-ramp** (what an API is; the request/response mental
  model) so a junior can enter and climb.
- **After reading, the user can:** (1) place any style on the decision axes (sync/async · req-resp /
  streaming / push · unary / bidirectional · text / binary · point-to-point / broker); (2) explain each
  style's wire model, guarantees, and failure modes; (3) name the realistic alternatives to each and the
  trade-off that separates them; (4) pick a style for a concrete boundary and justify it, including when
  **not** to use the "obvious" one; (5) reason about the cross-cutting concerns (auth, versioning, errors,
  pagination, idempotency, observability, security) uniformly across styles.
- **Success = depth + learning-UX + correctness**, in that order. Completeness and polish next. Speed last.

## 3. References & quality bar (what "golden" means)
- **Gold standard:** `../database guide` (canonical Tier-1) and `../Node-js guide` — data-driven modules,
  hero simulators, verified facts. Match their depth and polish; **reuse the architecture and component
  patterns** (port the shell: `App`, hash router, `i18n`, `theme`, `lib/registry`, `components/*`).
- **"Golden" for one module =** clear mental model + prose that teaches (not lists) + ≥1 diagram + ≥1
  table + key points + pitfalls + (optional) interview Q&A + cross-links + **verified sources**, in **both
  languages**, typechecking and building clean.

## 4. Scope
- **In:** the 8 named styles (**REST, GraphQL, gRPC, WebSockets, WebRTC, Webhooks, SOAP/XML, OData**) +
  the 4 confirmed extras (**SSE, JSON-RPC/XML-RPC, tRPC, async-messaging landscape: MQTT/AMQP/Kafka**);
  the **foundations** (what an API is; the decision axes; the HTTP/1.1·2·3 + QUIC transport substrate;
  data formats & serialization); the **cross-cutting concerns** (auth, versioning, errors/Problem Details,
  pagination & rate limiting, idempotency & delivery semantics, security threat models, observability &
  gateways); and a **decision framework + migration paths**.
- **Curriculum source:** the owner's topic list is the **seed** — cover it, but **don't limit to it**.
  The authoritative map lives in `CURRICULUM.md`.
- **Weighting:** deepest treatment goes to **REST (golden baseline), gRPC, GraphQL, WebSockets, WebRTC,
  Webhooks**. SOAP/OData/JSON-RPC/XML-RPC get honest, right-sized treatment (models + where they still
  win). Async messaging is **landscape-level** (contrast, not a broker deep-dive). Every module ends with
  an explicit *"use / avoid"* verdict.
- **Out (for now):** framework-specific tutorials (Express/NestJS/Angular wiring), full broker internals
  (Kafka/RabbitMQ ops), and a downloadable PDF booklet (optional later).

## 5. Locked decisions — DO NOT re-ask
| Topic | Decision |
|---|---|
| **Stack** | Vite 8 + React 19.2 + TypeScript 6 (strict). No router lib (hash router). All content static, no runtime fetch. Node 22 LTS. |
| **Content model** | SSOT `src/data/concepts.ts` (thin aggregator) + per-module `src/data/modules/*`; pages render from data. `Section → Module → Topic → Block`. |
| **Language** | Bilingual **EN/UA** with a runtime toggle. **All technical terms stay English** in both (REST, resolver, protobuf, ICE, idempotency…); translate only explanation/analogy. Author EN first, UA second. |
| **Framing** | **Decision-first.** Every style module answers: *what it is · the model it assumes · limits · alternatives · strengths/weaknesses · when to use / when NOT.* |
| **Structure** | **6 sections:** 0 Foundations · I Request/Response over HTTP · II Contract-first & typed · III Real-time, push & event-driven · IV Cross-cutting concerns · V Choosing. **Webhooks live in III** (event/callback, not request/response). |
| **Emphasis** | REST is the baseline every other style is compared against; each later style is taught *as a delta from REST* where useful. |
| **Theme** | Dark editorial; domain accent **calm violet × cyan "Signal" duotone** (low-chroma for readability): violet `#a78bfa` primary + cyan `#4dc4d4` secondary (`--accent` / `--accent-2`). Fonts **Fraunces** (display) · Inter · JetBrains Mono. |
| **Interactivity** | **Curated simulations only.** ~8 signature sims + a landing "style compass" + a decide/picker; diagram-first baseline. Each sim has a `prefers-reduced-motion` step fallback. |
| **Signature sims** | `http-multiplexing` (HTTP/1.1 vs 2 vs 3 head-of-line-blocking) · **`rest-request-lifecycle` (GOLDEN: request → cache/conditional-requests → Richardson maturity)** · `graphql-nplus1` (resolver tree + DataLoader batching) · `grpc-wire` (protobuf byte encoder + 4 call types) · `websocket-frames` (Upgrade handshake + full-duplex timeline) · `webrtc-connect` (signaling → ICE → STUN/TURN → P2P) · `webhook-delivery` (retry + idempotency + HMAC verify) · `style-picker` (decision matrix). Landing: `style-compass` (axes explorer / map). |
| **Golden module** | **REST** (`m5-rest`) + its signature sim `rest-request-lifecycle`, built first — the coordinate origin every other style references. |
| **Naming** | Folder `API Styles guide`; repo = package = Pages path = `api-styles-comprehensive-guide` → `https://endorrfin.github.io/api-styles-comprehensive-guide/`. |
| **Deploy** | GitHub Pages via Actions. `vite base:'./'` + `.nojekyll` + hash routing. Agent sessions never push; owner commits & deploys. |
| **Tooling** | TS strict + `noUnusedLocals/Parameters`; build must pass; ESLint (flat) clean; `npm run verify` is the gate. |

## 6. Constraints & non-negotiables
- **Correctness mandate.** Web-search and verify **every version-sensitive fact** per module (spec
  versions, RFC numbers, browser support, wire details, benchmarks, dates); fill `sources` with working
  `https://` links; never trust model memory. Anchor facts already verified (S1): HTTP semantics/caching/
  versions **RFC 9110–9114** (June 2022; HTTP/3 over QUIC = 9114); **Problem Details RFC 9457** (2023,
  obsoletes 7807); **OData 4.01** (OASIS); **OpenAPI 3.2.0** (Sept 2025; adds SSE/JSON-Lines streaming +
  the emerging HTTP `QUERY` method; 4.0 "Moonwalk" still in design). Challenge the curriculum when
  verification contradicts it.
- **Content only in `src/data/*`** — never hand-edit rendered output.
- **Accessibility:** keyboard nav, focus rings, ARIA on sims, `prefers-reduced-motion` fallback,
  contrast-checked palette.
- **Bilingual integrity:** every human-readable string is `Localized {en;uk}`; no missing language.
- **Security framing** throughout (least privilege, untrusted input, injection/SSRF, CORS/CSRF, DoS/
  complexity attacks, deserialization, TLS, secrets, replay) — cross-cutting Section IV owns the depth,
  but every style module names its top threat.
- **Sandbox gotchas:** Linux sandbox blocks `unlink` (build/verify in a scratch `dist-sN`; don't git
  against the live repo); owner runs `npm install` + deploy. Exclude `_examples/` from git/deploy.

## 7. Deliverables
- **The web guide** (primary). **`README.md`** (overview + live link + commands, bilingual).
- **`CLAUDE.md`** kept current (source of truth + status log). **`CURRICULUM.md`** kept current.
- Deferred/optional: a PDF booklet; a LinkedIn launch pack (bilingual) once enough modules ship.

## 8. Working agreement
- **Plan → approve → build.** Big steps get a plan signed off before implementation.
- **Cadence:** 1–2 modules per session, **golden quality**; speed is not a priority.
- **Verify every session:** `npm run verify` (typecheck + lint + check:data + test + smoke + build) + fact
  spot-check.
- **The 8 working rules:** (1) specific not generic; (2) brief "why"; (3) describe change + why before
  doing it; (4) mark edits `// CHANGED (sN):`; (5) lint-aware; (6) reliability/security/best-practice
  first; (7) ask when unclear; (8) don't just agree — challenge wrong/partial reasoning.
- **Branch/commit:** branch `sN-short-topic`; concise imperative commit messages.
- **Session summary (every session):** (1) what was done; (2) branch + commit + short description;
  (3) challenges/questions.

## 9. Definition of Done
- **Per module:** all topics authored EN+UA; mental model, key points, pitfalls, see-also, sources; any
  planned diagrams/tables/sim present; typecheck + lint + check:data + build clean; facts verified & cited;
  an explicit *use/avoid* verdict.
- **Per session:** the above for the session's modules + verification run + summary delivered +
  `CLAUDE.md` status log updated.
- **Project:** all modules authored; signature sims + landing style-compass + decide/picker; global
  search, glossary, mental-models gallery; bilingual QA; deployed and live.

## 10. Decision rights
- **Decide yourself:** component structure & naming; micro-UX & copy wording; which diagram type; colors
  *within* the locked palette; block ordering within a module; verification details; promoting a planned
  sim to a figure (or vice-versa) if the insight is better served.
- **Ask the owner first:** changing scope (adding/dropping modules or a whole style); changing stack,
  theme, or language policy; anything that changes the published URL or breaks the data contract; spending
  money or destructive/irreversible actions; product facts web search can't resolve.

## 11. Clarifying questions — answered for this guide
- **Reader / after?** Senior→staff choosing/integrating API styles (+ beginner on-ramp); can choose and
  defend a style per boundary.
- **Personal/public/portfolio?** Public portfolio + working reference.
- **Success metric?** Depth + learning-UX + correctness.
- **Boundaries (in/out)?** See §4. In: 8 styles + 4 extras + foundations + cross-cutting + choosing. Out:
  framework tutorials, broker ops internals, PDF (later).
- **Curriculum source?** Owner's list is the seed; go beyond.
- **Weighting?** REST/gRPC/GraphQL/WebSockets/WebRTC/Webhooks deepest; SOAP/OData/RPC right-sized; async
  messaging landscape-level.
- **Fact freshness?** Web-verify every version-sensitive fact per module.
- **Interactivity ambition?** ~8 signature sims + compass + picker; diagram-first elsewhere.
- **Language(s)?** EN/UA, terms stay English, EN first.
- **Theme?** Dark editorial + azure/cyan accent.
- **Stack/hosting/repo?** Tier 1; GitHub Pages; `api-styles-comprehensive-guide`.
- **Reuse patterns?** Port the `database guide` shell.
- **Cadence?** 1–2 modules/session, quality over speed.
- **Golden module?** REST (`m5-rest`) + `rest-request-lifecycle`.
- **Verification/DoD?** §9; `npm run verify`.
- **Where content is edited?** `src/data/*` only.
- **Decision rights?** §10.
- **Hard constraints?** §6 (sandbox, a11y, bilingual, security).

## 12. How to start a session (bootstrap ritual)
1. Read `CLAUDE.md` fully, then the relevant `CURRICULUM.md` section(s), then existing `src/components/*`
   + `src/data/*` patterns (and the `database guide` equivalents when porting the shell).
2. Plan → approve → build. 1–2 modules, golden quality.
3. Verify (`npm run verify`) + fact spot-check. Deliver the 3-part summary. Update `CLAUDE.md` §14.
