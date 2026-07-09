# CLAUDE.md — `api-styles-comprehensive-guide`

> **Working guide and source of truth for every session in this repo. Read this file fully before
> starting any session.** Update the *Status / progress log* (§14) at the end of each session.
> See `../_standard/GUIDE-AUTHORING-STANDARD.md` for the cross-guide rules this guide conforms to (Tier 1).
> The upstream commission is `PROJECT-BRIEF.md`; the content map is `CURRICULUM.md`.

## 1. Mission
A deep, interactive, **bilingual (EN/UA)** guide to the **architectural styles & protocols for building
APIs** — REST, GraphQL, gRPC, WebSockets, SSE, WebRTC, Webhooks, SOAP/XML, OData, plus JSON-RPC/XML-RPC,
tRPC, and the async-messaging landscape. **Decision-first:** every style module answers *what it is · the
model it assumes · its limits · its alternatives · strengths/weaknesses · when to use / when NOT.* For
**senior → staff** engineers with a **beginner on-ramp**. Golden bar = clear mental model + teaching prose
+ diagram + table + key points + pitfalls + verified sources, in both languages, building clean.

## 2. Stack & key decisions (with why)
- **Vite 8 + React 19.2 + TypeScript 6 (strict).** Static content, no runtime fetch — works offline,
  deploys anywhere. (Versions verified S1: TS 6.0 Mar-2026, Vite 8 Mar-2026, React 19.2.7, ESLint 10.3.)
- **No router library** — a small custom **hash router** (`#/m/<module>/<topic>`, `#/decide`,
  `#/mental-models`, `#/glossary`; landing `#/` = the Style Compass). Hash routing + `vite base:'./'`
  makes the build work under **any** GitHub Pages sub-path with zero config.
- **Single source of truth for content:** `src/data/concepts.ts` (thin aggregator) + `src/data/modules/*`.
  Pages are *rendered from data*; we never hand-write page HTML.
- **Bilingual at the data layer:** every human-readable string is a `Localized` value `{ en; uk }`.
- **Figures and sims are referenced by key** and resolved via `lib/registry.tsx` (React.lazy). Content is
  edited **only** in `src/data/*`.
- **Meta split (live since S10a):** `gen:meta` derives `src/data/meta.json` (committed; `check:meta` in
  `typecheck` guards drift); the eager shell imports `src/data/meta.ts`, not `concepts.ts`, so module
  bodies stay out of the initial bundle (eager index ~78 kB; bodies in the lazy `concepts` chunk).
- **Guide-specific:** **decision-first framing** (§ PROJECT-BRIEF §5); **REST is the baseline** every later
  style is taught as a delta from; **Webhooks belong to Section III** (event/callback), not req/resp.

## 3. Repo layout (target — from standard §4.3)
```
src/
  main.tsx · App.tsx · vite-env.d.ts
  data/      concepts.ts (SSOT aggregator) · modules/mN-*.ts · types.ts · glossary.ts · mentalModels.ts ·
             decide.ts · meta.ts · meta.json (generated)
  i18n/      lang.ts (useLang) · LangProvider.tsx · ui.ts
  lib/       hashRouter.ts · registry.tsx (sims+figures) · search.ts · appState.ts · utils.ts ·
             rest.ts + other sim engines
  theme/     tokens.css · global.css · components.css
  components/ layout/ · module/ · map/ · pages/ · sims/ (PascalCase.tsx) · figures/ (PascalCase.tsx)
scripts/     check-data.ts · run-tests.ts · smoke.ts · css-stub-hooks.mjs · test-*.ts (engine tests)
public/      favicon.svg · .nojekyll
.github/workflows/deploy.yml
CLAUDE.md · PROJECT-BRIEF.md · CURRICULUM.md · README.md + config (package.json, vite, tsconfig*, eslint)
```
**Built (S2):** the full React shell (`App`/`main`/`index.html`/`public`, `i18n`, `theme` incl. the
azure/cyan `guide.css`, `lib/{hashRouter,registry,search,appState,utils,rest}`, `components/{layout,
module,map,pages,sims,figures}`) ported/adapted from `../database guide` to the template contract
(concepts-direct, `Section.title`, no meta-split yet). Golden `m5-rest` + sim `rest-request-lifecycle`.
**Built (S3):** `m1-what-is-an-api` (beginner on-ramp) + `m2-decision-axes` (signature) + the
`style-compass` engine/sim (`lib/compass.ts` + `scripts/test-compass.ts`), now the landing hero;
figures `api-boundary`, `in-process-vs-network`, `decision-axes`, `coupling-spectrum`; `SimBlock` now
renders authored captions. **3 modules authored, 22 navigable stubs.**
**Built (S4):** signature `m3-http-transport` (senior) + `m4-data-formats` (middle); the signature sim
`http-multiplexing` (engine `lib/http.ts` + `scripts/test-http.ts` — HTTP/1.1·2·3 scheduling with a
packet-loss/HOL model); figures `http-connection-models`, `encoding-size`. **5 modules authored, 20
navigable stubs; 3 sim engines; smoke at 115 checks.**
**Built (S5):** signature `m10-grpc` (contract-first) + the signature sim `grpc-wire` (protobuf byte
encoder `lib/grpc.ts` + `scripts/test-grpc.ts`); figure `grpc-call-types`. **6 modules authored, 19
navigable stubs; 4 sim engines; smoke at 127 checks.**
**Built (S6):** signature `m9-graphql` (contract-first; 10 topics) + the signature sim `graphql-nplus1`
(pure N+1/DataLoader planner `lib/graphql.ts` + `scripts/test-graphql.ts` — naive fan-out N+1 vs a
de-duplicated batch to 2); figure `graphql-over-under-fetching`; +4 GraphQL glossary terms. **7 modules
authored, 18 navigable stubs; 5 sim engines; smoke at 139 checks.**
**Built (S7):** signature `m12-websockets` (real-time; 8 topics) + the signature sim `websocket-frames`
(pure timeline `lib/ws.ts` + `scripts/test-ws.ts` — HTTP Upgrade→101 then a full-duplex frame timeline,
masking rule, ping→pong); figure `websocket-frame-anatomy`; +4 WebSocket glossary terms. **8 modules
authored, 17 navigable stubs; 6 sim engines; smoke at 151 checks.**
**Built (S8):** signature `m14-webrtc` (staff, real-time; 7 topics) + the signature sim `webrtc-connect`
(pure scenario engine `lib/webrtc.ts` + `scripts/test-webrtc.ts` — signaling → trickle ICE → checks →
DTLS → P2P data across open/NAT/symmetric-NAT scenarios); figure `webrtc-connection-paths`; +4 WebRTC
glossary terms. **9 modules authored, 16 navigable stubs; 7 sim engines; smoke at 163 checks.**
**Built (S9):** signature `m15-webhooks` (8 topics) + the signature sim `webhook-delivery` (pure engine
`lib/webhook.ts` + `scripts/test-webhook.ts` — sign → attempts → ×4 backoff → dedup/DLQ across
healthy/flaky/down endpoints + an idempotency toggle: 1 effect vs the double-charge 2) and
`m13-sse` (5 topics, figure `sse-stream-anatomy`); +4 reliability/SSE glossary terms. **11 modules
authored, 14 navigable stubs; 8 sim engines; smoke at 175 checks.**
**Built (S10a):** the **meta split** (standard §4.4 — `genMeta`/`checkMeta`/`meta.ts`; eager index
450→78 kB) + the right-sized Section-I styles `m6-odata` (figure `odata-query-anatomy`), `m7-soap-xml`
(figure `soap-envelope`), `m8-json-rpc` (figure `rpc-envelope`); +4 glossary terms. **14 modules
authored, 11 navigable stubs; 8 sim engines; smoke at 193 checks.**
**Built (S10b):** the remaining right-sized styles `m11-trpc` (Section II, senior; figure
`trpc-inference`) and `m16-async-messaging` (Section III, senior; figure `broker-topologies`); +8
glossary terms (tRPC, Message broker, MQTT, QoS (MQTT), AMQP, Kafka, Consumer group, Event-driven
architecture). **16 modules authored, 9 navigable stubs; 8 sim engines; 18 figures; smoke at 205 checks.**
**Built (S11):** the first three Section-IV cross-cutting modules — `m17-auth-identity` (senior; figure
`oauth-flow` = Authorization Code + PKCE), `m18-versioning` (senior; figure `version-strategies`),
`m19-errors-status` (middle; figure `problem-details` = RFC 9457 mapped across REST/gRPC/GraphQL). **19
modules authored, 6 navigable stubs; 8 sim engines; 21 figures; smoke at 223 checks.**

