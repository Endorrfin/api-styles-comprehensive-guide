# CURRICULUM — `api-styles-comprehensive-guide`

> The authoritative **Section → Module → Topic** map. `CLAUDE.md` §4 holds the TypeScript contract; this
> file holds the *content plan*. Keep them in sync. Conforms to `../_standard/GUIDE-AUTHORING-STANDARD.md`.

## A. Modularity model
- A **Module** is self-contained: land on it, finish it, leave. Every module opens with its **mental
  model** (one line/picture) + **key points**, and closes with **pitfalls**, an explicit **use / avoid**
  verdict, and optional **interview Q&A**.
- A **Topic** is independently **deep-linkable** (`#/m/<module>/<topic>`).
- **Skip / jump freely** — modules are not a forced sequence, but the numbering is the recommended read order.

## B. Navigation & UX
Landing **Style Compass** (the axes map) · collapsible sidebar · global search · level filter
(beginner → staff) · mental-models gallery · bilingual glossary · **Decide / Picker** page.

## C. Data model
See `CLAUDE.md` §4 and `../_standard/templates/tier1-spa/types.ts` for the authoritative TypeScript
contract. Levels: `beginner | middle | senior | staff`.

## D. Framing contract (every *style* module follows this arc)
1. **Mental model** — the one picture that makes the style click.
2. **What it is** — the wire/interaction model it assumes.
3. **Limits** — what the model can't do / where it strains.
4. **Alternatives** — the realistic substitutes and the single trade-off that separates them.
5. **Strengths / weaknesses** — honest table.
6. **When to use / when NOT** — the verdict + concrete boundary examples.
7. **Cross-cutting** — its top security threat + how auth/versioning/errors land here (links to Section IV).

---

## E. The modules
> `★` = signature (has a hero sim). Levels: b = beginner, m = middle, s = senior, S = staff.

### Section 0 — Foundations (`s0-foundations`) · accent baseline
The coordinate system: what an API is, the axes that separate every style, and the transport + encoding
substrate they all ride on.

| # | id | Module | Lvl | Topics (deep-links) | Signature |
|---|---|---|---|---|---|
| 1 | `m1-what-is-an-api` | What is an API? | b | interface-vs-implementation · api-as-contract · api-as-product · in-process-vs-network · a-tiny-history | — |
| 2 | `m2-decision-axes` | The decision axes | m | sync-vs-async · reqresp-streaming-push · unary-vs-bidirectional · client-vs-server-driven · text-vs-binary · p2p-vs-broker · coupling-spectrum | ★ `style-compass` (landing map) |
| 3 | `m3-http-transport` | The HTTP transport substrate | s | tcp-udp-tls · http1-1 · http2-multiplexing · http3-quic · head-of-line-blocking · keep-alive-pooling · how-transport-shapes-style | ★ `http-multiplexing` |
| 4 | `m4-data-formats` | Data formats & serialization | m | json · xml · protobuf · messagepack-cbor · text-vs-binary-tradeoffs · schema-vs-schemaless · content-negotiation · compression | figure `encoding-size` |

### Section I — Request/Response over HTTP (`s1-req-resp-http`)
The synchronous, client-initiated family: you ask, you wait, you get an answer. REST is the baseline;
the others are variations on "shape a request and a response over HTTP".

| # | id | Module | Lvl | Topics | Signature |
|---|---|---|---|---|---|
| 5 | `m5-rest` **★ GOLDEN** | REST | m | resources-representations · uniform-interface · methods-safe-idempotent · status-codes · richardson-maturity · hateoas · caching-rfc9111 · conditional-requests-etags · content-negotiation · rest-pitfalls | ★ `rest-request-lifecycle` |
| 6 | `m6-odata` | OData | s | query-over-rest · filter-select-expand · orderby-top-skip · metadata-csdl · batch · when-odata-wins · risks | (opt) `odata-query` |
| 7 | `m7-soap-xml` | SOAP / XML Web Services | s | envelope-structure · wsdl · ws-security-ws-star · rpc-vs-document-style · soap-vs-rest · where-soap-survives | figure `soap-envelope` |
| 8 | `m8-json-rpc` | JSON-RPC & XML-RPC | m | rpc-over-http · request-response-shape · batch-notifications · xml-rpc-origins · vs-rest-vs-grpc | figure `rpc-envelope` |

