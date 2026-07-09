import type { Module } from '../types';

/*
 * m25-mental-models — Mental models & when-NOT gallery (s5-choosing, order 2). The guide's recap
 * organ: one line per style (recall) → when NOT to use each (rejection) → the 7 axes (placement) →
 * the glossary bridge (vocabulary). Deliberately introduces NO new claims: every line compresses a
 * module that defends it at length, and the when-NOT lines match lib/picker.ts WHEN_NOT in
 * substance (the picker is the executable version of T2). Level: beginner — the on-ramp reader can
 * start here; the staff reader uses it as the pre-review / pre-interview warm-up (the "b–S" range
 * in CURRICULUM §E). The #/mental-models gallery page renders every module's mentalModel line,
 * derived from the SSOT — this module teaches how to *use* that gallery.
 */
export const m25: Module = {
  id: 'm25-mental-models',
  num: 25,
  section: 's5-choosing',
  order: 2,
  level: 'beginner',
  title: { en: 'Mental models & when-NOT gallery', uk: 'Ментальні моделі та галерея коли-НЕ' },
  tagline: {
    en: 'One line per style; when NOT to use each.',
    uk: 'Один рядок на стиль; коли НЕ використовувати кожен.',
  },
  readMins: 11,
  mentalModel: {
    en: 'Master the one-liners and you can place, compare, and reject any style on demand.',
    uk: 'Опануй однорядковики — і зможеш розмістити, порівняти й відкинути будь-який стиль на вимогу.',
  },
  topics: [
    // ── T1 · One-liner per style ──────────────────────────────────────────────
    {
      id: 'one-liner-per-style',
      title: { en: 'One-liner per style', uk: 'Один рядок на стиль' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'A one-liner is not a summary — it is a **retrieval cue**. Working memory holds a handful of chunks; under pressure (a design review, an interview, an incident) you cannot page twelve modules back in, but you *can* hold twelve lines, and each line is the handle that pulls its whole module up when needed. The test of a good one-liner is that it names the style\'s **central trade**, not its feature list: "REST trades efficiency for reach" places REST on the map; "REST uses HTTP verbs" does not. The table below compresses each style module of this guide into that form — the line, what taking the trade *buys* you, and what it *costs*. Say the line; if the buy and the cost don\'t follow from it in your head, the line hasn\'t become a model yet — reopen the module.',
            uk: 'Однорядковик — це не резюме, а **гачок для пригадування**. Робоча памʼять тримає жменьку чанків; під тиском (design review, співбесіда, інцидент) ти не перегорнеш дванадцять модулів, але дванадцять рядків утримаєш — і кожен рядок є ручкою, що витягує весь свій модуль, коли треба. Тест доброго однорядковика: він називає **центральний обмін** стилю, а не список фіч: «REST міняє ефективність на охоплення» — розміщує REST на мапі; «REST використовує HTTP-дієслова» — ні. Таблиця нижче стискає кожен стильовий модуль цього гайду в таку форму — рядок, що цей обмін *купує* і що *коштує*. Промов рядок; якщо купівля і ціна не випливають із нього в голові — рядок ще не став моделлю: відкрий модуль знову.',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Style', uk: 'Стиль' },
            { en: 'The one-liner', uk: 'Однорядковик' },
            { en: 'It buys you', uk: 'Купує тобі' },
            { en: 'It costs you', uk: 'Коштує тобі' },
          ],
          rows: [
            [
              { en: 'REST (m5)', uk: 'REST (m5)' },
              { en: 'Resources with a uniform interface — trade raw efficiency for reach, caching, evolvability.', uk: 'Ресурси з uniform interface — міняєш сиру ефективність на охоплення, кешування, evolvability.' },
              { en: 'The web\'s infrastructure works for you', uk: 'Інфраструктура вебу працює на тебе' },
              { en: 'Verbosity; no push; N round trips', uk: 'Багатослівʼя; без push; N round trips' },
            ],
            [
              { en: 'OData (m6)', uk: 'OData (m6)' },
              { en: 'The URL becomes a query: a standardized grammar ($filter, $select, $expand) over REST resources.', uk: 'URL стає запитом: стандартизована граматика ($filter, $select, $expand) над REST-ресурсами.' },
              { en: 'Generic clients query APIs they\'ve never seen', uk: 'Генеричні клієнти запитують API, якого не бачили' },
              { en: 'You expose almost-a-database', uk: 'Відкриваєш майже-базу-даних' },
            ],
            [
              { en: 'SOAP (m7)', uk: 'SOAP (m7)' },
              { en: 'A message in an envelope, described by a WSDL contract; HTTP is just the courier.', uk: 'Повідомлення в конверті, описане WSDL-контрактом; HTTP — лише курʼєр.' },
              { en: 'Contract rigor + message-level security', uk: 'Строгість контракту + безпека на рівні повідомлення' },
              { en: 'Verbosity, tooling weight, no web caching', uk: 'Багатослівʼя, важкий тулінг, без веб-кешування' },
            ],
            [
              { en: 'JSON-RPC (m8)', uk: 'JSON-RPC (m8)' },
              { en: 'Name a method, pass params, correlate the reply by id — over any transport.', uk: 'Назви метод, передай params, скорелюй відповідь за id — через будь-який транспорт.' },
              { en: 'Minimal envelope; transport freedom (LSP, MCP)', uk: 'Мінімальний конверт; свобода транспорту (LSP, MCP)' },
              { en: 'All HTTP semantics forfeited', uk: 'Вся семантика HTTP втрачена' },
            ],
            [
              { en: 'GraphQL (m9)', uk: 'GraphQL (m9)' },
              { en: 'A typed graph queried by shape: the query\'s shape is the response\'s shape, one round trip.', uk: 'Типізований граф, запитуваний за формою: форма query і є формою відповіді, один round trip.' },
              { en: 'Client-shaped data; one evolving endpoint', uk: 'Дані у формі клієнта; один endpoint, що еволюціонує' },
              { en: 'N+1, query-cost policing, cache loss', uk: 'N+1, контроль вартості запитів, втрата кешу' },
            ],
            [
              { en: 'gRPC (m10)', uk: 'gRPC (m10)' },
              { en: 'A function call across the network, typed by a .proto, binary on HTTP/2.', uk: 'Виклик функції через мережу, типізований .proto, binary над HTTP/2.' },
              { en: 'Speed, streaming, cross-language types', uk: 'Швидкість, streaming, крос-мовні типи' },
              { en: 'Browser reach (proxy tax); shared IDL', uk: 'Охоплення браузерів (податок на proxy); спільний IDL' },
            ],
            [
              { en: 'tRPC (m11)', uk: 'tRPC (m11)' },
              { en: 'The TypeScript type is the contract — the compiler keeps both ends in sync.', uk: 'Тип TypeScript і є контрактом — компілятор тримає обидва кінці в синхроні.' },
              { en: 'Zero codegen; refactors break loudly at build', uk: 'Нуль codegen; рефактори гучно падають на build-і' },
              { en: 'Contract exists only inside one TS repo', uk: 'Контракт існує лише в одному TS-repo' },
            ],
            [
              { en: 'WebSockets (m12)', uk: 'WebSockets (m12)' },
              { en: 'One TCP pipe, full-duplex frames — both sides talk whenever they like.', uk: 'Одна TCP-труба, full-duplex фрейми — обидві сторони говорять коли завгодно.' },
              { en: 'A live, symmetric, stateful channel', uk: 'Живий, симетричний, stateful канал' },
              { en: 'HTTP\'s statelessness, caching, easy scaling', uk: 'Statelessness, кешування й легке масштабування HTTP' },
            ],
            [
              { en: 'SSE (m13)', uk: 'SSE (m13)' },
              { en: 'One HTTP response that never ends; the browser reconnects and resumes by itself.', uk: 'Одна HTTP-відповідь, що не закінчується; браузер сам перепідключається і відновлює.' },
              { en: 'Push with plain-HTTP operations for free', uk: 'Push зі звичайними HTTP-операціями безкоштовно' },
              { en: 'One direction, text only', uk: 'Один напрямок, лише текст' },
            ],
            [
              { en: 'WebRTC (m14)', uk: 'WebRTC (m14)' },
              { en: 'Two peers connect directly — your server drops out of the data path.', uk: 'Два peers зʼєднуються напряму — твій сервер випадає зі шляху даних.' },
              { en: 'Lowest latency; media-grade P2P', uk: 'Найнижча latency; media-grade P2P' },
              { en: 'Signaling + ICE/TURN complexity', uk: 'Складність signaling + ICE/TURN' },
            ],
            [
              { en: 'Webhooks (m15)', uk: 'Webhooks (m15)' },
              { en: 'The arrow flips: you register a URL and the provider POSTs events to it.', uk: 'Стрілка розвертається: ти реєструєш URL, і провайдер POST-ить події на нього.' },
              { en: 'Events without polling, across companies', uk: 'Події без polling-у, між компаніями' },
              { en: 'You become a server: retries, dedup, signatures', uk: 'Ти стаєш сервером: retries, дедуплікація, підписи' },
            ],
            [
              { en: 'Messaging (m16)', uk: 'Messaging (m16)' },
              { en: 'Drop a fact in a buffer and move on; consumers read at their own pace.', uk: 'Кинь факт у буфер і йди далі; consumers читають у своєму темпі.' },
              { en: 'Temporal decoupling, load-leveling, fan-out', uk: 'Темпоральне розчеплення, load-leveling, fan-out' },
              { en: 'The immediate answer; broker ops', uk: 'Негайна відповідь; експлуатація broker-а' },
            ],
          ],
          caption: {
            en: 'Twelve styles, twelve trades. Each line is defended at length in its module — the buy and the cost are the two halves every defence must name.',
            uk: 'Дванадцять стилів, дванадцять обмінів. Кожен рядок розгорнуто захищений у своєму модулі — купівля і ціна є двома половинами, які мусить назвати кожен захист.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'The gallery is the drill', uk: 'Галерея — це тренажер' },
          md: {
            en: 'The **Mental Models** page in the top navigation renders the one-line model of *all 25 modules* — styles and cross-cutting concerns alike — pulled live from the same data the modules render from, so it can never drift. Drill it like flashcards: read a module title, say the line before your eyes reach it, click through where you hesitated. Ten minutes before an interview or a design review is exactly what it is for.',
            uk: 'Сторінка **Mental Models** у верхній навігації рендерить однорядкову модель *усіх 25 модулів* — і стилів, і наскрізних тем — наживо з тих самих даних, з яких рендеряться модулі, тож розійтися з ними вона не може. Тренуйся як із флеш-картками: прочитай назву модуля, промов рядок раніше, ніж очі до нього дійдуть, і відкрий модуль там, де завагався. Десять хвилин перед співбесідою чи design review — саме для цього.',
          },
        },
      ],
    },
    // ── T2 · When NOT to use each ─────────────────────────────────────────────
    {
      id: 'when-not-to-use-each',
      title: { en: 'When NOT to use each', uk: 'Коли НЕ використовувати кожен' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Positive knowledge is cheap — every style\'s homepage tells you what it is great at. **Negative knowledge is what reviews are won with**: the senior voice in the room is the one that says "not gRPC here — these callers are anonymous browsers" a full meeting before anyone has written a line. This guide has insisted on it from the start: every style module closes with a *use it / avoid it* verdict, and the picker (m24) encodes the avoid-side as named **vetoes** — the −50 tRPC takes for public callers is row three of this table wearing a number. The gallery below is those verdicts in one place: the tell that a style is wrong for the boundary, and the first alternative to reach for instead.',
            uk: 'Позитивне знання дешеве — головна сторінка кожного стилю розповість, у чому він чудовий. **Негативне знання — те, чим виграють review**: senior-голос у кімнаті — той, хто каже «не gRPC тут — ці викликачі є анонімними браузерами» за цілу нараду до того, як хтось написав рядок коду. Цей гайд наполягає на цьому від початку: кожен стильовий модуль закінчується вердиктом *коли варто / коли ні*, а picker (m24) кодує сторону «ні» як іменовані **вето** — ті −50, що tRPC отримує за публічних викликачів, є третім рядком цієї таблиці, просто записаним числом. Галерея нижче — усі ці вердикти в одному місці: ознака, що стиль не пасує boundary, і перша альтернатива, до якої варто потягнутися.',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Style', uk: 'Стиль' },
            { en: 'When NOT', uk: 'Коли НЕ' },
            { en: 'Reach for instead', uk: 'Візьми натомість' },
          ],
          rows: [
            [
              { en: 'REST (m5)', uk: 'REST (m5)' },
              { en: 'Server push, live sessions, or chatty call-shaped internal traffic — polling REST for "now" is the classic smell.', uk: 'Server push, живі сесії чи балакучий виклико-подібний внутрішній трафік — polling REST заради «зараз» є класичним запахом.' },
              { en: 'SSE / WebSockets for push; gRPC inside', uk: 'SSE / WebSockets для push; gRPC всередині' },
            ],
            [
              { en: 'OData (m6)', uk: 'OData (m6)' },
              { en: 'A public edge without query cost controls — you are exposing a queryable surface, almost a database.', uk: 'Публічний край без контролю вартості запитів — ти відкриваєш запитувану поверхню, майже базу даних.' },
              { en: 'Plain REST with fixed, priced filters', uk: 'Звичайний REST із фіксованими фільтрами з відомою ціною' },
            ],
            [
              { en: 'SOAP (m7)', uk: 'SOAP (m7)' },
              { en: 'Anything new outside regulated enterprise integrations that already live in WSDL tooling.', uk: 'Будь-що нове поза регульованими enterprise-інтеграціями, що вже живуть у WSDL-тулінгу.' },
              { en: 'REST for reach; gRPC for contracts', uk: 'REST для охоплення; gRPC для контрактів' },
            ],
            [
              { en: 'JSON-RPC (m8)', uk: 'JSON-RPC (m8)' },
              { en: 'When you need HTTP semantics — one POST URL forfeits caching, status codes and per-method authz.', uk: 'Коли потрібна семантика HTTP — один POST-URL віддає кешування, статус-коди і per-method authz.' },
              { en: 'REST (the semantics come back)', uk: 'REST (семантика повертається)' },
            ],
            [
              { en: 'GraphQL (m9)', uk: 'GraphQL (m9)' },
              { en: 'As a default for simple CRUD or file-ish payloads — you inherit N+1 and query-cost policing on day one.', uk: 'Як дефолт для простого CRUD чи файло-подібних payload-ів — з першого дня успадковуєш N+1 і контроль вартості запитів.' },
              { en: 'REST; presigned URLs for files', uk: 'REST; presigned URLs для файлів' },
            ],
            [
              { en: 'gRPC (m10)', uk: 'gRPC (m10)' },
              { en: 'Straight to browsers or anonymous third parties — the proxy tax and .proto handshake outweigh the wins.', uk: 'Напряму в браузери чи анонімним третім сторонам — податок на proxy і .proto-handshake переважує виграші.' },
              { en: 'REST at the edge; keep gRPC inside', uk: 'REST на краю; gRPC лиши всередині' },
            ],
            [
              { en: 'tRPC (m11)', uk: 'tRPC (m11)' },
              { en: 'Across a company or language boundary — the moment a consumer is not in your TS repo, the contract evaporates.', uk: 'Через межу компанії чи мови — щойно споживач не у твоєму TS-repo, контракт випаровується.' },
              { en: 'REST + OpenAPI; gRPC if both ends build the IDL', uk: 'REST + OpenAPI; gRPC, якщо обидва кінці збирають IDL' },
            ],
            [
              { en: 'WebSockets (m12)', uk: 'WebSockets (m12)' },
              { en: 'Request/response work or one-way feeds — you would hand-build ordering, reconnect and backpressure HTTP already has.', uk: 'Request/response робота чи односторонні потоки — вручну збудуєш ordering, reconnect і backpressure, які HTTP вже має.' },
              { en: 'REST for calls; SSE for one-way push', uk: 'REST для викликів; SSE для одностороннього push' },
            ],
            [
              { en: 'SSE (m13)', uk: 'SSE (m13)' },
              { en: 'Clients must talk back on the same channel, or push binary — it is text and one-way by design.', uk: 'Клієнти мусять відповідати тим самим каналом або пушити binary — воно текстове й одностороннє за задумом.' },
              { en: 'WebSockets', uk: 'WebSockets' },
            ],
            [
              { en: 'WebRTC (m14)', uk: 'WebRTC (m14)' },
              { en: 'Server-shaped jobs a WebSocket does in a tenth of the code — and never without TURN in the budget.', uk: 'Серверо-подібні задачі, які WebSocket робить удесятеро меншим кодом, — і ніколи без TURN у бюджеті.' },
              { en: 'WebSockets via your server', uk: 'WebSockets через твій сервер' },
            ],
            [
              { en: 'Webhooks (m15)', uk: 'Webhooks (m15)' },
              { en: 'The consumer cannot run a public HTTPS endpoint, or needs the answer now — it is async, at-least-once, unordered.', uk: 'Споживач не може тримати публічний HTTPS-endpoint або потребує відповіді зараз — це async, at-least-once, без порядку.' },
              { en: 'Request/response; polling as the floor', uk: 'Request/response; polling як нижня межа' },
            ],
            [
              { en: 'Messaging (m16)', uk: 'Messaging (m16)' },
              { en: 'A simple ask-and-answer between two services — a broker is real infrastructure with real on-call.', uk: 'Просте «запитав-відповів» між двома сервісами — broker є справжньою інфраструктурою зі справжнім on-call.' },
              { en: 'REST or gRPC, point to point', uk: 'REST або gRPC, точка-точка' },
            ],
          ],
          caption: {
            en: 'The same lines the Style Picker shows on its verdict card — here as a gallery you can rehearse. Each is argued in full in the style\'s own module verdict.',
            uk: 'Ті самі рядки, які Style Picker показує на картці вердикту, — тут як галерея для репетиції. Кожен повністю аргументований у вердикті модуля свого стилю.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: '"When NOT" is not "never"', uk: '«Коли НЕ» — це не «ніколи»' },
          md: {
            en: 'Every line in this table has a legitimate exception — gRPC *does* reach browsers where you own the proxy budget (m10), OData *is* safe on an internal admin surface (m6). The table\'s job is not to forbid; it is to name the sentence you must be able to say out loud before overriding it: "yes, and here is why the tell doesn\'t apply to this boundary." If no such sentence exists, the table just saved you a migration — the same contract m24 sets for the picker\'s score.',
            uk: 'Кожен рядок цієї таблиці має легітимний виняток — gRPC *таки* дістає браузери там, де ти володієш бюджетом на proxy (m10), OData *таки* безпечна на внутрішній адмін-поверхні (m6). Робота таблиці — не забороняти; вона називає речення, яке мусиш вміти промовити вголос, перш ніж її переважити: «так, і ось чому ознака не стосується цього boundary». Якщо такого речення нема — таблиця щойно зекономила тобі міграцію: той самий контракт, який m24 задає для score picker-а.',
          },
        },
      ],
    },
    // ── T3 · The axes recap ───────────────────────────────────────────────────
    {
      id: 'the-axes-recap',
      title: { en: 'The axes recap', uk: 'Рекап осей' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'One-liners recall styles you already know; **axes place technologies you have never seen**. The seven axes from m2 are the coordinate system this whole guide runs on: every style is a point in that space, every boundary of your product is a region, and choosing is measuring the distance between them — that is literally what the compass on the landing page and the picker\'s fit score compute (m24). The payoff compounds over a career: styles churn, axes do not. When the next protocol lands on the front page, you do not need its marketing site — you need its coordinates. **MCP** is the proof from this guide: strip the branding and it is a JSON-RPC 2.0 envelope (m8) over stdio or streamable HTTP — sync timing, request/response flow with notifications, client-initiated, text encoding, point-to-point topology, loose coupling. Placed in thirty seconds, compared in sixty, its trade-offs inherited from an envelope this guide already taught.',
            uk: 'Однорядковики пригадують стилі, які ти вже знаєш; **осі розміщують технології, яких ти ніколи не бачив**. Сім осей з m2 — система координат, на якій працює весь цей гайд: кожен стиль є точкою в цьому просторі, кожен boundary твого продукту — регіоном, а вибір — вимірюванням відстані між ними: саме це буквально рахують compass на головній і fit-score picker-а (m24). Виграш накопичується впродовж карʼєри: стилі змінюються, осі — ні. Коли наступний протокол виходить на головну сторінку, тобі потрібен не його маркетинговий сайт, а його координати. **MCP** — доказ із цього гайду: зніми брендинг — і це JSON-RPC 2.0 конверт (m8) через stdio або streamable HTTP: sync timing, request/response flow з notifications, ініціатива клієнта, текстовий encoding, топологія точка-точка, слабкий coupling. Розміщено за тридцять секунд, порівняно за шістдесят, trade-off-и успадковано від конверта, який цей гайд уже розібрав.',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Axis', uk: 'Вісь' },
            { en: 'The question it asks', uk: 'Питання, яке вона ставить' },
            { en: 'The ends of the scale', uk: 'Кінці шкали' },
          ],
          rows: [
            [
              { en: 'Timing', uk: 'Timing' },
              { en: 'Do you wait for the reply, or decouple in time?', uk: 'Чекаєш на відповідь чи розчіплюєшся в часі?' },
              { en: 'Sync (REST, gRPC) ↔ async (webhooks, messaging)', uk: 'Sync (REST, gRPC) ↔ async (webhooks, messaging)' },
            ],
            [
              { en: 'Flow', uk: 'Flow' },
              { en: 'One exchange, a stream, or pushed events?', uk: 'Один обмін, потік чи пушені події?' },
              { en: 'Request/response (REST) ↔ streaming (gRPC, WS) ↔ event push (SSE, webhooks)', uk: 'Request/response (REST) ↔ streaming (gRPC, WS) ↔ event push (SSE, webhooks)' },
            ],
            [
              { en: 'Direction', uk: 'Direction' },
              { en: 'Does one side talk, or both?', uk: 'Говорить одна сторона чи обидві?' },
              { en: 'One-way / unary (REST, SSE) ↔ bidirectional (WS, WebRTC)', uk: 'One-way / unary (REST, SSE) ↔ bidirectional (WS, WebRTC)' },
            ],
            [
              { en: 'Initiative', uk: 'Initiative' },
              { en: 'Who speaks first?', uk: 'Хто говорить першим?' },
              { en: 'Client asks (REST, GraphQL) ↔ server pushes (SSE, webhooks)', uk: 'Клієнт питає (REST, GraphQL) ↔ сервер пушить (SSE, webhooks)' },
            ],
            [
              { en: 'Encoding', uk: 'Encoding' },
              { en: 'Text a human can read, or binary a machine loves?', uk: 'Текст, який читає людина, чи binary, який любить машина?' },
              { en: 'Text — JSON/XML (REST, GraphQL) ↔ binary — Protobuf (gRPC)', uk: 'Текст — JSON/XML (REST, GraphQL) ↔ binary — Protobuf (gRPC)' },
            ],
            [
              { en: 'Topology', uk: 'Topology' },
              { en: 'Client↔server, peer↔peer, or through a broker?', uk: 'Клієнт↔сервер, peer↔peer чи через broker?' },
              { en: 'Client-server (REST) ↔ P2P (WebRTC) ↔ brokered (MQTT, Kafka)', uk: 'Клієнт-сервер (REST) ↔ P2P (WebRTC) ↔ через broker (MQTT, Kafka)' },
            ],
            [
              { en: 'Coupling', uk: 'Coupling' },
              { en: 'How much must both ends share to talk at all?', uk: 'Скільки обидва кінці мусять поділяти, щоб узагалі говорити?' },
              { en: 'Loose — self-describing JSON (REST) ↔ tight — shared contract (gRPC, tRPC)', uk: 'Слабкий — self-describing JSON (REST) ↔ тісний — спільний контракт (gRPC, tRPC)' },
            ],
          ],
          caption: {
            en: 'The seven axes of m2, one line each. The landing-page compass is this table made interactive; the picker (m24) is this table turned into elimination order.',
            uk: 'Сім осей m2, по рядку на кожну. Compass на головній — ця таблиця, зроблена інтерактивною; picker (m24) — ця таблиця, перетворена на порядок елімінації.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Axes outlive styles', uk: 'Осі переживають стилі' },
          md: {
            en: 'Interviewers change the nouns every few years — GraphQL yesterday, tRPC today, whatever ships next spring. The questions underneath do not move: who initiates, what flows, how tight is the contract, who pays for the coupling. Answer on the axes and you are never answering from memory of a blog post; you are answering from the coordinate system — which is also exactly how m24\'s decision tree asks them, in elimination order.',
            uk: 'Інтервʼюери міняють іменники кожні кілька років — учора GraphQL, сьогодні tRPC, наступної весни — що вийде. Питання під ними не рухаються: хто ініціює, що тече, наскільки тісний контракт, хто платить за coupling. Відповідай на осях — і ти ніколи не відповідаєш з памʼяті про блог-пост; ти відповідаєш із системи координат — саме так їх ставить і дерево рішення m24, у порядку елімінації.',
          },
        },
      ],
    },
    // ── T4 · The glossary bridge ──────────────────────────────────────────────
    {
      id: 'glossary-bridge',
      title: { en: 'The glossary bridge', uk: 'Місток до глосарію' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The last recall structure is vocabulary. Mental models compress *understanding*; terms compress *communication* — an RFC, a design doc, an interviewer all assume you parse `idempotent`, `at-least-once`, `traceparent` without slowing down, and every hesitation taxes the actual conversation. The guide\'s **Glossary** (top navigation) holds the cross-style terms, bilingual, every one deep-linkable from global search — and deliberately keeps the terms themselves English in both languages, because that is the language your logs, your dependencies and your interviews speak. The table below is the glossary sliced into **clusters worth mastering together**: terms that define each other, learned as a set, pinned to the modules that teach them.',
            uk: 'Остання структура пригадування — словник. Ментальні моделі стискають *розуміння*; терміни стискають *комунікацію* — RFC, design doc та інтервʼюер однаково припускають, що ти парсиш `idempotent`, `at-least-once`, `traceparent` без сповільнення, і кожна затримка оподатковує саму розмову. **Glossary** гайду (верхня навігація) тримає крос-стильові терміни, двомовно, кожен доступний deep-link-ом із глобального пошуку — і навмисно лишає самі терміни англійською в обох мовах, бо саме нею говорять твої логи, твої залежності й твої співбесіди. Таблиця нижче — глосарій, порізаний на **кластери, які варто опановувати разом**: терміни, що визначають одне одного, вивчаються набором і привʼязані до модулів, які їх навчають.',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Cluster', uk: 'Кластер' },
            { en: 'Master these together', uk: 'Опануй разом' },
            { en: 'Taught in', uk: 'Навчають' },
          ],
          rows: [
            [
              { en: 'HTTP semantics', uk: 'Семантика HTTP' },
              { en: 'Idempotent · Safe method · ETag · Conditional request · Content negotiation', uk: 'Idempotent · Safe method · ETag · Conditional request · Content negotiation' },
              { en: 'm5, m3', uk: 'm5, m3' },
            ],
            [
              { en: 'Contracts & schemas', uk: 'Контракти і схеми' },
              { en: 'Protocol Buffers · Resolver · DataLoader · Federation · Schema registry · Contract testing', uk: 'Protocol Buffers · Resolver · DataLoader · Federation · Schema registry · Contract testing' },
              { en: 'm9, m10, m18, m23', uk: 'm9, m10, m18, m23' },
            ],
            [
              { en: 'Real-time & peers', uk: 'Real-time і peers' },
              { en: 'Full-duplex · Subprotocol · Last-Event-ID · Signaling · ICE · STUN · TURN', uk: 'Full-duplex · Subprotocol · Last-Event-ID · Signaling · ICE · STUN · TURN' },
              { en: 'm12, m13, m14', uk: 'm12, m13, m14' },
            ],
            [
              { en: 'Delivery & reliability', uk: 'Доставка і надійність' },
              { en: 'At-least-once delivery · Idempotency key · Outbox pattern · Saga · Dead-letter queue · Circuit breaker', uk: 'At-least-once delivery · Idempotency key · Outbox pattern · Saga · Dead-letter queue · Circuit breaker' },
              { en: 'm15, m16, m21', uk: 'm15, m16, m21' },
            ],
            [
              { en: 'Security', uk: 'Безпека' },
              { en: 'HMAC · CORS · CSRF · SSRF · SameSite · CSWSH', uk: 'HMAC · CORS · CSRF · SSRF · SameSite · CSWSH' },
              { en: 'm15, m17, m22', uk: 'm15, m17, m22' },
            ],
            [
              { en: 'Operating APIs', uk: 'Експлуатація API' },
              { en: 'Rate limiting · Cursor pagination · traceparent · OpenTelemetry · API gateway · BFF', uk: 'Rate limiting · Cursor pagination · traceparent · OpenTelemetry · API gateway · BFF' },
              { en: 'm20, m23', uk: 'm20, m23' },
            ],
            [
              { en: 'Choosing & change', uk: 'Вибір і зміни' },
              { en: 'Strangler fig · Lock-in (exit cost)', uk: 'Strangler fig · Lock-in (exit cost)' },
              { en: 'm24', uk: 'm24' },
            ],
          ],
          caption: {
            en: 'Seven clusters, each a set of terms that define each other. Search any of them — every glossary entry deep-links, and most cross-reference their neighbours.',
            uk: 'Сім кластерів, кожен — набір термінів, що визначають одне одного. Шукай будь-який — кожен запис глосарію має deep-link, і більшість перехресно посилаються на сусідів.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: 'And that closes the guide\'s loop. You met the landscape on the compass (m2), learned each style as a delta from REST (Sections I–III), hardened them with the cross-cutting concerns (Section IV), and turned it all into a defensible decision (m24). This module is the part designed to *stay* in your head after the tabs close: twelve lines, twelve tells, seven axes, seven clusters of words. Everything else lives one click away — and the fastest way back in is the search box.',
            uk: 'І це замикає петлю гайду. Ти зустрів landscape на compass-і (m2), вивчив кожен стиль як дельту від REST (Секції I–III), загартував їх наскрізними темами (Секція IV) і перетворив усе на рішення, яке можна захистити (m24). Цей модуль — та частина, що спроєктована *залишитися* в голові після закриття вкладок: дванадцять рядків, дванадцять ознак, сім осей, сім кластерів слів. Усе решта живе за один клік — і найшвидший шлях назад є полем пошуку.',
          },
        },
      ],
    },
  ],
  keyPoints: [
    {
      en: 'A one-liner is a retrieval cue, not the understanding: the line pulls the module up under pressure; the model itself is the module\'s diagram and trade.',
      uk: 'Однорядковик — гачок для пригадування, а не саме розуміння: рядок витягує модуль під тиском; сама модель — це діаграма і обмін модуля.',
    },
    {
      en: 'A good one-liner names the central trade — what taking the style buys and what it costs — never the feature list.',
      uk: 'Добрий однорядковик називає центральний обмін — що стиль купує і що коштує, — а не список фіч.',
    },
    {
      en: 'Negative knowledge wins reviews: the when-NOT tells are the picker\'s vetoes as prose, and each has a home-module verdict defending it in full.',
      uk: 'Негативне знання виграє review: ознаки «коли НЕ» є вето picker-а у прозі, і кожну повністю захищає вердикт рідного модуля.',
    },
    {
      en: 'Overriding a when-NOT is allowed exactly when you can say the exception sentence aloud — why the tell does not apply to this boundary.',
      uk: 'Переважити «коли НЕ» можна саме тоді, коли можеш промовити речення-виняток уголос — чому ознака не стосується цього boundary.',
    },
    {
      en: 'The seven axes outlive the styles: place any new protocol by its coordinates — MCP is a JSON-RPC envelope placed in thirty seconds — instead of by its marketing.',
      uk: 'Сім осей переживають стилі: розміщуй будь-який новий протокол за координатами — MCP є JSON-RPC конвертом, розміщеним за тридцять секунд, — а не за маркетингом.',
    },
    {
      en: 'Vocabulary is the interface to the literature: master the glossary in clusters of terms that define each other, and keep the terms themselves English.',
      uk: 'Словник є інтерфейсом до літератури: опановуй глосарій кластерами термінів, що визначають одне одного, і тримай самі терміни англійською.',
    },
  ],
  pitfalls: [
    {
      title: { en: 'Reciting without redrawing', uk: 'Декламація без перемальовування' },
      body: {
        en: 'The failure mode of flashcards: you can say all twelve lines and still not hold the models. The test is the module\'s diagram — if you cannot redraw the WebSocket upgrade or the webhook retry timeline from memory, the line is a password, not a model. Reopen the module; the gallery only tells you which one.',
        uk: 'Режим відмови флеш-карток: можеш промовити всі дванадцять рядків і все одно не тримати моделей. Тест — діаграма модуля: якщо не можеш з памʼяті перемалювати WebSocket upgrade чи timeline retry вебхука, рядок є паролем, а не моделлю. Відкрий модуль знову; галерея лише каже, який саме.',
      },
    },
    {
      title: { en: 'Reading "when NOT" as "never"', uk: 'Читання «коли НЕ» як «ніколи»' },
      body: {
        en: 'The table is a checklist of tells, not a law. Teams have shipped gRPC to browsers behind an owned proxy and OData on locked-down admin surfaces — deliberately, with the exception argued. The pitfall is skipping the argument: overriding a veto silently is how the anti-patterns of m24 are born.',
        uk: 'Таблиця є чеклистом ознак, а не законом. Команди свідомо шипили gRPC у браузери за власним proxy і OData на замкнених адмін-поверхнях — з аргументованим винятком. Пастка — пропустити аргумент: тихе переважування вето є тим, як народжуються анти-патерни m24.',
      },
    },
    {
      title: { en: 'Placing new tech by hype instead of axes', uk: 'Розміщення нового за hype, а не за осями' },
      body: {
        en: 'A new protocol arrives with a manifesto and a benchmark. Both are answers to questions nobody in your review asked. Run the axes instead — timing, flow, direction, initiative, encoding, topology, coupling — and it lands next to a style whose trade-offs this guide already taught; the manifesto rarely survives the comparison.',
        uk: 'Новий протокол приходить із маніфестом і бенчмарком. Обидва є відповідями на питання, яких ніхто на твоєму review не ставив. Натомість прожени осі — timing, flow, direction, initiative, encoding, topology, coupling — і він приземлиться поруч зі стилем, чиї trade-off-и цей гайд уже розібрав; маніфест рідко переживає порівняння.',
      },
    },
  ],
  interview: [
    {
      level: 'middle',
      q: {
        en: 'Give me one sentence each for REST, GraphQL and gRPC — and one reason you would reject each.',
        uk: 'Дай по одному реченню для REST, GraphQL і gRPC — і по одній причині відкинути кожен.',
      },
      a: {
        en: 'REST: resources with a uniform interface, trading efficiency for reach and caching — rejected where the product needs server push, because polling for "now" burns the very simplicity you chose it for. GraphQL: a typed graph where the query\'s shape is the response\'s shape — rejected as a default for plain CRUD, because you inherit N+1 and query-cost policing without collecting the client-shaping benefit. gRPC: a typed function call over HTTP/2 — rejected on a public browser-facing edge, because the proxy tax and the .proto handshake fall on callers you cannot onboard. The pattern the interviewer is listening for: each rejection names a *boundary property*, not a technology preference.',
        uk: 'REST: ресурси з uniform interface, обмін ефективності на охоплення й кешування — відкидається там, де продукту потрібен server push, бо polling заради «зараз» спалює саме ту простоту, за яку ти його обрав. GraphQL: типізований граф, де форма query і є формою відповіді — відкидається як дефолт для простого CRUD, бо успадковуєш N+1 і контроль вартості запитів, не збираючи виграшу client-shaping. gRPC: типізований виклик функції над HTTP/2 — відкидається на публічному браузерному краї, бо податок на proxy і .proto-handshake падають на викликачів, яких ти не можеш онбордити. Патерн, який слухає інтервʼюер: кожна відмова називає *властивість boundary*, а не технологічну преференцію.',
      },
    },
    {
      level: 'staff',
      q: {
        en: 'A team proposes tRPC for your new partner-facing API, arguing the whole company is TypeScript. Walk the room back.',
        uk: 'Команда пропонує tRPC для нового partner-facing API, аргументуючи тим, що вся компанія на TypeScript. Поверни кімнату назад.',
      },
      a: {
        en: 'Start on the axes, not the technology: the boundary\'s consumers are *partners* — outside the repo, outside the language guarantee, outside your deploy cycle. tRPC\'s entire contract is a TypeScript type shared through the repo (m11); the first partner on Java, or on your SDK from two versions ago, has no contract at all — that is the when-NOT line, and no company-internal fact can override it, because the boundary is not company-internal. Then price the exit: a partner API is the hardest surface to migrate later (m24\'s lock-in gradient), so the style must be chosen for the *callers you cannot see yet*. Land on the alternative rather than on "no": REST + OpenAPI gives partners self-describing JSON, generated clients in their language, and versioning discipline (m18) — and the team keeps tRPC where its bet is true, inside the monorepo. The staff move is converting "tRPC vs REST" into "which boundary is this?" — the argument then finishes itself.',
        uk: 'Починай з осей, а не з технології: споживачі цього boundary — *партнери*: поза repo, поза мовною гарантією, поза твоїм циклом деплою. Весь контракт tRPC є TypeScript-типом, поширюваним через repo (m11); перший партнер на Java — або на твоєму SDK двох версій тому — не має контракту взагалі: це і є рядок «коли НЕ», і жоден внутрішньокомпанійний факт його не переважить, бо boundary не є внутрішньокомпанійним. Далі оціни вихід: partner API — найважча поверхня для пізнішої міграції (градієнт lock-in з m24), тож стиль обирається під *викликачів, яких ти ще не бачиш*. Закінчуй альтернативою, а не «ні»: REST + OpenAPI дає партнерам self-describing JSON, згенеровані клієнти їхньою мовою і дисципліну версіонування (m18) — а команда лишає tRPC там, де його ставка правдива: всередині monorepo. Staff-хід — перетворити «tRPC чи REST» на «який це boundary?» — далі аргумент завершує себе сам.',
      },
    },
  ],
  seeAlso: ['m2-decision-axes', 'm24-decision-framework', 'm5-rest'],
  sources: [
    { title: 'Fielding, "Architectural Styles…" ch. 5 — REST (the original trade statement)', url: 'https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm' },
    { title: 'RFC 9110 — HTTP Semantics (safe & idempotent methods, the semantics JSON-RPC forfeits)', url: 'https://www.rfc-editor.org/rfc/rfc9110' },
    { title: 'GraphQL Specification (the typed graph and its query model)', url: 'https://spec.graphql.org/' },
    { title: 'gRPC — Core concepts (the cross-network function call)', url: 'https://grpc.io/docs/what-is-grpc/core-concepts/' },
    { title: 'RFC 6455 — The WebSocket Protocol (the full-duplex pipe)', url: 'https://www.rfc-editor.org/rfc/rfc6455' },
    { title: 'WHATWG HTML — Server-sent events (the response that never ends)', url: 'https://html.spec.whatwg.org/multipage/server-sent-events.html' },
  ],
};