## 4. Content / data model (the contract)
**Terminology:** **Section** (top-level) → **Module** (navigable, skippable) → **Topic** (deep-linkable
`#/m/<module>/<topic>`) → content **Block**. The 7 block kinds: `prose · figure · sim · table · code ·
callout · compare`. The TypeScript contract lives in `src/data/types.ts` (identical across Tier-1 guides).
Each module opens with a **mental model** + **key points** and closes with **pitfalls**, a **use/avoid**
verdict, and optional **interview Q&A**.

## 5. Curriculum (at a glance — full map in `CURRICULUM.md`)
- **0 Foundations** — what is an API · the decision axes (★compass) · HTTP/1.1·2·3 transport (★) · data formats.
- **I Request/Response over HTTP** — **REST (★ golden)** · OData · SOAP/XML · JSON-RPC/XML-RPC.
- **II Contract-first & typed** — GraphQL (★) · gRPC (★) · tRPC.
- **III Real-time, push & event-driven** — WebSockets (★) · SSE · WebRTC (★) · Webhooks (★) · async messaging.
- **IV Cross-cutting** — auth · versioning · errors (RFC 9457) · pagination/limits · idempotency · security · observability.
- **V Choosing** — decision framework (★ picker) · mental-models & when-NOT gallery.
- **6 sections · 25 modules · 9 signature sims.**

## 6. Signature interactives + diagram-first baseline
Reusable sim framework; **~9 signature interactives** + diagram-first everywhere else. Each sim: pure engine
in `lib/*` (deterministic, unit-tested via `scripts/test-*.ts`), play/pause/step, **`prefers-reduced-motion`
fallback**, ARIA + live region. Keys: `style-compass` · `http-multiplexing` · **`rest-request-lifecycle`
(golden)** · `graphql-nplus1` · `grpc-wire` · `websocket-frames` · `webrtc-connect` · `webhook-delivery` ·
`style-picker`. No WASM/real network engine — all simulated deterministically.

## 7. Theme / brand
Dark editorial; palette in `theme/tokens.css` with a **calm violet × cyan "Signal" duotone** (low-chroma
for reading comfort): `--accent` violet `#a78bfa` (primary — links/active/req-resp), `--accent-2` cyan
`#4dc4d4` (secondary — real-time/streaming, sim wire, signature ★). Light theme darkens to violet `#6d28d9`
/ cyan `#0e7490`. Section accents run a violet→cyan spectrum. Fonts **Fraunces** (display) · **Inter** ·
**JetBrains Mono**.

## 8. Internationalization
**Author EN first, UA second.** Keep **ALL technical terms English** in UA (REST, resolver, protobuf,
ICE/STUN/TURN, idempotency, backpressure, envelope, cursor…). Translate only explanation/analogy. Runtime
toggle in the top bar; `i18n/` holds the provider + `useLang` hook + ui strings.

## 9. Deliverables
The web guide (primary) · bilingual `README.md` · this `CLAUDE.md` (current) · `CURRICULUM.md` (current).
Deferred/optional: PDF booklet; bilingual LinkedIn launch pack once enough modules ship.

## 10. Conventions
- TypeScript **strict** + `noUnusedLocals/Parameters`; **ESLint (flat) clean** (build fails otherwise).
- Content edited **only** in `src/data/*`; never hand-edit rendered output.
- Every non-trivial product claim must be verifiable — fill `sources`; **web-search to confirm**
  version-sensitive facts (spec versions, RFC numbers, browser support, wire details).
- Each content session ends with the verification gate (`npm run verify`) + a fact spot-check.
- **User working rules (every session):** (1) specific not generic; (2) brief "why"; (3) describe change +
  why **before** doing it; (4) mark edits `// CHANGED (sN):`; (5) lint-aware; (6) reliability/security/
  best-practice first; (7) ask when unclear; (8) don't just agree — challenge wrong/partial reasoning.
- **Session summary (end of EVERY session):** (1) what was done; (2) suggested **branch** (`sN-short-topic`)
  + **commit message** (concise imperative) + short description + a **cleanup script** for any scratch
  build dirs to delete (e.g. `rm -rf dist-s*`); (3) challenges/questions. Whenever the owner asks **"what's
  next"**, also state whether **this session can continue or a fresh session is advised** (context budget).

## 11. Deploy
GitHub Pages via Actions (`.github/workflows/deploy.yml`): typecheck → lint → check:data → test → smoke →
build → upload `dist` → deploy. `concurrency: cancel-in-progress: false`. `vite base:'./'` + `public/.nojekyll`
make it sub-path-safe. **Agent sessions never push** — the owner deploys.

## 12. Gotchas / constraints
- The Linux sandbox **blocks `unlink`** → Vite `emptyOutDir` fails on rebuild (EPERM). Build into a fresh
  `--outDir dist-sN` (gitignored) or `build.emptyOutDir:false`; verify in a scratch copy.
- Don't run git against the live repo from the sandbox. Owner runs `npm install` (native darwin-arm64).
- Exclude `_examples/` from git/deploy.
- **Sims must be deterministic** — no real sockets/RTC; model timing with a stepped clock so the
  reduced-motion fallback and the SSR smoke both work.

## 13. Session roadmap
- **S1 (done)** — scaffold + PROJECT-BRIEF + CURRICULUM + CLAUDE + README.
- **S2 (done)** — ported the shell (from `../database guide`) + **golden `m5-rest`** + sim
  `rest-request-lifecycle` + `scripts/test-rest.ts` + wired smoke's 4 TODOs + `npm run verify` green.
- **S3 (done)** — `m1-what-is-an-api` + `m2-decision-axes` + `style-compass` landing map.
- **S4 (done)** — `m3-http-transport` + `http-multiplexing`; `m4-data-formats`.
- **S5 (done)** — `m10-grpc` + `grpc-wire`.
- **S6 (done)** — `m9-graphql` + `graphql-nplus1`.
- **S7 (done)** — `m12-websockets` + `websocket-frames`.
- **S8 (done)** — `m14-webrtc` + `webrtc-connect`.
- **S9 (done)** — `m15-webhooks` + `webhook-delivery`; `m13-sse`.
- **S10a (done)** — the **meta split** (standard §4.4; eager index 450→78 kB) + `m6-odata`,
  `m7-soap-xml`, `m8-json-rpc` (Section I complete).
- **S10b (done)** — `m11-trpc` + `m16-async-messaging` (the remaining right-sized styles; Sections II & III
  now content-complete except the still-stubbed cross-cutting/choosing modules).
- **S11 (done)** — `m17-auth-identity` (+ `oauth-flow`) + `m18-versioning` (+ `version-strategies`) +
  `m19-errors-status` (+ `problem-details`) — the first three cross-cutting modules.
- **S12a (done)** — `m20-pagination-limits` (+ the `pagination-compare` interactive, promoted from
  the optional figure per PROJECT-BRIEF §10) + `m21-idempotency` (+ figure `outbox-saga`) + the §D(7)
  security-threat callouts retrofitted into m8/m13/m16.
