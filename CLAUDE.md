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
- **Meta split:** `gen:meta` derives `src/data/meta.json`; the eager shell imports `src/data/meta.ts`, not
  `concepts.ts`, so module bodies stay out of the initial bundle. (Add when the guide grows past ~6 modules.)
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
  + **commit message** (concise imperative) + short description; (3) challenges/questions.

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
- **S9** — `m15-webhooks` + `webhook-delivery`; `m13-sse`.
- **S10** — right-sized styles (OData, SOAP, JSON-RPC, tRPC, async messaging).
- **S11–S12** — Section IV cross-cutting (m17–m23).
- **S13** — decision framework + `style-picker`, mental-models gallery, glossary, polish, launch.

## 14. Status / progress log
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
