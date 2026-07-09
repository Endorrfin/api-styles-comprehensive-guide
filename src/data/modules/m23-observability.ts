import type { Module } from '../types';

/*
 * m23-observability — Observability & gateways (s4-cross-cutting, order 7). The module that makes a
 * distributed system legible: three signals, one trace id, a gateway at the edge, and specs/registries
 * that turn "docs" into an enforced contract. Figure `gateway-topology` (clients → gateway → BFF →
 * services, with a traceparent threading every hop). Six curriculum topics: logging-metrics-tracing →
 * opentelemetry-traceparent → api-gateways-bff (figure) → schema-registries → contract-testing →
 * versioned-docs-openapi (verdict). Level: senior.
 *
 * SCOPE BOUNDARY (avoid overlap): gateway *auth* is m17; gateway *rate-limiting* is m20; gateway *TLS
 * termination* is m22; *breaking-change taxonomy / Pact intro* is m18; *broker/Kafka* is m16. This
 * module is the operability layer that sits on top — the signals, the propagation, the edge topology,
 * and the runtime enforcement of the evolution rules m18 defines.
 *
 * Facts web-verified S12b (2026-07):
 *  - OpenTelemetry: OTLP + the traces/metrics/logs signals are STABLE/GA (2026); profiles = public alpha.
 *  - W3C Trace Context: `traceparent` = version-traceid-spanid-flags, e.g.
 *    00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01 (flags 01 = sampled); trace-id 16 bytes
 *    (32 hex), span-id 8 bytes (16 hex). Level 1 is a W3C Recommendation; Level 2 (adds the random-
 *    trace-id flag) is at Candidate Recommendation, NOT yet a full REC as of mid-2026. `tracestate`
 *    carries vendor key/values.
 *  - OpenAPI 3.2.0 released 2025-09 (structured tags, first-class streaming media types, arbitrary/
 *    additional HTTP methods, OAuth2 device flow); builds on 3.1's JSON Schema 2020-12 alignment.
 *    AsyncAPI is the event-driven counterpart.
 *  - Confluent Schema Registry: compatibility modes BACKWARD/FORWARD/FULL (+ *_TRANSITIVE, NONE);
 *    Avro/Protobuf/JSON Schema; enforced at register time.
 *  - Contract testing: Pact = consumer-driven; PactFlow = bidirectional contract testing (BDCT);
 *    AsyncAPI/message support still maturing (2026).
 */