- **S12b (done)** — Section IV remainder: `m22-security-threats` (+ figure `trust-boundaries`) +
  `m23-observability` (+ figure `gateway-topology`). **Section IV complete; 23 / 25 authored.**
- **S13a (done)** — `m24-decision-framework` (staff, Section V) + the **`style-picker`** signature
  interactive (engine `lib/picker.ts` + `scripts/test-picker.ts` + `StylePickerSim`) wired as the
  `#/decide` page. **24 / 25 authored; all 9 signature sims spent.**
- **S13b** — `m25-mental-models` (the last module), glossary polish, the polish backlog (copy-code
  buttons, `og:image`, topic copy-links, sticky table headers, S/W tables m6/m11), launch.

## 14. Status / progress log
- **S13a** (2026-07-09) — **Section V opens: the decision framework + the last signature sim.**
  Authored **`m24-decision-framework`** (staff, signature; 6 topics: the-decision-tree (sim) →
  the-trade-off-matrix (8-style × 6-column table, "read by columns") → anti-patterns (6 named failure
  modes + tell/fix table) → migration-paths (strangler fig; Netflix GraphQL-monolith-as-first-subgraph,
  AIP-127 `google.api.http` dual-surface proto sample, Shopify legacy/gate calendar) →
  polyglot-apis-in-one-system (reference boundary→style→one-sentence-defence table + seams security
  callout) → cost-of-change (lock-in gradient; use/avoid verdict); 6 keyPoints, 3 pitfalls, 2 staff
  interviews (marketplace surface design; REST→GraphQL both-sides), 9 sources). Built the signature
  interactive **`style-picker`**: pure engine `src/lib/picker.ts` — five plain-language boundary
  questions (consumers · shape · contract · payload · reach) whose answers merge into per-axis-MEAN
  targets over the compass STYLES (single source, no drift) plus **named boosts/vetoes with bilingual
  reasons** (gRPC −40 browser reach, tRPC −50 public callers, GraphQL +25 client-shaped, SOAP −15 in a
  TS monorepo…), ranked by unclamped raw so the 100-cap never erases a boost, WHEN_NOT line per style —
  + `scripts/test-picker.ts` (structure, 10 golden boundary scenarios incl. exact-score hand-traces,
  bounds, determinism, every-option-moves-something) + `StylePickerSim.tsx` (question chips with
  aria-pressed, verdict card with reason rows + when-NOT, runner-up, full ranked field with bars, live
  region, reduced-motion; SSR-safe, no timers) + `spk-*` styles in guide.css. **Wired `#/decide`** to
  render it (ComingSoon retired from that route; ui.decide label = "Style Picker"). +2 glossary terms
  (Strangler fig, Lock-in (exit cost) → 69 total). **Web-verified the anchors** (Shopify: REST Admin
  legacy 2024-10-01, new public App-Store apps GraphQL-only from 2025-04-01, existing apps unaffected;
  GitHub: REST+GraphQL peers, "use the API that best aligns with your needs", Node IDs bridge; Netflix:
  federated supergraph via the existing *GraphQL* monolith as first subgraph — TechBlog Parts 1+2 both
  in sources; Google AIP-127 transcoding (Endpoints/Envoy/grpc-gateway); Stripe: public REST, GraphQL
  internal-only; Fowler strangler fig). **QA pass** (independent subagent: hand-trace + engine
  execution + primary-source fetches): **no P1s**; fixed all 6 P2s (Netflix label "REST/monolith" →
  "GraphQL monolith → federated supergraph"; fabricated 30×/15× polling multipliers → qualitative
  claim; «еліминує»→«елімінує»; «систем має»→«система має»; «месседжингу»→«messaging-у»; «фіга»→
  «фікус-душитель») + the valuable P3s (header-comment fact ledger aligned to Shopify's public-apps-only
  wording; SSE matrix cell now the precise "survives proxies that break WS upgrades"; SOAP −15
  counter-weight on `e2e-ts` so the runner-up isn't comic — regression-guarded in test 9; "all 10
  scenarios" message; `.spk-opt` added to the reduced-motion block; polling/флот/строгий/поліція/
  пере-виводити/припущення-дроту/йде-на-захід language batch). **All gates GREEN**: typecheck
  (+check:meta) · lint · check:data (**24 authored** / 25) · test (**10 engines**) · smoke (**253
  checks**, 10 sims + 24 figures EN+UK) · build (`--outDir dist-s13a`/`dist-s13a2`; eager index 121 kB
  gzip 43, StylePickerSim chunk 18 kB, bodies in the lazy `concepts` chunk 974 kB gzip 323). *Branch:*
  `s13a-decision-framework`. *Commit:* `feat: author m24 (decision framework) + style-picker sim +
  #/decide page`. **Commit `src/data/meta.json`** (check:meta guards it). *Cleanup:* `rm -rf dist-s13a
  dist-s13a2` (scratch builds). *Open items:* **S13b** = `m25-mental-models`, glossary polish, the
  polish backlog (copy-code buttons, `og:image`, topic copy-links, sticky table headers, S/W tables
  m6/m11), launch.
