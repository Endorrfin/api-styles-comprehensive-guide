import type { Module } from '../types';

/*
 * m24-decision-framework — The decision framework (s5-choosing, order 1). The whole guide folded into
 * a method: decide per BOUNDARY, not per system; eliminate by conversation shape → reach → contract →
 * payload; price the exit, not just the entry. Signature sim `style-picker` (five plain-language
 * questions → ranked verdict with named reasons; also the #/decide page). Six curriculum topics:
 * the-decision-tree (sim) → the-trade-off-matrix → anti-patterns → migration-paths →
 * polyglot-apis-in-one-system → cost-of-change (verdict). Level: staff (the synthesis module).
 *
 * Facts web-verified S13a (2026-07):
 *  - Shopify: REST Admin API marked LEGACY 2024-10-01; from 2025-04-01 new public apps submitted to
 *    the App Store must use the GraphQL Admin API; existing apps keep working (shopify.dev
 *    changelog + "All-in on GraphQL" partners post).
 *  - GitHub: REST and GraphQL both first-class, officially "use the API that best aligns with your
 *    needs"; global Node IDs bridge the two (docs.github.com REST-vs-GraphQL comparison).
 *  - Netflix: federated GraphQL supergraph — gateway stood up with the existing monolith as the FIRST
 *    subgraph, then domains extracted incrementally (Netflix TechBlog "How Netflix Scales its API with
 *    GraphQL Federation"; Studio Edge ~150 subgraphs per later talks).
 *  - Google AIP-127: gRPC↔HTTP transcoding via `google.api.http` annotations — one .proto serves both
 *    a gRPC and a REST surface (google.aip.dev/127; Cloud Endpoints/Envoy/grpc-gateway implement it).
 *  - Stripe: public API "organized around REST" (docs.stripe.com/api); GraphQL used internally, not
 *    exposed publicly.
 *  - Strangler Fig = Fowler's incremental-replacement pattern (martinfowler.com/bliki/StranglerFigApplication).
 */