export const m23: Module = {
  id: 'm23-observability',
  num: 23,
  section: 's4-cross-cutting',
  order: 7,
  level: 'senior',
  title: { en: 'Observability & gateways', uk: 'Observability та gateways' },
  tagline: {
    en: 'Tracing, gateways/BFF, schema registries, contract testing.',
    uk: 'Tracing, gateways/BFF, schema registries, contract testing.',
  },
  readMins: 16,
  mentalModel: {
    en: '**You cannot fix what you cannot see — and in a distributed system, "seeing" means following one request across every hop it touches.** A single call now fans out through a gateway, a backend-for-frontend, three services, and a queue; when it is slow or wrong, the logs of any one box are a keyhole view. Observability is the discipline of making the whole path legible, and it rests on **three signals with three different jobs**: **metrics** tell you *that* something is wrong (the error rate climbed, p99 doubled), **traces** tell you *where* (the 6 seconds were spent in the payments span), and **logs** tell you *why* (that span logged a slow query). The thread that ties them together is a **trace id** minted at the edge and propagated — unbroken — to the last hop, via the W3C Trace Context `traceparent` header and the vendor-neutral OpenTelemetry standard. The same "make the boundary legible and enforced" instinct extends past runtime into the *contract*: an **API gateway** centralizes the edge concerns, a **schema registry** and **consumer-driven contract tests** turn m18\'s evolution rules from hope into a build-time gate, and a **versioned OpenAPI/AsyncAPI spec** keeps docs, validation, and generated code from ever drifting apart.',
    uk: '**Не полагодиш те, чого не бачиш — а в розподіленій системі «бачити» означає стежити за одним запитом крізь кожен хоп, якого він торкається.** Один виклик тепер розгортається крізь gateway, backend-for-frontend, три сервіси й чергу; коли він повільний чи хибний, логи будь-якої окремої коробки — це погляд крізь замкову шпарину. Observability — це дисципліна робити весь шлях легким для читання, і вона стоїть на **трьох сигналах із трьома різними задачами**: **metrics** кажуть *що* щось не так (error rate зріс, p99 подвоївся), **traces** кажуть *де* (6 секунд провели у span-і payments), а **logs** кажуть *чому* (той span залогував повільний запит). Нитка, що їх звʼязує, — це **trace id**, викарбуваний на edge і пропагований — безперервно — до останнього хопа, через заголовок W3C Trace Context `traceparent` і вендор-нейтральний стандарт OpenTelemetry. Той самий інстинкт «зроби межу читаною й забезпеченою» тягнеться поза рантайм у *контракт*: **API gateway** централізує edge-турботи, **schema registry** й **consumer-driven contract-тести** перетворюють правила еволюції з m18 зі сподівання на build-time gate, а **версійована OpenAPI/AsyncAPI-специфікація** не дає докам, валідації й згенерованому коду ніколи розійтися.',
  },
  topics: [
    // ── T1 · The three signals ────────────────────────────────────────────────
    {
      id: 'logging-metrics-tracing',
      title: { en: 'Logs, metrics & traces', uk: 'Logs, metrics і traces' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Observability rests on **three signals, and they are not interchangeable** — each answers a question the others cannot. **Logs** are discrete, timestamped events with context ("order 4217 failed validation: missing `currency`"); structure them as key/value or JSON so they are queryable, not grep-bait. **Metrics** are numeric aggregates over time — request **rate**, **error** ratio, **duration** percentiles (the **RED** method for request-driven services; **USE** — utilization, saturation, errors — for resources). They are cheap and always-on, which is why they carry alerting, but they must stay **low-cardinality**: a metric is a time series per label combination, so a `user_id` label spawns a series per user and melts the backend. **Traces** are the missing dimension in a distributed call — the causal path of *one* request as it fans across services, each step a **span** with a start, duration, and parent. Metrics notice the fire, a trace points at the room, logs read the note left on the desk; the mature posture uses all three and links them by a shared **trace id** so you can pivot from a spiking dashboard to the exact slow request to the log line that explains it.',
            uk: 'Observability стоїть на **трьох сигналах, і вони не взаємозамінні** — кожен відповідає на питання, якого інші не можуть. **Logs** — дискретні події з часовою міткою й контекстом («order 4217 не пройшов валідацію: бракує `currency`»); структуруй їх як key/value чи JSON, щоб вони були запитуваними, а не наживкою для grep. **Metrics** — числові агрегати в часі: **rate** запитів, частка **error**, перцентилі **duration** (метод **RED** для request-driven сервісів; **USE** — utilization, saturation, errors — для ресурсів). Вони дешеві й завжди ввімкнені, тому несуть алертинг, але мусять лишатися **low-cardinality**: метрика — це часовий ряд на комбінацію лейблів, тож лейбл `user_id` породжує ряд на кожного користувача й плавить бекенд. **Traces** — це відсутній вимір у розподіленому виклику: причинний шлях *одного* запиту, поки він розгортається крізь сервіси, кожен крок — **span** зі стартом, тривалістю й батьком. Metrics помічають пожежу, trace вказує на кімнату, logs читають записку на столі; зріла позиція вживає всі три й лінкує їх спільним **trace id**, щоб можна було перейти від дашборда, що стрибає, до конкретного повільного запиту й до рядка лога, що його пояснює.',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Signal', uk: 'Сигнал' },
            { en: 'Answers', uk: 'Відповідає' },
            { en: 'Watch out for', uk: 'Стережися' },
          ],
          rows: [
            [
              { en: 'Metrics', uk: 'Metrics' },
              { en: 'IS something wrong? (rate, errors, p99)', uk: 'ЧИ щось не так? (rate, errors, p99)' },
              { en: 'Cardinality — bounded labels only', uk: 'Кардинальність — лише обмежені лейбли' },
            ],
            [
              { en: 'Traces', uk: 'Traces' },
              { en: 'WHERE is it wrong? (the span waterfall)', uk: 'ДЕ не так? (водоспад span-ів)' },
              { en: 'A broken hop blinds the whole trace', uk: 'Зламаний хоп сліпить увесь trace' },
            ],
            [
              { en: 'Logs', uk: 'Logs' },
              { en: 'WHY is it wrong? (the event + context)', uk: 'ЧОМУ не так? (подія + контекст)' },
              { en: 'Structure + carry the trace id', uk: 'Структуруй + неси trace id' },
            ],
          ],
          caption: {
            en: 'Three signals, three jobs. The trace id is what lets you pivot between them; without it you have three disconnected haystacks.',
            uk: 'Три сигнали, три задачі. Trace id — це те, що дає перемикатися між ними; без нього маєш три розʼєднані копиці сіна.',
          },
        },
      ],
    },
    // ── T2 · OpenTelemetry & traceparent ──────────────────────────────────────
    {
      id: 'opentelemetry-traceparent',
      title: { en: 'OpenTelemetry & traceparent', uk: 'OpenTelemetry і traceparent' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'For years every observability vendor shipped its own agent and wire format, so switching backends — or correlating two services that used different ones — meant re-instrumenting everything. **OpenTelemetry (OTel)** is the vendor-neutral standard that ended that: one set of SDKs and one protocol (**OTLP**) emitting all three signals — traces, metrics, and logs, all now **stable/GA** — to any compatible backend. The piece that makes tracing survive *across* service and style boundaries is **context propagation** via the **W3C Trace Context** standard. Its `traceparent` request header carries four dash-separated fields — `version-trace_id-span_id-flags`, e.g. `00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01` (the trailing `01` = "sampled"). Every hop **reads** the incoming `traceparent`, opens a **child span** under the *same* `trace_id`, and passes a **new** `traceparent` (its own span as parent) onward — so one `trace_id` stitches the REST call, the gRPC call, and even the queued message (the broker carries it as message metadata, m16) into a single timeline. A companion `tracestate` header carries vendor-specific key/values alongside. Because it is *just a header*, it crosses every style in this guide; the one rule is that **no hop may drop it** — a service that fails to propagate `traceparent` severs the trace and blinds everything downstream of it.',
            uk: 'Роками кожен observability-вендор постачав власний агент і wire-формат, тож зміна бекенду — чи кореляція двох сервісів, що вжили різні, — означала переінструментувати все. **OpenTelemetry (OTel)** — вендор-нейтральний стандарт, що це припинив: один набір SDK і один протокол (**OTLP**), що емітить усі три сигнали — traces, metrics і logs, усі тепер **stable/GA** — у будь-який сумісний бекенд. Частина, що дає трейсингу вижити *через* межі сервісів і стилів, — **context propagation** через стандарт **W3C Trace Context**. Його заголовок `traceparent` несе чотири поля через дефіс — `version-trace_id-span_id-flags`, напр. `00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01` (кінцеве `01` = «sampled»). Кожен хоп **читає** вхідний `traceparent`, відкриває **child span** під *тим самим* `trace_id` і передає **новий** `traceparent` (свій span як parent) далі — тож один `trace_id` зшиває REST-виклик, gRPC-виклик і навіть повідомлення в черзі (broker несе його як message metadata, m16) в єдину лінію часу. Супутній заголовок `tracestate` несе вендор-специфічні key/value поряд. Оскільки це *просто заголовок*, він перетинає кожен стиль у цьому гайді; єдине правило — **жоден хоп не сміє його загубити**: сервіс, що не пропагує `traceparent`, розриває trace і сліпить усе нижче за ним.',
          },
        },
        {
          kind: 'code',
          lang: 'http',
          code: `# The same trace, three hops. Only the span_id changes; the trace_id is invariant.

# 1 · client → gateway  (edge mints the trace)
traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
#            └ver┘ └──────────── trace_id (16 B) ───────────┘ └─ span_id ─┘ └flags: 01 = sampled

# 2 · gateway → orders  (child span, SAME trace_id, NEW span_id)
traceparent: 00-0af7651916cd43dd8448eb211c80319c-00f067aa0ba902b7-01

# 3 · orders → payments (another child under the one trace_id)
traceparent: 00-0af7651916cd43dd8448eb211c80319c-a1b2c3d4e5f60718-01
tracestate:  acme=t61rcWkgMzE          # vendor key/values ride alongside`,
          note: {
            en: 'One `trace_id` across every hop is the entire trick — it is what lets the backend reassemble a span waterfall from events reported independently by each service. The `01` flag says this trace was sampled (kept); dropping the header anywhere breaks the chain from that point on.',
            uk: 'Один `trace_id` на кожному хопі — це весь трюк: саме він дає бекенду зібрати водоспад span-ів із подій, звітованих кожним сервісом незалежно. Прапор `01` каже, що trace засемпльований (збережений); загубити заголовок будь-де — розірвати ланцюг із цієї точки далі.',
          },
        },
      ],
    },
    // ── T3 · Gateways & BFF (figure) ──────────────────────────────────────────
    {
      id: 'api-gateways-bff',
      title: { en: 'Gateways & Backend-for-Frontend', uk: 'Gateways та Backend-for-Frontend' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'An **API gateway** is the single front door in front of many services, and it exists so that the cross-cutting concerns are solved **once at the edge** instead of re-implemented in every service: it terminates TLS (m22), authenticates and does coarse-grained authorization (m17), enforces rate limits and quotas (m20), routes to the right upstream, and — the reason it belongs in *this* module — **injects and propagates the trace id** and emits uniform edge telemetry, so every request is observable from the moment it arrives. The **Backend-for-Frontend (BFF)** pattern goes one step further: rather than one general-purpose API serving web, mobile, and partner clients with an awkward one-size-fits-all shape, each client type gets a **tailored backend** that aggregates and trims responses to its exact needs — a mobile BFF returns a lean payload over a slow link, a web BFF composes several services into one page-shaped response — which lets each client and its BFF evolve together without disturbing the others. Both are powerful and both share one failure mode: **scope creep into business logic.** A gateway or BFF that accumulates domain rules becomes a shared monolith every team must coordinate on and deploy around; keep them to edge concerns and composition, and let the services own the domain.',
            uk: '**API gateway** — це єдині парадні двері перед багатьма сервісами, і він існує, щоб наскрізні турботи розвʼязувалися **раз на edge**, а не переписувалися в кожному сервісі: він термінує TLS (m22), автентифікує й робить грубозернисту авторизацію (m17), застосовує rate-ліміти й квоти (m20), маршрутизує до потрібного upstream і — причина, чому він у *цьому* модулі — **інʼєктить і пропагує trace id** й емітить уніфіковану edge-телеметрію, тож кожен запит спостережуваний із миті прибуття. Патерн **Backend-for-Frontend (BFF)** іде на крок далі: замість одного загального API, що обслуговує web, mobile й partner клієнтів незручною універсальною формою, кожен тип клієнта отримує **пошитий під нього бекенд**, що агрегує й підрізає відповіді під його точні потреби — mobile BFF повертає ощадливий payload по повільному лінку, web BFF компонує кілька сервісів у одну відповідь під сторінку — що дає кожному клієнту та його BFF еволюціонувати разом, не турбуючи інших. Обидва потужні й обидва мають один режим відмови: **розповзання в бізнес-логіку.** Gateway чи BFF, що накопичує доменні правила, стає спільним монолітом, навколо якого мусить координуватися й деплоїтися кожна команда; тримай їх на edge-турботах і композиції, а домен хай володіють сервіси.',
          },
        },
        {
          kind: 'figure',
          fig: 'gateway-topology',
          caption: {
            en: 'Clients enter through one gateway that owns the edge concerns (TLS, authn, rate-limit, routing, trace injection); per-client BFFs tailor the shape; internal services (REST, gRPC, GraphQL) do the work. One traceparent — the same trace id — threads every hop from edge to the last service.',
            uk: 'Клієнти входять крізь один gateway, що володіє edge-турботами (TLS, authn, rate-limit, маршрутизація, інʼєкція trace); BFF на клієнта шиють форму; внутрішні сервіси (REST, gRPC, GraphQL) роблять роботу. Один traceparent — той самий trace id — прошиває кожен хоп від edge до останнього сервісу.',
          },
        },
      ],
    },
    // ── T4 · Schema registries ────────────────────────────────────────────────
    {
      id: 'schema-registries',
      title: { en: 'Schema registries', uk: 'Schema registries' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'In an event-driven system the producer and consumer never meet — the broker decouples them in time (m16) — so the question "what does this message look like?" has no synchronous answer to fall back on. A **schema registry** is the shared source of truth that fills the gap: producers **register** the message schema (Avro, Protobuf, or JSON Schema), each message carries a small **schema id**, and consumers fetch the schema by id to decode. Its real payoff is not storage but **enforced compatibility**: when a producer tries to register a new version, the registry checks it against a **compatibility mode** and *rejects the publish* if it would break existing readers — **BACKWARD** (new consumers can read data written under the old schema), **FORWARD** (old consumers can read data written under the new one), or **FULL** (both). That is exactly m18\'s evolution taxonomy, but moved from a documented hope to a gate that fires at publish time. Confluent Schema Registry is the canonical implementation in the Kafka ecosystem. For request/response styles the analogue is a central catalog of **OpenAPI/AsyncAPI** documents — the same idea, a discoverable and validated contract, minus the per-message id.',
            uk: 'У event-driven системі producer і consumer ніколи не зустрічаються — broker розчіплює їх у часі (m16) — тож питання «як виглядає це повідомлення?» не має синхронної відповіді, на яку можна спертися. **Schema registry** — спільне джерело істини, що заповнює прогалину: producer-и **реєструють** схему повідомлення (Avro, Protobuf чи JSON Schema), кожне повідомлення несе маленький **schema id**, а consumer-и фетчать схему за id, щоб декодувати. Справжній зиск — не сховище, а **забезпечена сумісність**: коли producer пробує зареєструвати нову версію, registry перевіряє її проти **compatibility mode** й *відхиляє публікацію*, якщо вона зламала б наявних читачів — **BACKWARD** (нові consumer-и читають дані, писані під старою схемою), **FORWARD** (старі consumer-и читають дані під новою) чи **FULL** (обидва). Це рівно таксономія еволюції з m18, але зсунута з задокументованого сподівання до gate, що спрацьовує на публікації. Confluent Schema Registry — канонічна реалізація в екосистемі Kafka. Для request/response стилів аналог — центральний каталог **OpenAPI/AsyncAPI**-документів: та сама ідея, знаходжуваний і валідований контракт, мінус id на повідомлення.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'A registry is m18\'s evolution rules, enforced', uk: 'Registry — це правила еволюції m18, забезпечені' },
          md: {
            en: 'The compatibility mode is the same choice m18 frames as breaking vs non-breaking, made operational. Pick BACKWARD (the common default) and you have promised that a consumer on the new schema can always read data written under the old one — so an added field must carry a default, and the registry *refuses* a change that would strand existing data (an added required field, an incompatible type change) instead of letting it reach the topic. Choose the mode per topic deliberately: it encodes who must upgrade first — with BACKWARD, the consumers.',
            uk: 'Compatibility mode — це той самий вибір, що m18 подає як breaking проти non-breaking, зроблений операційним. Обери BACKWARD (поширений дефолт) — і ти пообіцяв, що consumer на новій схемі завжди прочитає дані, писані під старою, тож додане поле мусить нести default, а registry *відмовляє* зміні, що лишила б наявні дані непрочитними (додане обовʼязкове поле, несумісна зміна типу), замість пускати її в топік. Обирай mode на топік свідомо: він кодує, хто мусить оновитися першим — за BACKWARD це consumer-и.',
          },
        },
      ],
    },
    // ── T5 · Contract testing ─────────────────────────────────────────────────
    {
      id: 'contract-testing',
      title: { en: 'Contract testing', uk: 'Contract testing' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Integration tests that spin up every collaborating service to check one interaction are slow, flaky, and scale badly; **contract testing** replaces most of them with a faster, sharper guarantee. In **consumer-driven contract testing** — **Pact** is the canonical tool, introduced in m18 — each consumer declares, as executable expectations, the exact requests it makes and the responses it needs; those expectations are collected into a **contract** that the provider must **verify against its own build**. Two things fall out. The provider gains a precise map of *which parts of its surface are actually depended on* (so it can change the untouched rest freely), and a change that would break a real consumer **fails the provider\'s CI instead of production** — the whole point. **Bidirectional contract testing** (PactFlow) loosens the coupling: the provider\'s **OpenAPI** spec is checked against each consumer\'s contract without both sides sharing a live broker, which lowers the adoption cost for large orgs (message/AsyncAPI support is still maturing as of 2026). Paired with a schema registry for events, this is the *runtime* enforcement of the evolution promises m18 only describes.',
            uk: 'Інтеграційні тести, що піднімають кожен сервіс-колаборатор заради однієї взаємодії, повільні, флейкі й погано масштабуються; **contract testing** замінює більшість із них швидшою, гострішою гарантією. У **consumer-driven contract testing** — **Pact** канонічний інструмент, введений у m18 — кожен consumer декларує, як виконувані очікування, точні запити, які робить, і відповіді, які потребує; ці очікування збираються в **контракт**, який provider мусить **верифікувати проти власного білду**. З цього випливає двоє. Provider отримує точну мапу того, *від яких частин його поверхні реально залежать* (тож може вільно міняти незаймане решту), а зміна, що зламала б реального consumer-а, **валить CI provider-а, а не продакшн** — у цьому вся суть. **Bidirectional contract testing** (PactFlow) послаблює звʼязність: **OpenAPI**-специфікація provider-а перевіряється проти контракту кожного consumer-а без спільного живого broker-а, що знижує вартість впровадження для великих організацій (підтримка message/AsyncAPI ще дозріває станом на 2026). У парі зі schema registry для подій це *рантайм*-забезпечення обіцянок еволюції, які m18 лише описує.',
          },
        },
        {
          kind: 'compare',
          a: { en: 'Consumer-driven (Pact)', uk: 'Consumer-driven (Pact)' },
          b: { en: 'Spec/registry-driven', uk: 'Spec/registry-driven' },
          rows: [
            [
              { en: 'Source of truth', uk: 'Джерело істини' },
              { en: 'What consumers actually call', uk: 'Що consumer-и реально викликають' },
              { en: 'The published OpenAPI / schema', uk: 'Опублікована OpenAPI / схема' },
            ],
            [
              { en: 'Catches', uk: 'Ловить' },
              { en: 'Provider breaking a real dependency', uk: 'Provider ламає реальну залежність' },
              { en: 'Any change against the declared contract', uk: 'Будь-яку зміну проти оголошеного контракту' },
            ],
            [
              { en: 'Best for', uk: 'Найкраще для' },
              { en: 'Known internal consumers', uk: 'Відомих внутрішніх consumer-ів' },
              { en: 'Open/unknown consumers, events (m16)', uk: 'Відкритих/невідомих consumer-ів, події (m16)' },
            ],
          ],
        },
      ],
    },
    // ── T6 · Versioned docs & the verdict ─────────────────────────────────────
    {
      id: 'versioned-docs-openapi',
      title: { en: 'Versioned docs & the verdict', uk: 'Версійовані доки і вердикт' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Documentation is a **contract**, not a courtesy, and the way to stop it drifting from reality is to make it the *source* the reality is generated from. **OpenAPI** is the standard machine-readable description for HTTP APIs — **3.2.0** (September 2025) is current, adding structured tags, first-class **streaming** media types, and the ability to document arbitrary/additional HTTP methods, all building on 3.1\'s alignment with **JSON Schema 2020-12**; **AsyncAPI** does the same job for event-driven and message APIs. From one spec you generate client **SDKs**, server **stubs**, **mock** servers, request **validation**, and an interactive **try-it** console — so the docs, the validation, and the code physically cannot drift when they share a single source. Treat the spec as a reviewed artifact: version it alongside the API (m18), publish per-version docs, and diff it in pull requests so a breaking change is visible before it ships.',
            uk: 'Документація — це **контракт**, не люб\'язність, і спосіб не дати їй розійтися з реальністю — зробити її *джерелом*, з якого реальність генерується. **OpenAPI** — стандартний машиночитний опис для HTTP API — актуальна **3.2.0** (вересень 2025), що додає структуровані теги, першокласні **streaming** media types й можливість документувати довільні/додаткові HTTP-методи, усе на основі узгодження 3.1 із **JSON Schema 2020-12**; **AsyncAPI** робить те саме для event-driven і message API. З однієї специфікації ти генеруєш клієнтські **SDK**, серверні **stub-и**, **mock**-сервери, **валідацію** запитів й інтерактивну **try-it** консоль — тож доки, валідація й код фізично не можуть розійтися, коли ділять єдине джерело. Сприймай специфікацію як рецензований артефакт: версіонуй її поряд з API (m18), публікуй доки на версію й диф\' її в pull request-ах, щоб breaking change був видимий до відвантаження.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: '**Use / avoid.** Instrument **all three signals** — metrics to detect, traces to localize, logs to explain — and link them by a trace id. Adopt **OpenTelemetry + W3C Trace Context** so one `trace_id` crosses every hop and you are not locked to a vendor; make propagation unbroken. Put an **API gateway** at the edge for TLS/authn/rate-limit/routing/trace injection, and a **BFF per client** when web, mobile, and partner needs genuinely diverge — keeping both free of domain logic. Use a **schema registry with an enforced compatibility mode** for brokered events and **OpenAPI/AsyncAPI** for request/response. Enforce evolution with **consumer-driven contract tests** so breaks fail CI, not production. **Generate docs, SDKs, and validation from one versioned spec.** Avoid: high-cardinality metric labels; logs with no trace id to correlate; a gateway or BFF that grows business logic into a shared monolith; publishing a schema change with no compatibility check; hand-written docs that drift; and treating observability as something you bolt on *after* the incident rather than the instrument that would have shortened it.',
            uk: '**Використовуй / уникай.** Інструментуй **усі три сигнали** — metrics щоб виявити, traces щоб локалізувати, logs щоб пояснити — і лінкуй їх trace id. Прийми **OpenTelemetry + W3C Trace Context**, щоб один `trace_id` перетинав кожен хоп і ти не був прив\'язаний до вендора; зроби пропагацію безперервною. Постав **API gateway** на edge для TLS/authn/rate-limit/маршрутизації/інʼєкції trace й **BFF на клієнта**, коли потреби web, mobile й partner справді розходяться — тримаючи обидва вільними від доменної логіки. Вживай **schema registry із забезпеченим compatibility mode** для брокерних подій і **OpenAPI/AsyncAPI** для request/response. Забезпечуй еволюцію **consumer-driven contract-тестами**, щоб зломи валили CI, а не продакшн. **Генеруй доки, SDK й валідацію з однієї версійованої специфікації.** Уникай: high-cardinality лейблів у метриках; логів без trace id для кореляції; gateway чи BFF, що вирощує бізнес-логіку в спільний моноліт; публікації зміни схеми без перевірки сумісності; рукописних доків, що дрейфують; і ставлення до observability як до того, що прикручують *після* інциденту, а не як до інструмента, що його скоротив би.',
          },
        },
      ],
    },
  ],
  keyPoints: [
    {
      en: 'Three signals, three jobs: **metrics** detect (rate/errors/latency), **traces** localize (the request\'s path across services), **logs** explain (the event with context). You need all three, linked by a trace id.',
      uk: 'Три сигнали, три задачі: **metrics** виявляють (rate/errors/latency), **traces** локалізують (шлях запиту крізь сервіси), **logs** пояснюють (подія з контекстом). Треба всі три, злінковані trace id.',
    },
    {
      en: '**OpenTelemetry** is the vendor-neutral standard (SDKs + OTLP; traces/metrics/logs GA). **W3C Trace Context**\'s `traceparent` header (`version-trace_id-span_id-flags`) carries one `trace_id` across every hop and style — no hop may drop it.',
      uk: '**OpenTelemetry** — вендор-нейтральний стандарт (SDK + OTLP; traces/metrics/logs GA). Заголовок `traceparent` (`version-trace_id-span_id-flags`) із **W3C Trace Context** несе один `trace_id` крізь кожен хоп і стиль — жоден хоп не сміє його загубити.',
    },
    {
      en: 'An **API gateway** centralizes edge concerns (TLS, authn, rate-limit, routing, trace injection); a **BFF** gives each client a tailored backend. Keep both free of business logic or they become a shared monolith.',
      uk: '**API gateway** централізує edge-турботи (TLS, authn, rate-limit, маршрутизація, інʼєкція trace); **BFF** дає кожному клієнту пошитий бекенд. Тримай обидва без бізнес-логіки, бо стануть спільним монолітом.',
    },
    {
      en: 'A **schema registry** (Avro/Protobuf/JSON Schema) enforces a **compatibility mode** (backward/forward/full) at publish time — m18\'s evolution rules made a gate, not a hope. OpenAPI/AsyncAPI is the request/response analogue.',
      uk: '**Schema registry** (Avro/Protobuf/JSON Schema) забезпечує **compatibility mode** (backward/forward/full) на публікації — правила еволюції m18 як gate, не сподівання. OpenAPI/AsyncAPI — request/response аналог.',
    },
    {
      en: '**Consumer-driven contract testing** (Pact) makes a breaking change fail the provider\'s CI, not production; bidirectional (PactFlow) checks the provider\'s OpenAPI against consumer contracts — the runtime enforcement of m18\'s promises.',
      uk: '**Consumer-driven contract testing** (Pact) робить так, що breaking change валить CI provider-а, а не продакшн; bidirectional (PactFlow) звіряє OpenAPI provider-а з контрактами consumer-ів — рантайм-забезпечення обіцянок m18.',
    },
    {
      en: 'Docs are a contract: one versioned **OpenAPI 3.2 / AsyncAPI** spec generates SDKs, stubs, mocks, validation, and try-it docs so they cannot drift. Version the spec with the API and diff it in PRs.',
      uk: 'Доки — це контракт: одна версійована **OpenAPI 3.2 / AsyncAPI** генерує SDK, stub-и, mock-и, валідацію й try-it доки, щоб вони не розійшлися. Версіонуй специфікацію з API й диф\' її в PR.',
    },
  ],
  pitfalls: [
    {
      title: { en: 'High-cardinality metric labels', uk: 'High-cardinality лейбли метрик' },
      body: {
        en: 'A metric is one time series per unique label combination, so labelling by `user_id`, request id, or full URL path spawns a series per value and can overwhelm — even topple — the metrics backend, while the bill climbs with it. Identifiers belong in traces and logs, where they are cheap; keep metric labels to a small, bounded set (route template, status class, region).',
        uk: 'Метрика — це один часовий ряд на унікальну комбінацію лейблів, тож лейблування за `user_id`, request id чи повним URL породжує ряд на значення й може перевантажити — ба повалити — бекенд метрик, а рахунок росте разом. Ідентифікатори належать у traces й logs, де вони дешеві; тримай лейбли метрик у малому обмеженому наборі (шаблон маршруту, клас статусу, регіон).',
      },
    },
    {
      title: { en: 'Logs you cannot correlate', uk: 'Логи, які не скорелюєш' },
      body: {
        en: 'Millions of well-formatted log lines with no trace id are still just a haystack: you can see that a service errored but never follow one request across the services it touched. Emit the trace id (and ideally the span id) on every log line, so a slow trace links straight to the exact log entries that explain it — the pivot that turns three signals into one investigation.',
        uk: 'Мільйони гарно відформатованих рядків лога без trace id — усе ще копиця сіна: бачиш, що сервіс помилився, але не простежиш один запит крізь сервіси, яких він торкнувся. Емить trace id (та ідеально span id) на кожному рядку лога, щоб повільний trace лінкувався прямо до конкретних записів, що його пояснюють, — перехід, що робить із трьох сигналів одне розслідування.',
      },
    },
    {
      title: { en: 'The gateway that ate the system', uk: 'Gateway, що зʼїв систему' },
      body: {
        en: 'A gateway or BFF is meant for edge concerns and composition, but it is a magnet for "just put the logic here." Once it holds domain rules, every team\'s change funnels through one component, deploys couple, and the shared front door becomes the bottleneck it was supposed to remove. Draw a hard line: routing, auth, limits, telemetry, and shaping live at the edge; business rules live in the services.',
        uk: 'Gateway чи BFF призначені для edge-турбот і композиції, але вони магніт для «просто поклади логіку сюди». Щойно він тримає доменні правила, зміна кожної команди тече крізь один компонент, деплої зчіплюються, а спільні парадні двері стають вузьким місцем, яке мали прибрати. Проведи тверду межу: маршрутизація, auth, ліміти, телеметрія й формування живуть на edge; бізнес-правила живуть у сервісах.',
      },
    },
  ],
  interview: [
    {
      q: {
        en: 'A user reports checkout took 8 seconds. You have logs, metrics, and traces across a gateway and several services. Walk me through how you localize the cause — and what each signal contributes.',
        uk: 'Користувач повідомляє, що checkout зайняв 8 секунд. У тебе є logs, metrics і traces через gateway й кілька сервісів. Проведи мене, як локалізуєш причину — і що дає кожен сигнал.',
      },
      a: {
        en: 'Start with metrics to confirm and scope: is checkout p99 elevated broadly or for one region/route, and which service dashboard shows the matching latency or error spike — that tells me *that* it is real and roughly where to look. Then pull a trace for an actual slow checkout (found by the trace id, or by filtering traces on high duration): the span waterfall shows the request crossing gateway → orders → payments → inventory, and one span — say payments — holding six of the eight seconds. That is the *where*. Finally I take that trace id into the logs of the payments service and read the lines for that exact request: a slow downstream call, a lock wait, a retry storm (m21) — the *why*. The through-line is that no single signal suffices; the trace id is what lets me pivot from a spiking dashboard to the one request to the explaining log line. The senior caveat: this only works if `traceparent` propagated unbroken — a service that dropped the header would leave a hole in the waterfall exactly where I need to look, which is itself the finding.',
        uk: 'Почни з metrics, щоб підтвердити й окреслити: p99 checkout піднятий широко чи для одного регіону/маршруту, і чий дашборд сервісу показує відповідний сплеск latency чи error — це каже, *що* воно реальне й приблизно де дивитися. Тоді витягни trace реального повільного checkout (за trace id чи фільтром trace-ів на високу тривалість): водоспад span-ів показує запит крізь gateway → orders → payments → inventory, і один span — скажімо payments — тримає шість із восьми секунд. Це *де*. Нарешті беру той trace id у логи сервісу payments і читаю рядки саме цього запиту: повільний downstream-виклик, очікування локу, retry storm (m21) — *чому*. Наскрізна думка: жоден окремий сигнал не достатній; trace id — це те, що дає перейти від дашборда, що стрибає, до одного запиту й до пояснювального рядка лога. Senior-застереження: це працює лише якщо `traceparent` пропагувався безперервно — сервіс, що загубив заголовок, лишив би дірку у водоспаді саме там, де треба дивитися, що само по собі є знахідкою.',
      },
      level: 'senior',
    },
    {
      q: {
        en: 'Your org has 40 services and nearly every cross-team API change causes an incident. What would you put in place, and why would it help?',
        uk: 'У твоїй організації 40 сервісів і майже кожна міжкомандна зміна API спричиняє інцидент. Що б ти впровадив і чому це допоможе?',
      },
      a: {
        en: 'The pattern behind the incidents is that breaking changes are discovered in production, so the fix is to move discovery left and make the contract enforceable. Concretely: publish a versioned OpenAPI (and AsyncAPI for events) spec per service into a central catalog, so contracts are discoverable and diffable in PRs; add a schema registry with an enforced compatibility mode for the event topics, so an incompatible producer schema is rejected at publish instead of at 2 a.m.; and add consumer-driven contract tests (Pact) so a provider change that would break a real consumer fails the provider\'s CI. Put a gateway at the edge so auth, limits, and — critically — trace injection are uniform, and run OpenTelemetry tracing everywhere so when something does slip through, one trace localizes it fast. The theme is a two-part shift: move breakage from production into CI (registry + contract tests + spec diffs), and when something still escapes, make the trace id the thread that ties detection to diagnosis. I would also stage rollout — start the registry in a warn-only mode to surface how much is already incompatible before turning it into a hard gate.',
        uk: 'Патерн за інцидентами в тому, що breaking changes виявляються в продакшні, тож фікс — зсунути виявлення вліво й зробити контракт забезпечуваним. Конкретно: публікуй версійовану OpenAPI (й AsyncAPI для подій) специфікацію на сервіс у центральний каталог, щоб контракти були знаходжувані й диф\'абельні в PR; додай schema registry із забезпеченим compatibility mode для топіків подій, щоб несумісна схема producer-а відхилялась на публікації, а не о 2-й ночі; і додай consumer-driven contract-тести (Pact), щоб зміна provider-а, що зламала б реального consumer-а, валила CI provider-а. Постав gateway на edge, щоб auth, ліміти й — критично — інʼєкція trace були уніфіковані, і ганяй OpenTelemetry-трейсинг усюди, щоб коли щось таки прослизне, один trace швидко його локалізував. Тема — двочастинний зсув: перенеси зломи з продакшну в CI (registry + contract-тести + diff специфікацій), а коли щось усе ж утече — зроби trace id ниткою, що звʼязує виявлення з діагностикою. Я б також етапував викатку — запустив registry в режимі лише-попередження, щоб виявити, скільки вже несумісного, до перетворення його на тверду перепону.',
      },
      level: 'staff',
    },
  ],
  seeAlso: ['m16-async-messaging', 'm17-auth-identity', 'm18-versioning', 'm20-pagination-limits', 'm22-security-threats'],
  sources: [
    { title: 'OpenTelemetry — Status (signals & spec maturity)', url: 'https://opentelemetry.io/status/' },
    { title: 'W3C Trace Context (traceparent / tracestate)', url: 'https://www.w3.org/TR/trace-context/' },
    { title: 'W3C Trace Context Level 2', url: 'https://www.w3.org/TR/trace-context-2/' },
    { title: 'OpenAPI Specification v3.2.0', url: 'https://spec.openapis.org/oas/v3.2.0.html' },
    { title: 'AsyncAPI Specification', url: 'https://www.asyncapi.com/docs/reference/specification/latest' },
    { title: 'Confluent — Schema Registry compatibility & data contracts', url: 'https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html' },
    { title: 'Pact — Consumer-driven contract testing', url: 'https://docs.pact.io/' },
    { title: 'PactFlow — Bi-Directional Contract Testing', url: 'https://docs.pactflow.io/docs/bi-directional-contract-testing' },
    { title: 'Sam Newman — Backends For Frontends', url: 'https://samnewman.io/patterns/architectural/bff/' },
  ],
};