- **S12b** (2026-07-09) — **Section IV complete.** Authored **`m22-security-threats`** (staff, 8
  deep-link topics: injection · ssrf · cors · csrf · dos-complexity-attacks · deserialization ·
  tls-everywhere · secrets-and-replay+verdict; 6 keyPoints, 3 pitfalls, 2 staff interviews, 9 sources)
  with figure **`trust-boundaries`** (untrusted→edge→trusted zones; injection/CSRF/SSRF drawn by the
  line each crosses) and **`m23-observability`** (senior, 6 topics: logging-metrics-tracing ·
  opentelemetry-traceparent · api-gateways-bff · schema-registries · contract-testing ·
  versioned-docs-openapi+verdict; 6/3/2, 9 sources) with figure **`gateway-topology`** (clients →
  gateway → per-client BFFs → services, with a `traceparent` rail carrying one trace_id edge-to-hop).
  **Scope-fenced against overlap:** authz/BOLA/mTLS mechanics stay in m17, rate-limiting in m20, TLS
  termination cross-ref only, Pact intro in m18, broker/Kafka in m16 — the new modules point back
  rather than re-teach. **Both figures PNG-rendered EN+UK and eyeballed** (house S11/S12a practice, via
  a scratch `scripts/_render-fig.ts` + resvg): fixed the SSRF arrow that speared the DB box and its
  colliding label (rerouted clear + relabelled to open space), and pulled the injection/CSRF labels back
  inside the untrusted zone. +12 glossary terms (SSRF, CORS, CSRF, SameSite, Prototype pollution,
  traceparent, OpenTelemetry, Span, API gateway, BFF, Schema registry, Contract testing → 67 total).
  **Web-verified the version-sensitive facts** (OWASP API Top 10 **2023**: SSRF = **API7:2023**,
  Unrestricted Resource Consumption = **API4:2023**; IMDS = link-local **169.254.169.254**, IMDSv2
  token-gated, Capital One 2019 = SSRF→IMDS; `SameSite=Lax` Chromium default since Chrome 80 / 2020-02
  with the ~120 s unspecified-cookie top-level-POST window, not default in FF/Safari; HTTP/2 Rapid Reset
  = **CVE-2023-44487**, disclosed 2023-10, ~**398M rps** Google; TLS = **BCP 195 / RFC 9325** (2022),
  prefer 1.3, 1.2 floor; **OpenTelemetry** traces/metrics/logs **GA** + OTLP; **W3C Trace Context**
  `traceparent` = version-traceid(16 B)-spanid(8 B)-flags, `01`=sampled, Level 2 = CR not REC;
  **OpenAPI 3.2.0** = 2025-09; Confluent compat modes BACKWARD/FORWARD/FULL; Pact consumer-driven +
  PactFlow BDCT). **Self-QA pass** (independent subagent was cut off by a session limit, so ran the
  checks directly): bilingual scan clean (no U+FFFD, no mixed-script words, technical tokens kept
  English), hand-traced the prototype-pollution example (`__proto__` via a naive merge → poisoned
  `Object.prototype`), and **fixed one factual imprecision** — the BACKWARD-compatibility callout wrongly
  said "never remove a required field" (under BACKWARD a new reader can drop fields; the real constraint
  is that an *added* field needs a default) → corrected EN+UK, re-verified green. **All gates GREEN**:
  typecheck (+check:meta) · lint · check:data (**23 authored** / 25) · test (**9 engines**) · smoke
  (**247 checks**, 9 sims + **24 figures** EN+UK) · build (`--outDir dist-s12b`/`dist-s12b2`; eager index
  119 kB gzip 42, bodies in the lazy `concepts` chunk 915 kB gzip 303). *Branch:*
  `s12b-security-observability`. *Commit:* `feat: author m22 (security & threat models) + trust-boundaries
  figure + m23 (observability & gateways) + gateway-topology figure + 12 glossary terms`. **Commit
  `src/data/meta.json`** (check:meta guards it). *Cleanup:* `rm -rf dist-s12b dist-s12b2` (scratch builds)
  + `rm scripts/_render-fig.ts` (scratch figure-QA helper; the sandbox couldn't unlink it). *Open items:*
  **S13** = `m24-decision-framework` + `style-picker` (the last signature sim — this is what the owner's
  screenshot shows), `m25-mental-models`, glossary polish, launch; polish backlog still open (copy-code
  buttons, `og:image`, topic copy-links, sticky table headers, S/W tables for m6/m11).
- **S1** (2026-07-01) — **Bootstrap.** Ran `guide-factory` scaffolder (`API Styles guide`, slug
  `api-styles-comprehensive-guide`, self-check ✓). Authored all four meta-docs: PROJECT-BRIEF (locked
  decisions, golden = REST), CURRICULUM (6 sections · 25 modules · 9 signature sims), CLAUDE, bilingual
  README. Web-verified the stack (TS 6.0 · Vite 8 · React 19.2.7 · ESLint 10.3) and the API-domain anchors
  (RFC 9110–9114 · RFC 9457 · OData 4.01 · OpenAPI 3.2.0). **No app shell yet** — `npm run verify` is not
  meaningful until S2 stands up the shell + golden module. *Branch:* `s1-bootstrap`. *Commit:* `chore:
  scaffold API Styles guide + author meta-docs (brief, curriculum, claude, readme)`. *Open items:* S2 =
  shell port + golden REST module + `rest-request-lifecycle` sim.
- **S2** (2026-07-01) — **Golden build.** Ported the shell from `../database guide`, adapted to the
  meta-split-free template contract (chrome reads `concepts.ts`; `Section.title`; fresh `search.ts`,
  `registry.tsx`, lean `ModulePage`; additive `theme/guide.css` for the azure/cyan reskin + sim/top-bar
  styles). Authored the **golden `m5-rest`** (8 topics, bilingual, decision-first: uniform interface →
  request lifecycle → safe/idempotent methods → status/Problem-Details (RFC 9457) → caching/ETag (RFC
  9111) → Richardson/HATEOAS → content negotiation → use/avoid verdict; key points, 4 pitfalls, 2
  interview Q&A, 6 verified sources). Built the signature sim **`rest-request-lifecycle`** (pure engine
  `src/lib/rest.ts` + `scripts/test-rest.ts` golden test + `RestRequestLifecycleSim.tsx`: play/step,
  reduced-motion, ARIA) and figures `rest-anatomy`, `http-status-classes`. Wired smoke's 4 spots; fixed
  the scaffolded `check-data` registry-key parser (brace-match — robust to the word appearing in comments/
  paths). **`npm run verify` GREEN**: typecheck · lint · check:data (6/25) · test · smoke (79 checks EN+UK)
  · build (49 modules, code-split). *Branch:* `s2-golden-rest`. *Commit:* `feat: port shell + author
  golden REST module + rest-request-lifecycle sim`. *Open items:* S3 = `m2-decision-axes` +
  `style-compass` landing + `m1-what-is-an-api` (beginner on-ramp).
- **S3** (2026-07-01) — **Foundations + the compass.** Authored the **beginner on-ramp `m1-what-is-an-api`**
  (5 topics: interface-vs-implementation → api-as-contract → api-as-product → in-process-vs-network →
  a-tiny-history; figures `api-boundary` + `in-process-vs-network`; key points, 3 pitfalls, 1 interview,
  5 sources) and the **signature `m2-decision-axes`** (7 topics = the 7 axes: sync/async · flow ·
  direction · initiative · encoding · topology · coupling; figures `decision-axes` + `coupling-spectrum`;
  6 key points, 3 pitfalls, 2 interview, 6 sources). Built the signature interactive **`style-compass`**:
  pure deterministic engine `src/lib/compass.ts` (7 axes × 12 style profiles, `scoreStyles`/`topMatch`) +
  `scripts/test-compass.ts` (golden scenarios: reqresp-loose→REST, push+server→SSE/Webhooks, binary+tight→
  gRPC, async+broker→messaging, bidi+push→WS/WebRTC) + `StyleCompassSim.tsx` (axis controls, live re-rank,
  style cards deep-linking to modules, ARIA + live region, reduced-motion). Added **scenario presets**
  (public-web→REST · typed-internal→gRPC · live-UI→SSE · two-way→WebSockets · async-events→messaging;
  test-pinned) and **seeded the first** so the compass opens ranked, not on a flat all-"Any" state.
  Made it the **landing hero** in `LandscapeMap` (eager import; also lazy in the registry for m2). Small
  shared-renderer fix: `SimBlock`
  now renders the authored sim caption (was dropped — also fixes m5's). Web-verified the history anchors
  (term "API" 1968 Cotton & Greatorex · RPC 1984 Birrell & Nelson · REST 2000 Fielding · GraphQL & gRPC
  2015). **All gates GREEN**: typecheck · lint · check:data (6/25, **3 authored**) · test (2 engines) ·
  smoke (**101 checks**, 2 sims + 6 figures EN+UK) · build (57 modules, code-split, `--outDir dist-s3c`).
  *Branch:* `s3-foundations-compass`. *Commit:* `feat: author m1 + m2 (decision axes) + style-compass
  landing interactive`. *Open items:* S4 = `m3-http-transport` + `http-multiplexing`; `m4-data-formats`.
- **S4** (2026-07-01) — **Transport & formats.** Authored the signature **`m3-http-transport`** (senior;
  7 topics: tcp-udp-tls → http1-1 → http2-multiplexing → http3-quic → head-of-line-blocking →
  keep-alive-pooling → how-transport-shapes-style; figure `http-connection-models`; 6 key points, 3
  pitfalls, 2 interview, 7 sources) and **`m4-data-formats`** (middle; 8 topics: json → xml → protobuf →
  messagepack-cbor → text-vs-binary-tradeoffs → schema-vs-schemaless → content-negotiation → compression;
  figure `encoding-size`; 6 key points, 3 pitfalls, 2 interview, 7 sources). Built the signature
  interactive **`http-multiplexing`**: pure deterministic engine `src/lib/http.ts` (schedules N requests
  under HTTP/1.1/2/3 with a packet-loss + head-of-line-blocking model) + `scripts/test-http.ts` (golden:
  multiplexing beats HTTP/1.1 past the 6-connection cap; under loss HTTP/2 stalls **all** streams, HTTP/3
  stalls **one**, HTTP/1.1 HOL is per-connection) + `HttpMultiplexingSim.tsx` (protocol switch,
  requests 4/8/12, Lose-a-packet toggle, stepped-clock Gantt with a swept playhead, reduced-motion, ARIA +
  live region). Web-verified the version-sensitive facts (RFC 9110–9114 · QUIC 9000/9001 · HPACK 7541 ·
  QPACK 9204 · Extensible Priorities 9218 · TLS 1.3 8446 · JSON 8259 · CBOR 8949 · Brotli 7932 · zstd 8878
  · HTTP/2 server push removed from Chrome 2022). **All gates GREEN**: typecheck · lint · check:data
  (**5 authored** / 25) · test (**3 engines**) · smoke (**115 checks**, 3 sims + 8 figures EN+UK) · build
  (63 modules, code-split, `--outDir dist-s4`). *Branch:* `s4-transport-formats`. *Commit:* `feat: author
  m3 (HTTP transport) + m4 (data formats) + http-multiplexing sim`. *Open items:* S5–S6 = `m10-grpc` +
  `grpc-wire`; `m9-graphql` + `graphql-nplus1`.
- **S5** (2026-07-01) — **gRPC.** Authored the signature **`m10-grpc`** (senior, contract-first; 8 topics:
  protobuf-idl → http2-transport → four-call-types → wire-encoding-varint-tag → deadlines-cancellation →
  status-codes → grpc-web → streaming-backpressure, closing on a use/avoid verdict; figure
  `grpc-call-types`; 6 key points, 3 pitfalls, 2 interview, 7 sources). Built the signature interactive
  **`grpc-wire`**: pure deterministic protobuf encoder `src/lib/grpc.ts` (tag `(field<<3)|wire`, varint,
  length-delimited strings, proto3 default omission, JSON-size comparison) + `scripts/test-grpc.ts`
  (golden: `varint(300)=[AC 02]`, `tag(2,LEN)=0x12`, exact message bytes, proto3 omission, Protobuf <
  JSON) + `GrpcWireSim.tsx` (edit id/title/tags → live byte stream with tag/len/value cells, omitted
  defaults struck through, size bar vs JSON; SSR-safe, ARIA + live region). Web-verified the facts (four
  call types over HTTP/2 streams · protobuf wire format · status carried in HTTP/2 trailers → gRPC-Web
  needs a proxy · HTTP/2 flow-control backpressure · deadlines default OFF). **All gates GREEN**:
  typecheck · lint · check:data (**6 authored** / 25) · test (**4 engines**) · smoke (**127 checks**, 4
  sims + 9 figures EN+UK) · build (code-split, `--outDir dist-s5`). *Branch:* `s5-grpc`. *Commit:* `feat:
  author m10 (gRPC) + grpc-wire protobuf encoder sim`. *Open items:* S6 = `m9-graphql` +
  `graphql-nplus1` (the N+1 problem + DataLoader batching).
- **S6** (2026-07-01) — **GraphQL.** Authored the signature **`m9-graphql`** (senior, contract-first;
  10 topics ordered why→how→cost→fix→operate: schema-sdl → queries-mutations-subscriptions →
  over-under-fetching (figure) → resolvers → the-n-plus-1-problem → dataloader-batching (sim) →
  schema-evolution → persisted-queries → security-depth-complexity → federation, closing on a use/avoid
  verdict; 6 key points, 3 pitfalls, 2 interview, 9 sources). Built the signature interactive
  **`graphql-nplus1`**: pure deterministic planner `src/lib/graphql.ts` (list query + naive per-post
  author queries vs a de-duplicated DataLoader batch) + `scripts/test-graphql.ts` (golden: naive = N+1,
  batch = 2, dedup to distinct `IN()`, deterministic) + `GraphqlNplus1Sim.tsx` (posts count + DataLoader
  toggle, stepped query-log reveal with play/step/reset, reduced-motion, N+1-vs-2 comparison bars, ARIA +
  live region); figure `graphql-over-under-fetching`; +4 glossary terms (Resolver, DataLoader, Federation
  + N+1 cross-links). Web-verified the version-sensitive facts (GraphQL **September 2025** spec edition —
  first full edition since Oct 2021, adds schema coordinates + `oneOf` input objects; GraphQL-over-HTTP
  media type `application/graphql-response+json`; DataLoader batches within one event-loop tick +
  per-request cache; `graphql-ws` replaced the deprecated `subscriptions-transport-ws`; APQ ≠ safelisting
  — persisted/trusted documents are the security feature; Apollo Router in Rust composes subgraphs →
  supergraph). **All gates GREEN**: typecheck · lint · check:data (**7 authored** / 25) · test (**5
  engines**) · smoke (**139 checks**, 5 sims + 10 figures EN+UK) · build (71 modules, code-split,
  `--outDir dist-s6`). *Branch:* `s6-graphql`. *Commit:* `feat: author m9 (GraphQL) + graphql-nplus1
  DataLoader sim`. *Open items:* S7 = `m12-websockets` + `websocket-frames`.
- **S7** (2026-07-01) — **WebSockets.** Authored the signature **`m12-websockets`** (senior, real-time;
  8 topics: upgrade-handshake → frames-opcodes (figure) → full-duplex (sim) → ping-pong-keepalive →
  subprotocols → scaling-sticky-fanout → backpressure → security-origin-wss, closing on a use/avoid
  verdict + a WS/SSE/WebRTC compare; 6 key points, 3 pitfalls, 2 interview, 8 sources). Built the
  signature interactive **`websocket-frames`**: pure deterministic timeline `src/lib/ws.ts` (HTTP
  Upgrade→101 handshake, then a scripted full-duplex frame exchange — text/binary + a ping/pong pair +
  the closing handshake, masking derived from direction) + `scripts/test-ws.ts` (golden: handshake-first
  →101, opcodes, client-masked/server-unmasked rule, ping→pong, full-duplex overlap, leading-byte
  FIN|opcode, determinism) + `WebsocketFramesSim.tsx` (two-rail sequence-diagram timeline, play/step/reset,
  “show bytes” toggle, reduced-motion, ARIA + live region); figure `websocket-frame-anatomy` (RFC 6455
  frame bit-layout); +4 glossary terms (Full-duplex, Subprotocol, CSWSH + WebSocket cross-links).
  Web-verified the facts (RFC 6455 handshake / `Sec-WebSocket-Accept` magic GUID 258EAFA5… / opcodes /
  client-masking rule / ping 0x9·pong 0xA; close codes 1000/1001/1006; RFC 8441 & RFC 9220 WS over
  HTTP/2 & HTTP/3 via Extended CONNECT, 9220 little production uptake by 2026; RFC 7692 permessage-deflate;
  CORS does not gate WS → CSWSH, defend with Origin allowlist + per-connection token). **All gates
  GREEN**: typecheck · lint · check:data (**8 authored** / 25) · test (**6 engines**) · smoke (**151
  checks**, 6 sims + 11 figures EN+UK) · build (75 modules, code-split, `--outDir dist-s7`). **QA pass:**
  scripted a fragmented message (FIN=0 → continuation `0x0`) into `websocket-frames` so it demonstrates
  fragmentation (retiring a dead FIN branch + the unused continuation opcode), localized the FIN tooltip,
  and tightened the Sept-2025 GraphQL spec wording; an independent subagent review found no P1/P2 issues;
  re-verified green (`dist-s7b`). *Branch:*
  `s7-websockets`. *Commit:* `feat: author m12 (WebSockets) + websocket-frames timeline sim`. *Open
  items:* S8 = `m14-webrtc` + `webrtc-connect`.
- **S8** (2026-07-02) — **WebRTC.** Authored the signature **`m14-webrtc`** (staff, real-time; 7 topics:
  p2p-media-and-data-channels (figure) → the-signaling-problem → sdp-offer-answer (JSEP) → ice-candidates
  (sim) → stun-turn-nat-traversal → dtls-srtp-security → data-channel-vs-media, closing on a use/avoid
  verdict + a WebRTC/WS-SSE compare; 6 key points, 3 pitfalls (no-TURN launches, WS-shaped jobs, mesh
  group calls), 2 staff interview Q&A, 10 sources). Built the signature interactive **`webrtc-connect`**:
  pure deterministic engine `src/lib/webrtc.ts` — three NAT scenarios (open→host, NATs→srflx via STUN,
  symmetric→TURN relay), each a scripted timeline: offer/answer + trickled candidates ride the signaling
  lane, connectivity checks probe pairs peer↔peer (failures visible), the surviving pair is nominated,
  DTLS keys SRTP+SCTP, then full-duplex data that never touches the server — + `scripts/test-webrtc.ts`
  (golden: JSEP ordering, signaling-only SDP/candidates, srflx-after-STUN / relay-after-TURN provenance,
  per-scenario nominated pair, DTLS-before-data, full-duplex tick, determinism, distinct scenario lengths)
  + `WebrtcConnectSim.tsx` (scenario switch, 3-lane timeline, phase chips, sig/p2p/TURN counters,
  play/step/reset, reduced-motion, ARIA + live region); figure `webrtc-connection-paths` (signaling
  triangle · direct DTLS path · TURN fallback); +4 glossary terms (SDP, STUN, TURN, Data channel + ICE/
  Signaling cross-links). Web-verified the version-sensitive facts (JSEP = **RFC 9429**, Apr 2024,
  obsoletes 8829 · suite 8825/8445/8838/8489/8656/8831/8832/5763-5764/7675/8828/8866 · W3C WebRTC 1.0
  Rec updated 2025 · mDNS `.local` host candidates in all major browsers · ~20% of public-internet
  connections need TURN, far more in enterprise · WHIP = **RFC 9725** (2025), WHEP still an IETF draft
  mid-2026). **QA pass:** independent subagent review → fixed 1 P1 (the open-internet scenario now shows
  public host addresses, so host↔host succeeding is coherent) + 4 P2s (mid-lane label no longer claims
  P2P pills sit "under the servers", the SR live region announces TURN separately from p2p, scenario
  buttons use `aria-pressed` instead of a keyboard-broken radio group, engine comment says cheapest-first)
  + hedged the symmetric-NAT ("almost always") and consent-freshness (~30 s) wording; re-verified green.
  **All gates GREEN**: typecheck · lint · check:data (**9 authored** / 25) · test (**7 engines**) · smoke
  (**163 checks**, 7 sims + 12 figures EN+UK) · build (code-split, `--outDir dist-s8b`). *Branch:*
  `s8-webrtc`. *Commit:* `feat: author m14 (WebRTC) + webrtc-connect NAT-scenario sim`. *Open items:*
  S9 = `m15-webhooks` + `webhook-delivery`; `m13-sse`.
- **S9** (2026-07-02) — **Webhooks + SSE.** Authored the signature **`m15-webhooks`** (senior; 8 topics:
  reverse-api-callbacks → delivery-at-least-once → retries-backoff (sim + a Stripe-vs-GitHub policy
  table) → idempotency-keys → signature-verification-hmac (Standard-Webhooks verify code:
  raw body · ±5 min window · rotation · byte-length-guarded `timingSafeEqual`) → replay-and-ordering →
  dead-letter → vs-polling-vs-websockets + verdict; 6 key points, 3 pitfalls, 2 senior interview Q&A
  (consumer + provider chairs), 7 sources) and **`m13-sse`** (middle; 5 topics: text-event-stream
  (figure + server/browser code) → auto-reconnect-last-event-id → vs-websockets (compare) →
  http2-multiplexing-caveat (6-per-origin h1 cap + buffering proxies) → when-sse-is-enough incl. the
  LLM-token-streaming renaissance; 6 key points, 3 pitfalls, 1 interview, 6 sources). Built the
  signature interactive **`webhook-delivery`**: pure deterministic engine `src/lib/webhook.ts` — three
  endpoint scenarios (healthy / flaky / down) × a **consumer-dedups toggle**; the flaky script is the
  thesis: 500 → backoff → success-with-LOST-ACK → re-delivery of the same `evt_42` → dedup ON = 1
  business effect, OFF = 2 (the double charge); down ends in the dead-letter queue — +
  `scripts/test-webhook.ts` (golden: sign-before-send, same-id re-delivery, verify-before-process,
  ×4 backoff schedule, dedup=1/no-dedup=2 effects, down ⇒ 0 effects + DLQ-last, determinism, distinct
  scenario lengths) + `WebhookDeliverySim.tsx` (scenario switch + dedup toggle, Provider/Consumer
  rails, attempts/effects counters with a ⚠ double-effect state, play/step/reset, reduced-motion,
  ARIA + live region); figure `sse-stream-anatomy` (the wire format + the Last-Event-ID resume loop);
  +4 glossary terms (Last-Event-ID, HMAC, At-least-once delivery, Dead-letter queue + SSE cross-link).
  Web-verified the version-sensitive facts (**Standard Webhooks** `webhook-id/-timestamp/-signature`,
  HMAC-SHA256 `v1,<base64>`, space-delimited rotation, adopted by OpenAI/Anthropic/Google/Twilio/
  PagerDuty · **Stripe** `Stripe-Signature: t=,v1=` over `t.payload`, 5-min default tolerance,
  exponential retries up to 3 days then endpoint disabled · **GitHub** `X-Hub-Signature-256:
  sha256=<hex>` over the body only, NO auto-retry, manual/API redelivery within 3 days · WHATWG SSE
  fields + `Last-Event-ID` · the ~6-connections-per-origin h1 cap, lifted by h2 · OpenAI/Anthropic
  stream over SSE). **QA pass:** independent subagent review → no P1s; fixed 2 P2s (the verify sample
  now compares BYTE lengths before `timingSafeEqual` and signs the raw timestamp header; the SSE
  figure's reconnect panel moved below the annotation rows — no more overlap) + 2 nitpicks
  (provider-side timeouts no longer draw a reply arrow; count-neutral live-region labels);
  re-verified green. **All gates GREEN**: typecheck · lint · check:data (**11 authored** / 25) · test
  (**8 engines**) · smoke (**175 checks**, 8 sims + 13 figures EN+UK) · build (code-split,
  `--outDir dist-s9b`; eager index chunk now ~450 kB → meta split scheduled for S10). *Branch:*
  `s9-webhooks-sse`. *Commit:* `feat: author m15 (Webhooks) + webhook-delivery sim + m13 (SSE)`.
  *Open items:* S10 = right-sized styles (`m6-odata`, `m7-soap-xml`, `m8-json-rpc`, `m11-trpc`,
  `m16-async-messaging`) + the meta split (standard §4.4).
- **S10a** (2026-07-02) — **Meta split + Section I complete.** Implemented the **standard §4.4 meta
  split**: `scripts/genMeta.ts` derives the committed `src/data/meta.json` (25 slim module records);
  `src/data/meta.ts` mirrors the concepts API (sections · modules · LEVELS · COUNTS · getSection ·
  modulesBySection · isAuthored); switched the six eager consumers (TopBar, Footer, Sidebar,
  LandscapeMap, StyleCompassSim, lib/search) to meta — only the lazy ModulePage still imports bodies;
  wired `gen:meta` as predev/prebuild and `check:meta` (drift guard) into `typecheck`. **Eager index
  chunk 450 kB → 78 kB** (gzip 27); bodies live in the lazy `concepts` chunk (~500 kB). Authored the
  right-sized Section-I styles: **`m6-odata`** (senior; 7 topics: query-over-rest → $filter/$select/
  $expand (figure `odata-query-anatomy`) → $orderby/$top/$skip + @odata.nextLink → $metadata/CSDL →
  $batch → when-OData-wins (compare) → risks + query-level-auth verdict; facts: 4.01 = current OASIS
  Standard, 4.02 committee drafts, CSDL JSON since 4.01, MS Graph/SAP flagships), **`m7-soap-xml`**
  (senior; 6 topics: envelope (figure `soap-envelope` + namespace-correct 1.2 sample) → WSDL (1.1
  de-facto, 2.0 unadopted) → WS-Security/WS-* (message-level vs TLS) → rpc-vs-document (doc/literal
  wrapped won) → SOAP-vs-REST (compare) → where-SOAP-survives + verdict; XXE pitfall), and
  **`m8-json-rpc`** (middle; 5 topics: rpc-over-http → the envelope (figure `rpc-envelope`; reserved
  codes) → batch & notifications → XML-RPC origins → vs-REST-vs-gRPC + verdict; the 2026 hook: **MCP
  runs JSON-RPC 2.0** over stdio/Streamable HTTP, alongside LSP and Ethereum). +4 glossary terms (CSDL,
  WSDL, WS-Security, Notification (JSON-RPC)). **QA pass:** independent subagent review (meta split
  verified clean: consumer field coverage, eager graph body-free, genMeta/checkMeta parity, CI ordering)
  → fixed 4 P1s (RpcEnvelope reserved-codes line overflow; undeclared `wsse` namespace in the m7
  sample; SoapEnvelope UK footnote crossing its box; UK «караєш»→«карбуєш») + 1 P2 ("a decade
  earlier"→"years before GraphQL") + the spelling cluster and a dead SVG prop; re-verified green.
  **All gates GREEN**: typecheck (+check:meta) · lint · check:data (**14 authored** / 25) · test (8
  engines) · smoke (**193 checks**, 8 sims + 16 figures EN+UK) · build (`--outDir dist-s10a2`, eager
  index 78 kB). *Branch:* `s10a-meta-split-section1`. *Commit:* `feat: meta split (450→78 kB eager) +
  author m6 (OData), m7 (SOAP), m8 (JSON-RPC)`. **Commit `src/data/meta.json`** — check:meta fails CI
  without it. *Open items:* S10b = `m11-trpc` + `m16-async-messaging`.
- **S10b** (2026-07-03) — **The last two right-sized styles.** Authored **`m11-trpc`** (Section II,
  senior; 6 topics: ts-native-rpc → no-codegen-inference (figure) → routers-procedures → end-to-end-types
  → boundaries-monorepo → vs-grpc-graphql, closing on a use/avoid verdict + a tRPC/gRPC/GraphQL compare;
  6 key points, 3 pitfalls, 2 senior interview Q&A, 6 sources) and **`m16-async-messaging`** (Section III,
  senior; 7 topics: broker-vs-point-to-point (figure) → mqtt-iot-qos → amqp-exchanges-queues →
  kafka-log-partitions-consumer-groups → delivery-guarantees → when-an-api-should-be-a-message (compare)
  → event-driven-arch + verdict; 6 key points, 3 pitfalls, 2 senior interview Q&A, 7 sources). Figures
  **`trpc-inference`** (the server exports a TYPE, the client `import type`s it — inference, not codegen,
  carries the contract; a danger banner on runtime validation) and **`broker-topologies`** (three shapes:
  sync point-to-point · a queue with competing consumers · a replayable log with two consumer groups at
  independent offsets). +8 glossary terms (tRPC, Message broker, MQTT, QoS (MQTT), AMQP, Kafka, Consumer
  group, Event-driven architecture). Wired both figures into `registry.tsx`, swapped the two `concepts.ts`
  stubs for real imports, added the two smoke `FIG_CANARIES`. Web-verified the version-sensitive facts
  (**tRPC v11** current major, TS-only/no-codegen, `import type` erased at runtime, HTTP+JSON via
  httpBatchLink, v11 SSE subscriptions, zod `.input()` → inferred type; **MQTT 3.1.1 (2014) + 5.0 (2019)**
  both current OASIS Standards, QoS 0/1/2 = at-most/at-least/exactly-once, QoS 2 = 4-packet handshake,
  per-hop; **AMQP 0-9-1 vs 1.0 are different protocols** — 0-9-1 = RabbitMQ exchange/binding/queue,
  1.0 = ISO/IEC 19464 wire-only; **Kafka 4.0** (2025-03-18) KRaft-only, ZooKeeper removed, partitions/
  consumer-groups/offsets/retention, EOS = idempotent producer + transactions within its boundary;
  end-to-end exactly-once is a myth → at-least-once + idempotent consumer + outbox). **QA pass:**
  independent subagent review → no P1s; fixed 1 P2 (the m16 figure’s UK panel-2 caption overflowed its
  panel past the separators — shortened to “рівно один consumer”) + P3s (invalid zod shorthand in the
  trpc figure → `z.object({ id: z.string() })`; MQTT header precision “as small as 2 bytes”; UK «бэклог»→
  «беклог»; strike-line + caption geometry; added a “via exchange” hint to the AMQP panel); re-verified
  green. **All gates GREEN**: typecheck (+check:meta) · lint · check:data (**16 authored** / 25) · test
  (8 engines) · smoke (**205 checks**, 8 sims + 18 figures EN+UK) · build (`--outDir dist-s10b`, rebuilt
  clean into `dist-s10b2` after QA; eager index 88 kB gzip 31, bodies in the lazy `concepts` chunk).
  *Branch:* `s10b-trpc-async-messaging`. *Commit:* `feat: author m11 (tRPC) + m16 (async messaging) +
  trpc-inference & broker-topologies figures`. **Commit `src/data/meta.json`** (check:meta guards it).
  *Open items:* S11–S12 = Section IV cross-cutting (`m17`–`m23`); S13 = `m24-decision-framework` +
  `style-picker`, `m25-mental-models`, glossary/polish/launch. All 9 signature sims now spent except
  `style-picker` (S13); the remaining modules are figure-first.
- **S11** (2026-07-03) — **Cross-cutting I: auth · versioning · errors.** Authored the first three
  Section-IV modules. **`m17-auth-identity`** (senior; 7 topics: api-keys → oauth2-1 (figure) → oidc →
  jwt-and-pitfalls → mtls → scopes-consent → per-style-auth + verdict; the AuthN-vs-AuthZ spine, the
  long-lived-secret → short-lived-token → sender-constrained arc, and “a valid token authenticates, never
  authorizes”; 6 key points, 3 pitfalls, 2 senior interview Q&A, 9 sources) + the figure **`oauth-flow`**
  (Authorization Code + PKCE as a 4-actor sequence: User · Client · Auth Server · API — challenge → consent
  → code → verifier → token → Bearer). **`m18-versioning`** (senior; 5 topics: uri-vs-header-vs-media-type
  (figure) → breaking-change-taxonomy → graphql-protobuf-evolution (a protobuf `reserved` code sample) →
  deprecation-sunset → consumer-driven-contracts + verdict; “add, never remove; deprecate then sunset;
  version rarely”; the two-sided tolerant-reader contract; 6 key points, 3 pitfalls, 1 senior + 1 staff
  interview, 7 sources) + figure **`version-strategies`** (one GET versioned three ways).
  **`m19-errors-status`** (middle; 6 topics: http-status-semantics → problem-details-rfc9457 (figure) →
  grpc-status → graphql-errors → retry-and-backoff → error-taxonomy + verdict; “an error is data, not a
  stack trace”; never 200-on-failure; branch on `type` not prose; retries safe+gentle; a compare of
  expected vs unexpected errors; 6 key points, 3 pitfalls, 1 middle + 1 senior interview, 7 sources) +
  figure **`problem-details`** (an RFC 9457 body annotated + mapped across REST/gRPC/GraphQL). Wired the
  three figures into `registry.tsx`, swapped the three `concepts.ts` stubs for real imports, added the
  three smoke `FIG_CANARIES`, regenerated `meta.json`. **Web-verified the version-sensitive facts** (OAuth
  2.1 still an IETF *draft* — draft-ietf-oauth-v2-1-15, PKCE mandatory, Implicit + ROPC removed, exact
  redirect match; OIDC Core 1.0, ID-token-is-a-JWT; JWT RFC 7519 / JWS 7515 / BCP 8725 — `alg:none` +
  RS256→HS256 confusion; mTLS cert-bound tokens RFC 8705 `cnf.x5t#S256`, DPoP RFC 9449 `cnf.jkt`, both in
  FAPI 2.0; BOLA/IDOR = OWASP API #1; Problem Details **RFC 9457 obsoletes 7807**, adds multiple-problems +
  a type registry; Deprecation **RFC 9745** + Sunset **RFC 8594** with Sunset ≥ Deprecation; HTTP status +
  Retry-After = RFC 9110 §10.2.3; the 16 gRPC canonical codes + `google.rpc.Status` details; GraphQL 200 +
  errors[] + partial data + “errors as data”; protobuf field-number-is-the-contract + `reserved`; Pact CDC
  + `buf` breaking). **QA pass:** rendered all three figures to PNG (EN+UK) and eyeballed geometry —
  caught + fixed that the new figures used inline-flowing `<tspan>`s (house convention is positioned
  `<text>`; librsvg/some engines don’t advance x between bare tspans) by rewriting `version-strategies`,
  `problem-details` (two-column key/value), and `oauth-flow` step 4 to positioned segments, and shortened
  the UK `problem-details` annotations that overflowed the viewBox. An independent subagent content review
  found **no P1/P2** (every RFC number, the draft-vs-standard status, all HTTP + gRPC code numbers,
  bilingual parity, and all seeAlso/inline refs verified). **All gates GREEN**: typecheck (+check:meta) ·
  lint · check:data (**19 authored** / 25) · test (8 engines) · smoke (**223 checks**, 8 sims + 21 figures
  EN+UK) · build (`--outDir dist-s11b`; eager index 96 kB gzip 34, bodies in the lazy `concepts` chunk 708
  kB). *Branch:* `s11-cross-cutting-auth-versioning-errors`. *Commit:* `feat: author m17 (auth) + m18
  (versioning) + m19 (errors/status) + oauth-flow, version-strategies, problem-details figures`. **Commit
  `src/data/meta.json`** (check:meta guards it). *Open items:* S12 = `m20-pagination-limits`,
  `m21-idempotency`, `m22-security-threats`, `m23-observability`; S13 = choosing section + `style-picker`,
  mental-models gallery, glossary, polish, launch.
- **S12a** (2026-07-08) — **Cross-cutting II: pagination/limits + idempotency/reliability (+ the §D
  retrofit).** Session opened with a **polish-stage audit** (independent subagent + verify): all gates
  green, content bar held; findings = 3 modules missing the §D(7) named-security-threat clause (m8, m13,
  m16), copy-code buttons + `og:image` missing (deferred to the polish batch), and pagination/CORS as the
  highest-value remaining interactives. Owner approved S12 modules + §D patches. Authored
  **`m20-pagination-limits`** (senior; 5 topics: offset-vs-cursor-keyset (sim) → server-driven-paging
  (compare + Link/`has_more`/`@odata.nextLink`/Connections) → rate-limiting-429 (algorithm table) →
  rate-limit-headers (X-RateLimit-* vs the IETF structured pair, code sample) → quotas-fairness +
  security callout + verdict; 6 key points, 3 pitfalls, 1 senior + 1 staff interview, 8 sources) and
  **`m21-idempotency`** (staff; 6 topics: idempotency-keys (SQL reservation sample) →
  at-least-once-vs-exactly-once (compare; Two Generals; EOS boundaries) → retries-and-dedup (full-jitter
  TS sample) → outbox-pattern (figure) → sagas-across-apis (choreography/orchestration table) →
  timeouts-circuit-breakers + security callout (replay) + verdict; 6 key points, 3 pitfalls, 2 staff
  interviews, 9 sources). Built the **`pagination-compare` interactive** (promoted from optional figure
  per §10 — the offset-drift insight must be felt): pure engine `src/lib/pagination.ts` (one newest-first
  feed walked 3 pages by offset AND cursor while scripted writes land between fetches; inserts ⇒ offset
  re-serves exactly the shifted rows, deletes ⇒ offset silently skips the rows that slid up, cursor exact
  in all scenarios; `missed` = passed-over-forever, floor-rule documented) + `scripts/test-pagination.ts`
  (golden: stable parity, dup/miss counts = mutation sizes, keyset continuation, determinism) +
  `PaginationCompareSim.tsx` (two rails, scenario switch, mutation banner, play/step/reset,
  reduced-motion jump, ARIA live region; `pgc-*` styles in guide.css). Figure **`outbox-saga`**
  (dual-write bug vs one-tx outbox + relay; saga chain with backwards compensations,
  choreography-vs-orchestration footnote) — **rendered EN+UK to PNG and eyeballed geometry** (house S11
  practice): fixed a label running under the tx box, a right-edge overflow (split to two lines), an
  overflowing compensation box, and a UK choreography-column overlap. **§D(7) retrofit:** added the named
  top-threat security callout to **m8** (one URL hides every method — per-method authz, batch
  amplification, the Ethereum-node lesson), **m13** (the stream outlives its credentials — EventSource
  header limits, cookie/query trade-offs, connection-exhaustion DoS), **m16** (the broker widens the
  trust boundary — spoofed/replayed events, per-topic ACLs, sign the message not the pipe). +7 glossary
  terms (Cursor pagination, Keyset pagination, Rate limiting, Token bucket, Outbox pattern, Saga,
  Circuit breaker → 55 total). **Web-verified the version-sensitive facts** (RateLimit/RateLimit-Policy =
  draft-ietf-httpapi-ratelimit-headers-**11**, 2026-05-23, Standards Track, still a DRAFT — structured
  syntax `"hour";q=5000;w=3600` / `"hour";r=0;t=30` confirmed against the draft text; Idempotency-Key =
  draft-ietf-httpapi-idempotency-key-header, still a WG draft; Stripe `starting_after`/`ending_before`,
  limit 1–100 default 10, `has_more`; Stripe Idempotency-Key ≤255 chars, V4 UUID, 24 h retention,
  first-outcome replay; GitHub 5,000 req/h auth · 60 unauth · secondary ~900 points/min ⇒ 403/429;
  429 = RFC 6585; Retry-After = RFC 9110 §10.2.3; Link = RFC 8288; outbox/saga = microservices.io;
  full jitter = AWS; breaker = Nygard/Fowler). **QA pass:** independent subagent review → **no factual
  errors, engine/test/sim logic verified by hand-trace**; fixed 2 P1s (corrupted UK strings
  «переиспользування», «перут-на») + 4 P2s (SQL-note transaction-boundary wording made consistent with
  the two-commit design; the http sample's mid-header blank lines removed (headers contiguous, real
  body split); «голодоморити» ×2 → neutral phrasing; m13 «пінить» → «утримує») + the P3 cluster
  (label-first live-region counts, «Закривай»→«Обмежуй», dashes, «поза столом»/«злий ownership»/
  «темпує» de-calqued); re-verified green. **All gates GREEN**: typecheck (+check:meta) · lint ·
  check:data (**21 authored** / 25) · test (**9 engines**) · smoke (**235 checks**, 9 sims + 22 figures
  EN+UK) · build (`--outDir dist-s12a`; eager index 105 kB gzip 37, bodies in the lazy `concepts` chunk
  810 kB). *Branch:* `s12a-pagination-idempotency`. *Commit:* `feat: author m20 (pagination & limits) +
  pagination-compare sim + m21 (idempotency) + outbox-saga figure + §D security callouts (m8/m13/m16)`.
  **Commit `src/data/meta.json`** (check:meta guards it). *Cleanup:* `rm -rf dist-s12a` (scratch build) +
  `rm scripts/_render-outbox.ts` (QA render helper; the sandbox couldn't unlink it). *Open items:*
  S12b = `m22-security-threats` + `m23-observability`; S13 = `m24-decision-framework` + `style-picker`,
  `m25-mental-models`, glossary/polish/launch; polish batch (owner-approved backlog): copy-code buttons,
  `og:image` share card, topic copy-links, sticky table headers, S/W tables for m6/m11.