export const m24: Module = {
  id: 'm24-decision-framework',
  num: 24,
  section: 's5-choosing',
  order: 1,
  level: 'staff',
  signature: true,
  title: { en: 'The decision framework', uk: 'Фреймворк рішення' },
  tagline: { en: 'Pick a style per boundary — and defend it.', uk: 'Обери стиль під boundary — і захисти вибір.' },
  readMins: 16,
  mentalModel: {
    en: 'There is no best style, only a best fit per boundary: latency, payload, streaming, reach, and coupling decide.',
    uk: 'Немає найкращого стилю, є найкращий fit під boundary: latency, payload, streaming, reach і coupling вирішують.',
  },
  topics: [
    // ── T1 · The decision tree (sim) ──────────────────────────────────────────
    {
      id: 'the-decision-tree',
      title: { en: 'The decision tree', uk: 'Дерево рішення' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The first move is to notice that **"which API style should we use?" is a malformed question** — a system doesn\'t have *an* API, it has **boundaries**, and each boundary has its own physics. The public edge your partners integrate against, the chatter between your services, the live feed into your UI, and the callback you owe another vendor are four different problems; forcing one answer onto all four is how you end up polling REST for "now" or handing `.proto` files to strangers. So the framework decides **per boundary**, and it asks the questions in *elimination order* — each answer prunes whole families before the next runs: **(1) Conversation shape** — ask-and-answer? one-way feed? two-way session? a server-to-server notification? decoupled events? This is m2\'s flow/direction/initiative axes wearing product clothes, and it cuts the landscape into Sections I–III before you\'ve named a technology. **(2) Reach** — must it pass browsers, corporate proxies and CDNs *as-is*? This eliminates transports (native gRPC needs an HTTP/2-trailers path the browser won\'t give it — m10; WebSocket upgrades die in middleboxes SSE walks through — m12/m13). **(3) Contract discipline** — who can carry a shared IDL? A TS type is a contract only inside one repo (m11); a `.proto` is a contract only where both teams build from it (m10); strangers get self-describing JSON (m5). **(4) Payload** — fixed documents, client-shaped views (m9), binary/media, or high-frequency ticks. Only after all four does "REST vs GraphQL vs gRPC" even become a well-posed question — and usually by then it has answered itself.',
            uk: 'Перший хід — помітити, що **«який API-стиль нам взяти?» — некоректно поставлене питання**: система не має *одного* API, вона має **boundaries**, і кожна — зі своєю фізикою. Публічний край, проти якого інтегруються партнери, балачка між твоїми сервісами, живий потік у твій UI і callback, який ти винен іншому вендору, — чотири різні задачі; втискання однієї відповіді в усі чотири — це шлях до polling-у REST заради «зараз» або роздачі `.proto`-файлів незнайомцям. Тож фреймворк вирішує **per boundary** і ставить питання в *порядку елімінації* — кожна відповідь зрізає цілі родини до наступного кроку: **(1) Форма розмови** — запитав-відповів? односторонній потік? двостороння сесія? server-to-server сповіщення? розчеплені події? Це осі flow/direction/initiative з m2 у продуктовому одязі, і вони розрізають landscape на Секції I–III ще до назви технології. **(2) Охоплення** — чи мусить проходити браузери, корпоративні проксі та CDN *як є*? Це елімінує транспорти (нативному gRPC потрібен шлях з HTTP/2 trailers, якого браузер не дасть — m10; WebSocket upgrade гине в middlebox-ах, крізь які SSE проходить — m12/m13). **(3) Контрактна дисципліна** — хто потягне спільний IDL? TS-тип — контракт лише всередині одного repo (m11); `.proto` — контракт лише там, де обидві команди з нього збираються (m10); незнайомці отримують self-describing JSON (m5). **(4) Payload** — фіксовані документи, client-shaped views (m9), binary/медіа чи високочастотні тіки. Лише після всіх чотирьох «REST чи GraphQL чи gRPC» стає коректно поставленим питанням — і зазвичай на той момент воно вже відповіло само собі.',
          },
        },
        {
          kind: 'sim',
          sim: 'style-picker',
          caption: {
            en: 'The decision tree, executable: five boundary questions, a live ranking, and — the part that matters — the named reasons. A −40 on gRPC for browser reach or a −50 on tRPC for public callers is an argument you can check against m10/m11, not an oracle. The same picker lives on the Decide page.',
            uk: 'Дерево рішення, яке можна виконати: п\'ять питань про boundary, живе ранжування і — головне — названі причини. −40 для gRPC за browser reach чи −50 для tRPC за публічних викликачів — це аргумент, який можна перевірити проти m10/m11, а не оракул. Той самий picker живе на сторінці Decide.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'The score is a claim, not a verdict', uk: 'Score — це теза, а не вирок' },
          md: {
            en: 'Any scoring model — this one included — compresses judgment into weights someone chose. Use the picker the way staff engineers use every framework: as a *checklist of considerations you must answer*, not as an authority to defer to. If your boundary ranks REST first and you still pick gRPC, that\'s allowed — provided the sentence "because these two teams share a build and the payload is binary telemetry at 50 Hz" comes out of your mouth. If no such sentence exists, the picker just saved you a migration.',
            uk: 'Будь-яка scoring-модель — і ця теж — стискає судження у ваги, які хтось обрав. Користуйся picker-ом так, як staff-інженери користуються будь-яким фреймворком: як *чеклистом міркувань, на які мусиш відповісти*, а не як авторитетом для делегування. Якщо твій boundary ранжує REST першим, а ти все одно береш gRPC — можна, за умови що з твоїх вуст виходить речення «бо ці дві команди ділять build, а payload — це binary-телеметрія на 50 Гц». Якщо такого речення нема — picker щойно зекономив тобі міграцію.',
          },
        },
      ],
    },
    // ── T2 · The trade-off matrix ─────────────────────────────────────────────
    {
      id: 'the-trade-off-matrix',
      title: { en: 'The trade-off matrix', uk: 'Матриця trade-off-ів' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The tree picks a direction; the matrix is how you *defend* it in review. Every cell below is a claim defended at length in the style\'s own module — this table is the guide\'s index, compressed. Read it by **columns, not rows**: first decide which column your product actually bleeds on (a public API bleeds on reach and cacheability; an internal mesh bleeds on type safety and payload cost; a trading feed bleeds on push latency), then let that column pick the row. Reading by rows — "which style is best overall?" — recreates the malformed question T1 just dismantled.',
            uk: 'Дерево обирає напрям; матриця — те, чим ти *захищаєш* його на review. Кожна клітинка нижче — теза, розгорнуто захищена у модулі свого стилю: ця таблиця — стиснутий індекс гайду. Читай її **колонками, а не рядками**: спершу виріши, на якій колонці твій продукт справді стікає кров\'ю (публічний API — на охопленні й кешованості; внутрішній mesh — на type safety і вартості payload; трейдинговий потік — на latency push-у), і дай цій колонці обрати рядок. Читання рядками — «який стиль найкращий загалом?» — відтворює некоректне питання, яке T1 щойно розібрав.',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Style', uk: 'Стиль' },
            { en: 'HTTP caching / CDN', uk: 'HTTP-кешування / CDN' },
            { en: 'Browser reach', uk: 'Охоплення браузерів' },
            { en: 'Contract & types', uk: 'Контракт і типи' },
            { en: 'Streaming / push', uk: 'Streaming / push' },
            { en: 'Wire efficiency', uk: 'Ефективність дроту' },
            { en: 'Debug with curl?', uk: 'Дебаг через curl?' },
          ],
          rows: [
            [
              { en: 'REST (m5)', uk: 'REST (m5)' },
              { en: 'Native — the killer feature', uk: 'Нативне — killer-фіча' },
              { en: 'Universal', uk: 'Універсальне' },
              { en: 'OpenAPI, opt-in', uk: 'OpenAPI, opt-in' },
              { en: 'None (poll or escalate)', uk: 'Нема (polling або ескалація)' },
              { en: 'Verbose JSON', uk: 'Багатослівний JSON' },
              { en: 'Perfectly', uk: 'Ідеально' },
            ],
            [
              { en: 'GraphQL (m9)', uk: 'GraphQL (m9)' },
              { en: 'Lost by default (one POST)', uk: 'Втрачене за замовчуванням (один POST)' },
              { en: 'Universal', uk: 'Універсальне' },
              { en: 'SDL — strong, introspectable', uk: 'SDL — сильний, introspectable' },
              { en: 'Subscriptions (extra infra)', uk: 'Subscriptions (додаткова інфра)' },
              { en: 'Exact fields, text wire', uk: 'Точні поля, текстовий дріт' },
              { en: 'Yes, awkwardly', uk: 'Так, незручно' },
            ],
            [
              { en: 'gRPC (m10)', uk: 'gRPC (m10)' },
              { en: 'None (POST-shaped, binary)', uk: 'Нема (POST-подібний, binary)' },
              { en: 'Proxy required (gRPC-Web)', uk: 'Потрібен proxy (gRPC-Web)' },
              { en: '.proto — compile-time, cross-language', uk: '.proto — compile-time, крос-мовний' },
              { en: 'All four call types, native', uk: 'Всі чотири типи викликів, нативно' },
              { en: 'Best in class (varint, HPACK)', uk: 'Найкраща в класі (varint, HPACK)' },
              { en: 'No — needs grpcurl', uk: 'Ні — потрібен grpcurl' },
            ],
            [
              { en: 'tRPC (m11)', uk: 'tRPC (m11)' },
              { en: 'Same as REST for GETs', uk: 'Як у REST для GET-ів' },
              { en: 'Universal (it is HTTP+JSON)', uk: 'Універсальне (це HTTP+JSON)' },
              { en: 'TS inference — zero drift, one repo only', uk: 'TS inference — нуль дрейфу, лише один repo' },
              { en: 'SSE subscriptions (v11)', uk: 'SSE subscriptions (v11)' },
              { en: 'JSON', uk: 'JSON' },
              { en: 'Yes', uk: 'Так' },
            ],
            [
              { en: 'WebSockets (m12)', uk: 'WebSockets (m12)' },
              { en: 'N/A (a pipe, not resources)', uk: 'N/A (труба, а не ресурси)' },
              { en: 'Good; upgrades fear middleboxes', uk: 'Добре; upgrade боїться middlebox-ів' },
              { en: 'None — you invent the protocol', uk: 'Нема — протокол вигадуєш сам' },
              { en: 'Full duplex, the ceiling', uk: 'Full duplex, стеля' },
              { en: 'Frames — bytes of overhead', uk: 'Фрейми — байти overhead-у' },
              { en: 'No (wscat et al.)', uk: 'Ні (wscat тощо)' },
            ],
            [
              { en: 'SSE (m13)', uk: 'SSE (m13)' },
              { en: 'It IS an HTTP response', uk: 'Це і Є HTTP-відповідь' },
              { en: 'Survives proxies that break WS upgrades', uk: 'Переживає проксі, що ламають WS upgrade' },
              { en: 'None (text events)', uk: 'Нема (текстові події)' },
              { en: 'One-way push + auto-reconnect', uk: 'Односторонній push + auto-reconnect' },
              { en: 'Text only', uk: 'Лише текст' },
              { en: 'Yes — curl streams it', uk: 'Так — curl стрімить його' },
            ],
            [
              { en: 'Webhooks (m15)', uk: 'Webhooks (m15)' },
              { en: 'N/A (outbound calls)', uk: 'N/A (вихідні виклики)' },
              { en: 'N/A — receiver needs public HTTPS', uk: 'N/A — отримувачу треба публічний HTTPS' },
              { en: 'Per-provider event schemas', uk: 'Схеми подій per-provider' },
              { en: 'Push, async, at-least-once', uk: 'Push, async, at-least-once' },
              { en: 'JSON events', uk: 'JSON-події' },
              { en: 'Replay from provider logs', uk: 'Replay з логів провайдера' },
            ],
            [
              { en: 'Messaging (m16)', uk: 'Messaging (m16)' },
              { en: 'N/A (broker semantics)', uk: 'N/A (семантика broker-а)' },
              { en: 'Backend-only', uk: 'Лише backend' },
              { en: 'Schema registry if you add one', uk: 'Schema registry, якщо додаси' },
              { en: 'Fan-out, replay, consumer groups', uk: 'Fan-out, replay, consumer groups' },
              { en: 'Binary-friendly, batched', uk: 'Binary-friendly, батчований' },
              { en: 'No — broker tooling', uk: 'Ні — тулінг broker-а' },
            ],
          ],
          caption: {
            en: 'The eight workhorse styles across the columns decisions actually turn on. Every cell links back to a module\'s argument; if a cell surprises you, that module is your next read. (OData/SOAP/JSON-RPC are REST-row variants — m6–m8.)',
            uk: 'Вісім робочих стилів по колонках, на яких насправді обертаються рішення. Кожна клітинка веде до аргументу свого модуля; якщо клітинка дивує — той модуль і є твоє наступне читання. (OData/SOAP/JSON-RPC — варіанти REST-рядка, m6–m8.)',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'The column your product bleeds on', uk: 'Колонка, на якій стікає кров\'ю твій продукт' },
          md: {
            en: 'Teams argue rows because rows are identity ("we\'re a GraphQL shop"); products live in columns. A B2B integration platform bleeds on *contract* (partners break at 3 a.m.) — weight column four. A content site bleeds on *cache* — column one, and the CDN does 95% of your serving. A collaborative editor bleeds on *push*. Name the bleeding column out loud in the design review and half the style debate evaporates.',
            uk: 'Команди сперечаються про рядки, бо рядки — це ідентичність («ми GraphQL-shop»); продукти живуть у колонках. B2B-платформа інтеграцій стікає кров\'ю на *контракті* (партнери ламаються о 3-й ночі) — надай вагу колонці чотири. Контентний сайт — на *кеші*: колонка один, і CDN робить 95% твого serving-у. Колаборативний редактор — на *push*. Назви колонку кровотечі вголос на design review — і половина дебатів про стилі випарується.',
          },
        },
      ],
    },
    // ── T3 · Anti-patterns ────────────────────────────────────────────────────
    {
      id: 'anti-patterns',
      title: { en: 'Anti-patterns', uk: 'Анти-патерни' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Style failures in the wild are rarely exotic — the same six mistakes account for most of the wreckage, and each is a decision made on the wrong axis: identity, fashion, or inertia instead of the boundary\'s properties. **Résumé-driven choice** — GraphQL because 2016\'s blog posts were exciting, gRPC because Google uses it; the tell is a technology named before a boundary property is. **One style everywhere** — the hammer: gRPC to browsers through three proxies, or REST between two services that exchange 40 typed calls; per-system uniformity purchased with per-boundary friction. **Polling for "now"** — a REST endpoint hammered every 2 s doing SSE\'s job: dozens of wasted GETs per actual update, every answer already stale on arrival (the boundary m13 and m15 both draw). **Kafka for two services** — a replicated, partitioned, retained log as a bus between exactly one producer and one consumer who could have shared an HTTP call; the broker\'s on-call bill arrives regardless (m16\'s verdict). **Public GraphQL without cost controls** — an unbounded query language handed to strangers; depth/complexity limits and persisted queries are day-one requirements, not hardening (m9, m22). **The 200-that-lies** — RPC-ish endpoints returning `200 {"success": false}`, which breaks every cache, retry policy, and monitor that speaks HTTP (m19); it usually signals a team fighting its own style instead of switching to the one it\'s imitating.',
            uk: 'Провали стилів у дикій природі рідко екзотичні — та сама шістка помилок відповідає за більшість уламків, і кожна — рішення не по тій осі: ідентичність, мода чи інерція замість властивостей boundary. **Résumé-driven вибір** — GraphQL, бо блог-пости 2016-го надихали, gRPC, бо ним користується Google; ознака — технологію названо раніше за властивість boundary. **Один стиль всюди** — молоток: gRPC у браузери крізь три proxy або REST між двома сервісами з 40 типізованими викликами; уніформність per-system, куплена тертям per-boundary. **Polling заради «зараз»** — REST-endpoint, яким гатять кожні 2 с, робить роботу SSE: десятки марних GET-ів на кожне справжнє оновлення, і кожна відповідь уже застаріла на момент прибуття (межа, яку проводять і m13, і m15). **Kafka для двох сервісів** — реплікований, партиційований, ретенційований лог як шина між рівно одним producer-ом і одним consumer-ом, яким вистачило б HTTP-виклику; рахунок за on-call broker-а прийде незалежно (вердикт m16). **Публічний GraphQL без контролю вартості** — необмежена мова запитів у руках незнайомців; ліміти depth/complexity і persisted queries — вимоги першого дня, а не зміцнення (m9, m22). **200-яка-бреше** — RPC-подібні endpoint-и, що повертають `200 {"success": false}`, ламаючи кожен кеш, retry-політику і монітор, які говорять HTTP (m19); зазвичай це знак команди, що бореться з власним стилем замість перейти на той, який імітує.',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Anti-pattern', uk: 'Анти-патерн' },
            { en: 'The tell', uk: 'Ознака' },
            { en: 'The fix', uk: 'Виправлення' },
          ],
          rows: [
            [
              { en: 'Résumé-driven choice', uk: 'Résumé-driven вибір' },
              { en: 'Technology named before the boundary is', uk: 'Технологію названо раніше за boundary' },
              { en: 'Run T1\'s tree; demand the one-sentence defence', uk: 'Прожени дерево T1; вимагай захист одним реченням' },
            ],
            [
              { en: 'One style everywhere', uk: 'Один стиль всюди' },
              { en: '"We\'re a <X> shop" closes the debate', uk: '«Ми — <X> shop» закриває дебати' },
              { en: 'Decide per boundary; polyglot is the norm (T5)', uk: 'Вирішуй per boundary; polyglot — норма (T5)' },
            ],
            [
              { en: 'Polling for "now"', uk: 'Polling заради «зараз»' },
              { en: 'Cron-shaped GETs, `interval: 2000`', uk: 'GET-и у формі cron, `interval: 2000`' },
              { en: 'SSE for feeds, webhooks between servers (m13/m15)', uk: 'SSE для потоків, webhooks між серверами (m13/m15)' },
            ],
            [
              { en: 'A broker for two services', uk: 'Broker для двох сервісів' },
              { en: 'One producer, one consumer, three Kafka brokers', uk: 'Один producer, один consumer, три Kafka-broker-и' },
              { en: 'An HTTP call — or a queue only once fan-out/replay is real (m16)', uk: 'HTTP-виклик — або черга, лише коли fan-out/replay реальні (m16)' },
            ],
            [
              { en: 'Public GraphQL, no cost limits', uk: 'Публічний GraphQL без лімітів вартості' },
              { en: 'Anonymous deep queries reach the resolvers', uk: 'Анонімні глибокі запити доходять до resolver-ів' },
              { en: 'Depth/complexity limits + persisted queries, day one (m9)', uk: 'Ліміти depth/complexity + persisted queries з першого дня (m9)' },
            ],
            [
              { en: 'The 200-that-lies', uk: '200-яка-бреше' },
              { en: '`200 {"success": false}`', uk: '`200 {"success": false}`' },
              { en: 'Real status codes + Problem Details (m19)', uk: 'Справжні статус-коди + Problem Details (m19)' },
            ],
          ],
          caption: {
            en: 'Six failure modes, one root cause: a decision made on identity or fashion instead of the boundary\'s properties.',
            uk: 'Шість режимів відмови, одна першопричина: рішення з ідентичності чи моди замість властивостей boundary.',
          },
        },
      ],
    },
    // ── T4 · Migration paths ──────────────────────────────────────────────────
    {
      id: 'migration-paths',
      title: { en: 'Migration paths', uk: 'Шляхи міграції' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Real style decisions are mostly *re*-decisions — there\'s an API in production and consumers you don\'t control. The only migration shape that survives contact with reality is the **strangler fig** (Fowler): stand the new interface up **beside** the old one, route consumers over gradually, and only then let the old one die — never a big-bang cutover, because a cutover requires every consumer to move in lockstep, and T6 will show you consumers are precisely the thing you don\'t control. The pattern has three production-verified variants. **Netflix (GraphQL monolith → federated supergraph):** the federated gateway went up with the *existing monolith as the first subgraph* — zero decomposition required on day one; domains were then extracted into their own subgraphs incrementally while clients kept querying one schema. The lesson: **the gateway is the fig; the monolith is the tree.** **Google (gRPC ↔ REST, both at once):** AIP-127 transcoding annotates each RPC with `google.api.http`, so *one* `.proto` serves a native gRPC surface *and* a generated REST surface (Cloud Endpoints, Envoy, grpc-gateway all implement it) — the migration bridge where internal callers move to gRPC while external ones keep plain HTTP indefinitely. **Shopify (REST → GraphQL, with teeth):** REST Admin API declared *legacy* October 2024; from **April 2025 new apps must use GraphQL** — but existing apps keep working, deprecations ride the API-version calendar, and the runway is measured in years. The lesson: even a company *betting the platform* on one style migrates additively, signals with deprecation machinery (m18\'s `Deprecation`/`Sunset` discipline), and moves the *ecosystem* by gating **new** integrations rather than breaking old ones.',
            uk: 'Справжні рішення про стиль — здебільшого *пере*-рішення: у production вже є API і споживачі, яких ти не контролюєш. Єдина форма міграції, що переживає контакт із реальністю, — **strangler fig** (Fowler): підніми новий інтерфейс **поруч** зі старим, переводь споживачів поступово, і лише тоді дай старому померти — ніколи big-bang, бо cutover вимагає, щоб усі споживачі рушили в ногу, а T6 покаже: споживачі — саме те, чого ти не контролюєш. У патерну три production-перевірені варіанти. **Netflix (GraphQL-моноліт → federated supergraph):** federated gateway піднявся з *наявним монолітом як першим subgraph-ом* — нуль декомпозиції в перший день; далі домени виносили у власні subgraph-и інкрементально, поки клієнти запитували одну schema. Урок: **gateway — це фікус-душитель; моноліт — дерево.** **Google (gRPC ↔ REST водночас):** транскодування AIP-127 анотує кожен RPC через `google.api.http`, тож *один* `.proto` обслуговує нативну gRPC-поверхню *і* згенеровану REST-поверхню (це реалізують Cloud Endpoints, Envoy, grpc-gateway) — міграційний міст, де внутрішні викликачі переходять на gRPC, а зовнішні лишаються на простому HTTP скільки завгодно. **Shopify (REST → GraphQL, із зубами):** REST Admin API оголошено *legacy* у жовтні 2024; з **квітня 2025 нові застосунки мусять використовувати GraphQL** — але наявні працюють далі, deprecation-и їдуть календарем API-версій, і розгінна смуга вимірюється роками. Урок: навіть компанія, що *ставить платформу* на один стиль, мігрує адитивно, сигналізує deprecation-машинерією (дисципліна `Deprecation`/`Sunset` з m18) і рухає *екосистему*, ставлячи ворота на **нові** інтеграції, а не ламаючи старі.',
          },
        },
        {
          kind: 'code',
          lang: 'protobuf',
          code: `// AIP-127: one contract, two wire surfaces — the gRPC↔REST migration bridge.
service ArticleService {
  rpc GetArticle(GetArticleRequest) returns (Article) {
    option (google.api.http) = {
      get: "/v1/articles/{article_id}"   // REST callers see a resource URL…
    };
  }
  rpc CreateArticle(CreateArticleRequest) returns (Article) {
    option (google.api.http) = {
      post: "/v1/articles"               // …while gRPC callers use the same RPCs natively.
      body: "article"
    };
  }
}`,
          note: {
            en: 'A gateway (Envoy\'s transcoder, grpc-gateway, Cloud Endpoints) reads these annotations and serves both surfaces from one implementation — so "REST or gRPC" becomes "REST *and* gRPC" for as long as the migration needs.',
            uk: 'Gateway (транскодер Envoy, grpc-gateway, Cloud Endpoints) читає ці анотації і обслуговує обидві поверхні з однієї імплементації — тож «REST чи gRPC» стає «REST *і* gRPC» на стільки, скільки триває міграція.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'Migrations are additive or they are outages', uk: 'Міграції адитивні — або вони є аваріями' },
          md: {
            en: 'The invariant across all three case studies: **at no point does an existing consumer\'s call stop working without a versioned, dated warning.** New surface first; consumers routed by choice or by gating *new* integrations; old surface sunset per m18 (announce → `Deprecation` header → `Sunset` date → remove). Budget the overlap window honestly — running both surfaces is the *cost* of the migration, not an inefficiency to optimize away; teams that collapse the window to save ops money are choosing an outage with extra steps.',
            uk: 'Інваріант усіх трьох кейсів: **у жодний момент виклик наявного споживача не перестає працювати без версіонованого, датованого попередження.** Спершу нова поверхня; споживачі переходять добровільно або через ворота на *нові* інтеграції; стара поверхня виводиться через sunset за m18 (оголошення → заголовок `Deprecation` → дата `Sunset` → видалення). Чесно бюджетуй вікно перекриття — утримання обох поверхонь є *ціною* міграції, а не неефективністю для оптимізації; команди, що стискають вікно заради економії ops, обирають аварію з додатковими кроками.',
          },
        },
      ],
    },
    // ── T5 · Polyglot APIs in one system ──────────────────────────────────────
    {
      id: 'polyglot-apis-in-one-system',
      title: { en: 'Polyglot APIs in one system', uk: 'Polyglot API в одній системі' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Follow the per-boundary rule to its conclusion and you get the layout every mature platform converges on: **several styles, one system, each at the boundary whose physics it fits.** GitHub runs REST *and* GraphQL as public peers — officially "use the API that best aligns with your needs" — with global Node IDs so integrators can cross between them mid-workflow. Stripe keeps the public edge REST (boring on purpose: cacheable, curl-able, OpenAPI-generatable SDKs for strangers in every language) while using GraphQL *internally* where its own dashboard team controls both sides of the query. Google\'s cloud surface is gRPC-first internally with a transcoded REST twin for reach (T4). The pattern generalizes into a reference layout: **REST (or GraphQL, if views genuinely vary) at the public edge** — reach, caching, self-service integration; **gRPC on the service mesh** — typed fan-in calls between teams that share a build; **events on the spine** (broker + outbox, m16/m21) — the facts of the business, decoupled in time; **webhooks at the partner edge out, SSE/WebSockets at the UI edge down** — push where push belongs. The glue that keeps a polyglot system *one* system is Section IV wearing an architecture hat: one identity model (m17) spanning styles, one error vocabulary (m19), one trace context through every hop (m23\'s `traceparent`), and the gateway/BFF layer (m23) as the seam where edge styles are stitched onto internal ones.',
            uk: 'Доведи правило per-boundary до кінця — і отримаєш розкладку, до якої сходиться кожна зріла платформа: **кілька стилів, одна система, кожен на boundary, чиїй фізиці він пасує.** GitHub тримає REST *і* GraphQL публічними рівнями — офіційно «використовуйте API, який найкраще відповідає вашим потребам» — з глобальними Node ID, щоб інтегратори переходили між ними посеред workflow. Stripe тримає публічний край на REST (нудно навмисно: кешовано, curl-абельно, OpenAPI-генеровані SDK для незнайомців будь-якою мовою), а GraphQL вживає *внутрішньо*, де його власна dashboard-команда контролює обидві сторони запиту. Хмарна поверхня Google — gRPC-first всередині з транскодованим REST-двійником для охоплення (T4). Патерн узагальнюється в еталонну розкладку: **REST (чи GraphQL, якщо views справді різняться) на публічному краї** — охоплення, кеш, self-service інтеграція; **gRPC на service mesh** — типізовані виклики fan-in між командами зі спільним build-ом; **події на хребті** (broker + outbox, m16/m21) — факти бізнесу, розчеплені в часі; **webhooks на партнерський край назовні, SSE/WebSockets на UI-край вниз** — push там, де він доречний. Клей, що тримає polyglot-систему *однією* системою, — це Секція IV в архітектурному капелюсі: одна модель ідентичності (m17) через стилі, один словник помилок (m19), один trace-контекст крізь кожен хоп (`traceparent` з m23) і шар gateway/BFF (m23) як шов, де крайові стилі пришиті до внутрішніх.',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Boundary', uk: 'Boundary' },
            { en: 'Style', uk: 'Стиль' },
            { en: 'The one-sentence defence', uk: 'Захист одним реченням' },
          ],
          rows: [
            [
              { en: 'Public edge (partners, 3rd parties)', uk: 'Публічний край (партнери, треті сторони)' },
              { en: 'REST + OpenAPI', uk: 'REST + OpenAPI' },
              { en: 'Strangers integrate against boring, cacheable, curl-able HTTP', uk: 'Незнайомці інтегруються проти нудного, кешованого, curl-абельного HTTP' },
            ],
            [
              { en: 'Own web/mobile clients with varied views', uk: 'Власні web/mobile клієнти з різними views' },
              { en: 'GraphQL (via BFF)', uk: 'GraphQL (через BFF)' },
              { en: 'Many screens shape one schema; you control both sides', uk: 'Багато екранів формують одну schema; ти контролюєш обидві сторони' },
            ],
            [
              { en: 'Service ↔ service, same org', uk: 'Сервіс ↔ сервіс, та сама організація' },
              { en: 'gRPC', uk: 'gRPC' },
              { en: 'Shared .proto turns cross-team breakage into compile errors', uk: 'Спільний .proto перетворює міжкомандні поломки на compile-помилки' },
            ],
            [
              { en: 'Business facts, many consumers', uk: 'Факти бізнесу, багато споживачів' },
              { en: 'Broker events (+outbox)', uk: 'Broker-події (+outbox)' },
              { en: 'Producers must not know their consumers; replay is required', uk: 'Producer-и не мусять знати споживачів; replay обов\'язковий' },
            ],
            [
              { en: 'Notify partners something happened', uk: 'Сповістити партнерів, що щось сталося' },
              { en: 'Webhooks', uk: 'Webhooks' },
              { en: 'Their server, our event — signed, retried, idempotent', uk: 'Їхній сервер, наша подія — підписана, з retry, idempotent' },
            ],
            [
              { en: 'Live UI (feed / collaboration)', uk: 'Живий UI (потік / колаборація)' },
              { en: 'SSE / WebSockets', uk: 'SSE / WebSockets' },
              { en: 'SSE for one-way now; WS only when clients talk back', uk: 'SSE для одностороннього «зараз»; WS лише коли клієнти відповідають' },
            ],
          ],
          caption: {
            en: 'A reference polyglot layout. Each row is one boundary, one style, and the sentence that survives a design review — the T1 discipline, applied system-wide.',
            uk: 'Еталонна polyglot-розкладка. Кожен рядок — один boundary, один стиль і речення, що переживає design review: дисципліна T1, застосована до всієї системи.',
          },
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'Top threat: the seams between styles', uk: 'Головна загроза: шви між стилями' },
          md: {
            en: 'A polyglot system\'s attack surface concentrates where styles meet: the gateway translating REST→gRPC must re-derive (never forward) authorization; an event consumed from the broker carries no ambient caller identity, so authenticate the *message*, not the pipe (m16); a webhook receiver is an unauthenticated public endpoint until signature verification says otherwise (m15). Every seam is a place where one style\'s security assumptions silently lapse in the other — walk m22\'s trust-boundary diagram once per seam.',
            uk: 'Поверхня атаки polyglot-системи концентрується там, де стилі стикаються: gateway, що транслює REST→gRPC, мусить повторно виводити (ніколи не форвардити) авторизацію; подія, спожита з broker-а, не несе ambient-ідентичності викликача — автентифікуй *повідомлення*, а не трубу (m16); webhook-приймач є неавтентифікованим публічним endpoint-ом, доки перевірка підпису не скаже інакше (m15). Кожен шов — місце, де security-припущення одного стилю тихо втрачають силу в іншому; пройди діаграму trust boundaries з m22 по разу на шов.',
          },
        },
      ],
    },
    // ── T6 · Cost of change + the verdict ─────────────────────────────────────
    {
      id: 'cost-of-change',
      title: { en: 'Cost of change & the verdict', uk: 'Ціна зміни і вердикт' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The tree and the matrix price the *entry*; staff-level decisions also price the **exit** — because T4 just showed that changing an API style is a multi-year, ecosystem-scale project, the true cost of a style is **consumers × contract tightness × wire assumptions**. That product ranks the styles on a **lock-in gradient**. *REST* is the cheapest to leave: the contract is conventions over plain HTTP, and half of any migration (caching, status codes, URLs) transfers. *GraphQL* is stickier than it looks — the schema is nominally just a contract, but client teams embed *queries* (their exact field selections) in shipped apps, and resolvers encode your data topology; unwinding both is why Shopify\'s move took a versioned calendar and years of runway. *gRPC* couples every consumer to codegen toolchains and `.proto` distribution — compile-time safety cuts both ways: the contract that catches breakage at build time is also compiled into every caller\'s binary. *tRPC* is the extreme: near-zero cost *inside* its TS monorepo and a full rewrite the day a consumer exists outside it (m11\'s boundary, restated as an exit bill). *Events* are the stickiest of all — a topic\'s schema is a contract with consumers **you don\'t know about**, retention means old events keep re-appearing through replays, and there is no deprecation header on a Kafka topic (m18\'s consumer-driven contracts are the only brake). The discipline this implies: **spend lock-in only where you\'ve already paid for it** — tight coupling is *fine* where teams share a build (you own both sides of the exit), and expensive precisely where you can\'t enumerate your consumers, which is why the public edge defaults to the loosest style that fits.',
            uk: 'Дерево і матриця оцінюють *вхід*; рішення staff-рівня оцінюють ще й **вихід** — бо T4 щойно показав: зміна API-стилю — багаторічний проєкт масштабу екосистеми, тож справжня ціна стилю — це **споживачі × тісність контракту × припущення щодо дроту**. Цей добуток ранжує стилі за **градієнтом lock-in-у**. *REST* найдешевше покинути: контракт — це конвенції над простим HTTP, і половина будь-якої міграції (кеш, статус-коди, URL-и) переноситься. *GraphQL* липкіший, ніж виглядає: schema номінально лише контракт, але клієнтські команди вшивають *запити* (свої точні вибірки полів) у відвантажені застосунки, а resolver-и кодують топологію твоїх даних; розплутування обох — ось чому хід Shopify потребував версіонованого календаря і років розгінної смуги. *gRPC* прив\'язує кожного споживача до codegen-тулчейнів і дистрибуції `.proto` — compile-time безпека ріже в обидва боки: контракт, що ловить поломку на build-і, також вкомпільований у бінарник кожного викликача. *tRPC* — крайність: майже нульова ціна *всередині* його TS-monorepo і повний rewrite у день, коли споживач з\'являється зовні (boundary з m11, переказаний як рахунок за вихід). *Події* — найлипкіші з усіх: schema топіка — контракт зі споживачами, **про яких ти не знаєш**, retention означає, що старі події повертаються через replay, а на Kafka-топіку нема deprecation-заголовка (consumer-driven contracts з m18 — єдине гальмо). Дисципліна звідси: **витрачай lock-in лише там, де вже за нього заплатив** — тісний coupling *нормальний* там, де команди ділять build (ти володієш обома сторонами виходу), і дорогий саме там, де споживачів не перелічити, — тому публічний край дефолтить до найслабше зв\'язаного стилю, що пасує.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: '**Use / avoid — the guide\'s closing verdict.** *Default to REST at any boundary you can\'t enumerate*, and treat every departure as a claim needing one sentence of evidence: **per-view data shaping** → GraphQL, behind cost controls; **typed fan-in between co-built services** → gRPC; **one TS codebase end-to-end** → tRPC; **one-way "now"** → SSE; **two-way "now"** → WebSockets; **peers without a relay** → WebRTC; **telling another server** → webhooks; **facts with unknown future consumers** → broker events. Decide *per boundary*; migrate *additively* (strangler, deprecation calendar); spend *lock-in* only inside boundaries you own end-to-end. Avoid: any style you can\'t defend in one sentence tied to a boundary property; a second style that duplicates a job the first already does (two request/response styles at one edge = double the auth/error/version surface of Section IV); and re-litigating a settled choice without new boundary facts — the framework\'s job is to end the debate, not to host it monthly.',
            uk: '**Використовуй / уникай — фінальний вердикт гайду.** *Дефолть до REST на кожному boundary, якого не можеш перелічити*, і трактуй кожен відхід як тезу, що потребує одного речення доказів: **per-view форма даних** → GraphQL, за контролями вартості; **типізований fan-in між спільно збудованими сервісами** → gRPC; **один TS-codebase наскрізь** → tRPC; **одностороннє «зараз»** → SSE; **двостороннє «зараз»** → WebSockets; **peer-и без ретранслятора** → WebRTC; **сказати іншому серверу** → webhooks; **факти з невідомими майбутніми споживачами** → broker-події. Вирішуй *per boundary*; мігруй *адитивно* (strangler, deprecation-календар); витрачай *lock-in* лише всередині boundaries, якими володієш наскрізь. Уникай: стилю, який не захистиш одним реченням, прив\'язаним до властивості boundary; другого стилю, що дублює роботу першого (два request/response стилі на одному краї = подвоєна auth/error/version поверхня Секції IV); і повторного суду над вирішеним вибором без нових фактів про boundary — робота фреймворку в тому, щоб закінчити дебати, а не проводити їх щомісяця.',
          },
        },
      ],
    },
  ],
  keyPoints: [
    {
      en: '"Which style?" is malformed until you name a **boundary** — systems have several boundaries, each with its own physics, and mature platforms run a style per boundary.',
      uk: '«Який стиль?» — некоректне питання, доки не названо **boundary**: система має кілька boundaries, кожна зі своєю фізикою, і зрілі платформи тримають стиль на boundary.',
    },
    {
      en: 'Decide in **elimination order**: conversation shape → reach → contract discipline → payload. Most debates end before a technology is named.',
      uk: 'Вирішуй у **порядку елімінації**: форма розмови → охоплення → контрактна дисципліна → payload. Більшість дебатів закінчується до назви технології.',
    },
    {
      en: 'Read the trade-off matrix by **columns**: name the column your product bleeds on (cache, reach, types, push…) and let it pick the row.',
      uk: 'Читай матрицю trade-off-ів **колонками**: назви колонку, на якій твій продукт стікає кров\'ю (кеш, охоплення, типи, push…), і дай їй обрати рядок.',
    },
    {
      en: 'Migrations are **additive strangler figs**: new surface beside old (Netflix\'s monolith-as-first-subgraph, AIP-127\'s dual gRPC/REST surface), consumers routed gradually, old surface sunset per m18. Shopify moved an ecosystem by gating **new** apps, not breaking old ones.',
      uk: 'Міграції — **адитивні strangler figs**: нова поверхня поруч зі старою (моноліт-як-перший-subgraph у Netflix, подвійна gRPC/REST поверхня AIP-127), споживачі переходять поступово, стара виводиться через sunset за m18. Shopify зрушив екосистему воротами на **нові** застосунки, не ламаючи старі.',
    },
    {
      en: 'Price the **exit**, not just the entry: lock-in = consumers × contract tightness × wire assumptions. REST is cheapest to leave; broker events are contracts with consumers you don\'t know about.',
      uk: 'Оцінюй **вихід**, не лише вхід: lock-in = споживачі × тісність контракту × припущення щодо дроту. REST найдешевше покинути; broker-події — контракти зі споживачами, про яких не знаєш.',
    },
    {
      en: 'Spend tight coupling only where teams **share a build**; boundaries you can\'t enumerate get the loosest style that fits — that\'s why the public edge defaults to REST.',
      uk: 'Витрачай тісний coupling лише там, де команди **ділять build**; boundaries, яких не перелічити, отримують найслабше зв\'язаний стиль, що пасує, — тому публічний край дефолтить до REST.',
    },
  ],
  pitfalls: [
    {
      title: { en: 'Choosing per system, not per boundary', uk: 'Вибір per system, а не per boundary' },
      body: {
        en: 'The uniform-stack instinct ("we\'re a GraphQL shop") optimizes the org chart\'s comfort, not the boundaries\' physics — and every mismatched boundary pays interest forever: gRPC proxied into browsers, REST polled for liveness, a broker between two services. The unit of decision is the boundary; uniformity is only free where boundaries genuinely share physics.',
        uk: 'Інстинкт уніформного стеку («ми — GraphQL shop») оптимізує комфорт org chart-а, а не фізику boundaries — і кожен невідповідний boundary платить відсотки вічно: gRPC через proxy в браузери, REST-polling заради liveness, broker між двома сервісами. Одиниця рішення — boundary; уніформність безкоштовна лише там, де boundaries справді ділять фізику.',
      },
    },
    {
      title: { en: 'Pricing the entry, ignoring the exit', uk: 'Оцінка входу без оцінки виходу' },
      body: {
        en: 'Proof-of-concept economics ("we had it working in a day") measure entry cost, which is the small number. The large number is the exit: consumers to migrate, queries embedded in shipped apps, codegen in every caller\'s build, events in retention. If the exit bill never appeared in the design doc, the decision wasn\'t made — it was deferred to whoever has to leave.',
        uk: 'Економіка proof-of-concept («запрацювало за день») міряє ціну входу — це мале число. Велике число — вихід: споживачі, яких мігрувати, запити, вшиті у відвантажені застосунки, codegen у build-і кожного викликача, події в retention. Якщо рахунок за вихід не з\'явився в design doc — рішення не ухвалено, а відкладено на того, кому доведеться виходити.',
      },
    },
    {
      title: { en: 'Treating the picker\'s score as authority', uk: 'Score picker-а як авторитет' },
      body: {
        en: 'Any scoring model encodes someone\'s weights — this guide\'s included. The picker\'s output is a structured argument (fit + named boosts and vetoes), and its value is that you can *disagree with a specific line* of it. Deferring to the number without reading the reasons reproduces résumé-driven choice with extra steps: fashion replaced by a framework, judgment still absent.',
        uk: 'Будь-яка scoring-модель кодує чиїсь ваги — і модель цього гайду теж. Вивід picker-а — структурований аргумент (fit + названі бусти й вето), і його цінність у тому, що можна *не погодитися з конкретним рядком*. Делегування числу без читання причин відтворює résumé-driven вибір із додатковими кроками: моду замінив фреймворк, судження досі відсутнє.',
      },
    },
  ],
  interview: [
    {
      q: {
        en: 'Design the API surface for a marketplace: a web app, native mobile apps, third-party seller integrations, a warehouse device fleet, and payment-provider callbacks. Name a style per boundary and defend each in one sentence.',
        uk: 'Спроєктуй API-поверхню маркетплейсу: web-застосунок, нативні mobile-застосунки, інтеграції сторонніх продавців, парк складських пристроїв і callbacks платіжного провайдера. Назви стиль на кожен boundary і захисти кожен одним реченням.',
      },
      a: {
        en: 'Per boundary: **sellers (public 3rd parties)** → REST + OpenAPI — strangers need boring, cacheable, self-service HTTP with generated SDKs. **Web + mobile (own clients, many screens)** → GraphQL behind a BFF — the views genuinely differ per screen and we control both sides; depth/complexity limits anyway. **Internal services** (orders↔inventory↔pricing) → gRPC — co-built teams, shared `.proto`, breakage at compile time. **Warehouse devices** → MQTT into the broker — flaky links, tiny frames, QoS; and the order/payment *facts* ride the same broker as events (outbox at each producer). **Payment-provider callbacks** → webhooks in — verify HMAC signatures, enforce idempotency keys, dedup by event id (their at-least-once is not our double-capture). **Live order tracking in the UI** → SSE — one-way "now", survives proxies, auto-reconnects. The staff-level follow-through: one OAuth/OIDC identity model across all of it, RFC 9457 errors at every HTTP edge, one `traceparent` through gateway→gRPC→events, and the seams (gateway translations, webhook ingress, broker consumption) each re-derive authorization rather than trusting the transport.',
        uk: 'Per boundary: **продавці (публічні треті сторони)** → REST + OpenAPI — незнайомцям потрібен нудний, кешований, self-service HTTP зі згенерованими SDK. **Web + mobile (власні клієнти, багато екранів)** → GraphQL за BFF — views справді різняться по екранах і ми контролюємо обидві сторони; ліміти depth/complexity у будь-якому разі. **Внутрішні сервіси** (orders↔inventory↔pricing) → gRPC — спільно збудовані команди, спільний `.proto`, поломки на compile time. **Складські пристрої** → MQTT у broker — нестабільні лінки, крихітні фрейми, QoS; і *факти* замовлень/платежів їдуть тим самим broker-ом як події (outbox у кожного producer-а). **Callbacks платіжного провайдера** → вхідні webhooks — перевіряй HMAC-підписи, вимагай idempotency keys, дедуплікуй за id події (їхнє at-least-once — не наш подвійний capture). **Живий трекінг замовлення в UI** → SSE — одностороннє «зараз», переживає проксі, сам перепідключається. Staff-довершення: одна OAuth/OIDC модель ідентичності через усе, помилки RFC 9457 на кожному HTTP-краї, один `traceparent` крізь gateway→gRPC→події, і кожен шов (трансляції gateway, вхід webhook-ів, споживання з broker-а) повторно виводить авторизацію замість довіри транспорту.',
      },
      level: 'staff',
    },
    {
      q: {
        en: 'Your team proposes migrating the public REST API to GraphQL "because our mobile app over-fetches". Argue both sides like a staff engineer, then decide.',
        uk: 'Твоя команда пропонує мігрувати публічний REST API на GraphQL, «бо наш mobile-застосунок over-fetch-ить». Наведи аргументи обох сторін як staff-інженер, а тоді виріши.',
      },
      a: {
        en: 'First, split the conflated boundaries: the *mobile app* (our client, our screens) and the *public API* (strangers\' integrations) are different problems wearing one sentence. For GraphQL: per-view shaping is its founding feature; the mobile pain is real and measurable (payload sizes, request counts); GitHub and Shopify prove public GraphQL works at scale. Against, for the *public* edge: we lose HTTP caching/CDN on day one; we inherit query-cost policing against adversarial strangers (m9/m22); every partner\'s existing integration, SDK and tutorial breaks or bifurcates; and the exit bill T6-style is enormous — partners embed queries in shipped code. Decision: **fix the named pain at its own boundary** — a GraphQL (or BFF) layer for *our* clients, where we control both sides and the over-fetch actually lives; keep the public edge REST. Revisit only if a *second* named fact arrives (e.g., partners demonstrably need per-view shaping too) — and then migrate the Shopify way: additive, versioned calendar, gate new integrations, sunset per m18, never a cutover.',
        uk: 'Спершу розклей склеєні boundaries: *mobile-застосунок* (наш клієнт, наші екрани) і *публічний API* (інтеграції незнайомців) — різні задачі в одному реченні. За GraphQL: per-view форма — його засаднича фіча; mobile-біль реальний і вимірний (розміри payload, кількість запитів); GitHub і Shopify доводять, що публічний GraphQL працює в масштабі. Проти — для *публічного* краю: втрачаємо HTTP-кеш/CDN у перший день; успадковуємо контроль вартості запитів проти ворожих незнайомців (m9/m22); наявна інтеграція, SDK і туторіал кожного партнера ламається або роздвоюється; і рахунок за вихід у стилі T6 величезний — партнери вшивають запити у відвантажений код. Рішення: **лікуй названий біль на його власному boundary** — шар GraphQL (чи BFF) для *наших* клієнтів, де ми контролюємо обидві сторони і де over-fetch насправді живе; публічний край лишається REST. Повертайся до питання, лише якщо з\'явиться *другий* названий факт (скажімо, партнерам доказово теж потрібна per-view форма) — і тоді мігруй як Shopify: адитивно, версіонований календар, ворота на нові інтеграції, sunset за m18, ніколи не cutover.',
      },
      level: 'staff',
    },
  ],
  seeAlso: ['m2-decision-axes', 'm5-rest', 'm9-graphql', 'm10-grpc', 'm18-versioning', 'm23-observability'],
  sources: [
    { title: 'GitHub Docs — Comparing GitHub\'s REST API and GraphQL API', url: 'https://docs.github.com/en/rest/about-the-rest-api/comparing-githubs-rest-api-and-graphql-api' },
    { title: 'Shopify developer changelog — New public apps must use GraphQL (April 2025)', url: 'https://shopify.dev/changelog/starting-april-2025-new-public-apps-submitted-to-shopify-app-store-must-use-graphql' },
    { title: 'Shopify Partners — All-in on GraphQL: the future of app development at Shopify', url: 'https://www.shopify.com/partners/blog/all-in-on-graphql' },
    { title: 'Netflix TechBlog — How Netflix Scales its API with GraphQL Federation (Part 1)', url: 'https://medium.com/netflix-techblog/how-netflix-scales-its-api-with-graphql-federation-part-1-ae3557c187e2' },
    { title: 'Netflix TechBlog — How Netflix Scales its API with GraphQL Federation (Part 2)', url: 'https://netflixtechblog.com/how-netflix-scales-its-api-with-graphql-federation-part-2-bbe71aaec44a' },
    { title: 'Google AIP-127 — HTTP and gRPC Transcoding', url: 'https://google.aip.dev/127' },
    { title: 'Google Cloud Endpoints — Transcoding HTTP/JSON to gRPC', url: 'https://cloud.google.com/endpoints/docs/grpc/transcoding' },
    { title: 'Stripe API Reference — "The Stripe API is organized around REST"', url: 'https://docs.stripe.com/api' },
    { title: 'Martin Fowler — Strangler Fig Application', url: 'https://martinfowler.com/bliki/StranglerFigApplication.html' },
  ],
};