### Section II — Contract-first & typed (`s2-contract-first`)
Start from a **schema/IDL**, generate/​infer the types, let tooling enforce the contract. Trades REST's
uniformity for precision, performance, and end-to-end types.

| # | id | Module | Lvl | Topics | Signature |
|---|---|---|---|---|---|
| 9 | `m9-graphql` | GraphQL | s | schema-sdl · queries-mutations-subscriptions · resolvers · the-n-plus-1-problem · dataloader-batching · over-under-fetching · schema-evolution · persisted-queries · security-depth-complexity · federation | ★ `graphql-nplus1` |
| 10 | `m10-grpc` | gRPC | s | protobuf-idl · http2-transport · four-call-types · wire-encoding-varint-tag · deadlines-cancellation · status-codes · grpc-web · streaming-backpressure | ★ `grpc-wire` |
| 11 | `m11-trpc` | tRPC | s | ts-native-rpc · no-codegen-inference · routers-procedures · end-to-end-types · boundaries-monorepo · vs-grpc-graphql | figure `trpc-inference` |

### Section III — Real-time, push & event-driven (`s3-realtime-events`)
When the server has something to say *first*, or both sides talk at once, or delivery is a fire-and-forget
event. **Webhooks live here** — a webhook is a server→server callback (an event push), not a request you
wait on.

| # | id | Module | Lvl | Topics | Signature |
|---|---|---|---|---|---|
| 12 | `m12-websockets` | WebSockets | s | upgrade-handshake · frames-opcodes · full-duplex · ping-pong-keepalive · subprotocols · scaling-sticky-fanout · backpressure · security-origin-wss | ★ `websocket-frames` |
| 13 | `m13-sse` | Server-Sent Events (SSE) | m | text-event-stream · auto-reconnect-last-event-id · vs-websockets · http2-multiplexing-caveat · when-sse-is-enough | (opt) `sse-stream` |
| 14 | `m14-webrtc` | WebRTC | S | p2p-media-and-data-channels · the-signaling-problem · sdp-offer-answer · ice-candidates · stun-turn-nat-traversal · dtls-srtp-security · data-channel-vs-media | ★ `webrtc-connect` |
| 15 | `m15-webhooks` | Webhooks | s | reverse-api-callbacks · delivery-at-least-once · retries-backoff · idempotency-keys · signature-verification-hmac · replay-and-ordering · dead-letter · vs-polling-vs-websockets | ★ `webhook-delivery` |
| 16 | `m16-async-messaging` | Async messaging landscape | s | broker-vs-point-to-point · mqtt-iot-qos · amqp-exchanges-queues · kafka-log-partitions-consumer-groups · delivery-guarantees · when-an-api-should-be-a-message · event-driven-arch | figure `broker-topologies` |

### Section IV — Cross-cutting concerns (`s4-cross-cutting`)
The problems every style must solve, taught once and mapped across all of them.

| # | id | Module | Lvl | Topics | Signature |
|---|---|---|---|---|---|
| 17 | `m17-auth-identity` | Authentication & authorization | s | api-keys · oauth2-1 · oidc · jwt-and-pitfalls · mtls · scopes-consent · per-style-auth | figure `oauth-flow` |
| 18 | `m18-versioning` | Versioning & evolution | s | uri-vs-header-vs-media-type · breaking-change-taxonomy · graphql-protobuf-evolution · deprecation-sunset · consumer-driven-contracts | figure `version-strategies` |
| 19 | `m19-errors-status` | Errors & status semantics | m | http-status-semantics · problem-details-rfc9457 · grpc-status · graphql-errors · retry-and-backoff · error-taxonomy | figure `problem-details` |
| 20 | `m20-pagination-limits` | Pagination & rate limiting | s | offset-vs-cursor-keyset · server-driven-paging · rate-limiting-429 · rate-limit-headers · quotas-fairness | (opt) `pagination-compare` |
| 21 | `m21-idempotency` | Idempotency, reliability & delivery | S | idempotency-keys · at-least-once-vs-exactly-once · retries-and-dedup · outbox-pattern · sagas-across-apis · timeouts-circuit-breakers | figure `outbox-saga` |
| 22 | `m22-security-threats` | Security & threat models | S | injection · ssrf · cors · csrf · dos-complexity-attacks · deserialization · tls-everywhere · secrets-and-replay | figure `trust-boundaries` |
| 23 | `m23-observability` | Observability & gateways | s | logging-metrics-tracing · opentelemetry-traceparent · api-gateways-bff · schema-registries · contract-testing · versioned-docs-openapi | figure `gateway-topology` |

### Section V — Choosing (`s5-choosing`)
Turn the whole guide into a decision. The picker and the mental-models recap.

| # | id | Module | Lvl | Topics | Signature |
|---|---|---|---|---|---|
| 24 | `m24-decision-framework` | The decision framework | S | the-decision-tree · the-trade-off-matrix · anti-patterns · migration-paths · polyglot-apis-in-one-system · cost-of-change | ★ `style-picker` |
| 25 | `m25-mental-models` | Mental models & when-NOT gallery | b–S | one-liner-per-style · when-not-to-use-each · the-axes-recap · glossary-bridge | gallery page |

---

## F. Totals & asset budget
- **6 sections · 25 modules · ~140 topics.**
- **Signature sims (9):** `style-compass`, `http-multiplexing`, **`rest-request-lifecycle` (golden)**,
  `graphql-nplus1`, `grpc-wire`, `websocket-frames`, `webrtc-connect`, `webhook-delivery`, `style-picker`.
  Optional promotions: `odata-query`, `sse-stream`, `pagination-compare`.
- **Figures (~14):** `encoding-size`, `soap-envelope`, `rpc-envelope`, `trpc-inference`,
  `broker-topologies`, `oauth-flow`, `version-strategies`, `problem-details`, `outbox-saga`,
  `trust-boundaries`, `gateway-topology`, plus per-module diagrams (method/idempotency table, status-code
  map, ICE flow) authored inline.
- **Standard pages:** landing Style Compass (`#/`), Decide/Picker (`#/decide`), Mental Models
  (`#/mental-models`), Glossary (`#/glossary`), global search.

## G. Build order
1. **S1 (done):** scaffold + meta-docs + this curriculum.
2. **S2 — GOLDEN:** port the `database guide` shell (App · hash router · i18n · theme · `lib/registry` ·
   `components/{layout,module,map,pages}` · blocks renderer) → author **`m5-rest`** + its signature sim
   **`rest-request-lifecycle`** (engine `src/lib/rest.ts` + `scripts/test-rest.ts` golden test) → wire the
   4 smoke TODOs → `npm run verify` green.
3. **S3 (done):** `m1-what-is-an-api` (beginner on-ramp) + `m2-decision-axes` + `style-compass` (engine
   `lib/compass.ts` + `test-compass.ts` + sim, now the landing hero).
4. **S4 (done):** `m3-http-transport` + `http-multiplexing`; `m4-data-formats`.
5. **S5 (done):** `m10-grpc` + `grpc-wire`. **S6:** `m9-graphql` + `graphql-nplus1`.
6. **S7–S8:** `m12-websockets` + `websocket-frames`; `m14-webrtc` + `webrtc-connect`.
7. **S9:** `m15-webhooks` + `webhook-delivery`; `m13-sse`.
8. **S10:** `m6-odata`, `m7-soap-xml`, `m8-json-rpc`, `m11-trpc`, `m16-async-messaging` (right-sized).
9. **S11–S12:** Section IV cross-cutting (m17–m23).
10. **S13:** `m24-decision-framework` + `style-picker`; `m25-mental-models`; glossary; polish; launch.
