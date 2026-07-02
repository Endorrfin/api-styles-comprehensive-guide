import type { Module } from '../types';

/*
 * m6-odata — a query language bolted onto REST (s1, Request/Response over HTTP). Right-sized: no sim;
 * figure 'odata-query-anatomy' (the annotated query URL). Seven curriculum topics: query-over-rest →
 * $filter/$select/$expand → $orderby/$top/$skip → $metadata & CSDL → $batch → when OData wins → risks.
 * Facts web-verified S10a: OData 4.01 is the current OASIS Standard; the 4.02 parts (Protocol, URL
 * Conventions, CSDL XML/JSON) are OASIS Committee Specification Drafts (2024); CSDL has XML and (4.01+)
 * JSON representations; Microsoft Graph and SAP are the flagship deployments.
 */
export const m6: Module = {
  id: 'm6-odata',
  num: 6,
  section: 's1-req-resp-http',
  order: 2,
  level: 'senior',
  title: { en: 'OData', uk: 'OData' },
  tagline: { en: 'A query language bolted onto REST.', uk: 'Мова запитів, прикручена до REST.' },
  readMins: 12,
  mentalModel: {
    en: 'OData turns the URL into a query: REST gives you resources, OData adds a standardized **query grammar over them** — `$filter` is your WHERE, `$select` your projection, `$expand` your JOIN, `$orderby`/`$top`/`$skip` your ORDER BY and paging — all described by a machine-readable schema (`$metadata`), so generic clients (Excel, Power BI, admin grids) can query an API they have never seen.',
    uk: 'OData перетворює URL на запит: REST дає ресурси, OData додає стандартизовану **граматику запитів над ними** — `$filter` — це твій WHERE, `$select` — проєкція, `$expand` — JOIN, `$orderby`/`$top`/`$skip` — ORDER BY і пагінація — і все описано машиночитною схемою (`$metadata`), тож генеричні клієнти (Excel, Power BI, адмін-гріди) можуть запитувати API, якого ніколи не бачили.',
  },
  topics: [
    // ── T1 · A query language over REST ───────────────────────────────────────
    {
      id: 'query-over-rest',
      title: { en: 'What OData adds to REST', uk: 'Що OData додає до REST' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Plain REST (m5) answers *“give me this resource”*; the moment clients need *“give me shipped orders over €100, newest first, with their customers”* you either mint a bespoke endpoint per question or invent ad-hoc query parameters. **OData** (born at Microsoft, standardized at **OASIS — version 4.01 is the current standard**, with 4.02 in committee drafts) standardizes that second path: resources stay RESTful — entity sets at URLs, JSON payloads, normal HTTP methods — but the URL gains a **uniform query grammar** every OData service understands. One convention replaces a thousand bespoke endpoints; the flagship deployments are **Microsoft Graph** and SAP’s business APIs.',
            uk: 'Звичайний REST (m5) відповідає на *«дай мені цей ресурс»*; щойно клієнтам треба *«дай відвантажені замовлення понад €100, найновіші перші, разом із клієнтами»* — ти або карбуєш окремий endpoint під кожне питання, або вигадуєш ad-hoc query-параметри. **OData** (народжений у Microsoft, стандартизований в **OASIS — чинний стандарт 4.01**, а 4.02 — у committee drafts) стандартизує другий шлях: ресурси лишаються RESTful — entity sets за URL-ами, JSON, звичайні HTTP-методи — але URL отримує **уніфіковану граматику запитів**, яку розуміє кожен OData-сервіс. Одна конвенція замінює тисячу окремих endpoint-ів; флагманські деплої — **Microsoft Graph** і бізнес-API SAP.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'The trade in one line', uk: 'Обмін одним рядком' },
          md: {
            en: 'OData trades server control for client power: clients compose queries you never anticipated — which is precisely its value (generic tooling) and precisely its risk (unplanned load, T7). Every design decision in this module flows from that trade.',
            uk: 'OData міняє контроль сервера на силу клієнта: клієнти складають запити, яких ти не передбачав, — і саме це його цінність (генеричний тулінг), і саме це його ризик (незаплановане навантаження, T7). Кожне дизайн-рішення цього модуля випливає з цього обміну.',
          },
        },
      ],
    },
    // ── T2 · $filter / $select / $expand (figure) ─────────────────────────────
    {
      id: 'filter-select-expand',
      title: { en: '$filter, $select, $expand', uk: '$filter, $select, $expand' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The three workhorses. **`$filter`** is a real predicate language — comparison (`eq ne gt ge lt le`), logic (`and or not`), string functions (`contains`, `startswith`), arithmetic, date parts — evaluated over entity properties. **`$select`** projects only the named properties (GraphQL-style anti-over-fetching, m9, years before GraphQL). **`$expand`** inlines related entities — the JOIN — and *composes*: an expand can carry its own nested `$select`/`$filter`. Together they let one entity-set URL answer question shapes that would otherwise be N custom endpoints.',
            uk: 'Три робочі конячки. **`$filter`** — справжня мова предикатів: порівняння (`eq ne gt ge lt le`), логіка (`and or not`), рядкові функції (`contains`, `startswith`), арифметика, частини дат — обчислюється над властивостями entity. **`$select`** проєктує лише названі властивості (анти-over-fetching у стилі GraphQL, m9, за роки до GraphQL). **`$expand`** інлайнить повʼязані entity — той самий JOIN — і *компонується*: expand може нести власні вкладені `$select`/`$filter`. Разом вони дозволяють одному URL entity set-а відповідати на форми питань, які інакше були б N кастомних endpoint-ів.',
          },
        },
        {
          kind: 'figure',
          fig: 'odata-query-anatomy',
          caption: {
            en: 'One URL, a whole query: the SQL-shaped anatomy of an OData request — WHERE, projection, JOIN, ORDER BY, and paging as $-options.',
            uk: 'Один URL — цілий запит: SQL-подібна анатомія OData-запиту — WHERE, проєкція, JOIN, ORDER BY і пагінація як $-опції.',
          },
        },
        {
          kind: 'code',
          lang: 'text',
          code: `GET /odata/Orders
      ?$filter=status eq 'shipped' and total gt 100
      &$select=id,total,shippedAt
      &$expand=customer($select=name,country)
      &$orderby=shippedAt desc
      &$top=20&$skip=40
      &$count=true`,
          note: {
            en: 'Reads like SQL because it maps to SQL: WHERE … SELECT … JOIN … ORDER BY … LIMIT 20 OFFSET 40, plus a total count. That mapping is why data-grid and BI tools speak OData natively.',
            uk: 'Читається як SQL, бо мапиться на SQL: WHERE … SELECT … JOIN … ORDER BY … LIMIT 20 OFFSET 40, плюс загальний count. Саме через цей мапінг data-grid і BI-інструменти говорять OData нативно.',
          },
        },
      ],
    },
    // ── T3 · $orderby / $top / $skip ──────────────────────────────────────────
    {
      id: 'orderby-top-skip',
      title: { en: 'Ordering & paging: $orderby, $top, $skip', uk: 'Сортування й пагінація: $orderby, $top, $skip' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: '**`$orderby`** sorts (multi-key, `asc`/`desc`); **`$top`/`$skip`** are LIMIT/OFFSET paging; **`$count=true`** adds the total. Two senior notes. First, this is **offset paging** with all its known pathologies (m20): deep `$skip` gets slower and rows shift under concurrent writes — so OData services also support **server-driven paging**: the server caps the page itself and returns an **`@odata.nextLink`** continuation URL; well-behaved clients just follow it. Second, ordering only composes with paging when the sort key is **stable and indexed** — a client free to `$orderby` any property is a client free to force a full table scan (T7 again).',
            uk: '**`$orderby`** сортує (кілька ключів, `asc`/`desc`); **`$top`/`$skip`** — LIMIT/OFFSET пагінація; **`$count=true`** додає загальну кількість. Дві senior-нотатки. Перша: це **offset-пагінація** з усіма її відомими патологіями (m20): глибокий `$skip` дедалі повільніший, а рядки зсуваються під паралельними записами — тож OData-сервіси також підтримують **server-driven paging**: сервер сам обмежує сторінку й повертає continuation-URL **`@odata.nextLink`**; чемні клієнти просто йдуть за ним. Друга: сортування дружить із пагінацією лише коли ключ сортування **стабільний та індексований** — клієнт, вільний зробити `$orderby` за будь-якою властивістю, вільний і змусити повний скан таблиці (знову T7).',
          },
        },
      ],
    },
    // ── T4 · $metadata & CSDL ─────────────────────────────────────────────────
    {
      id: 'metadata-csdl',
      title: { en: '$metadata & CSDL: the machine-readable schema', uk: '$metadata і CSDL: машиночитна схема' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'What makes generic clients possible is that every OData service self-describes: `GET /odata/$metadata` returns a **CSDL** (Common Schema Definition Language) document — entity types with properties, keys, relationships, and the operations exposed. CSDL has an **XML representation** and, since 4.01, a **JSON representation**. Tools consume it the way gRPC tooling consumes protobuf IDL (m10) or GraphQL tooling consumes SDL (m9): Excel/Power BI build query UIs, code generators emit typed clients, admin frameworks scaffold grids — all without you writing docs. The pattern to notice across the guide: **contract-first tooling needs a machine-readable contract**, whatever its spelling.',
            uk: 'Генеричні клієнти можливі тому, що кожен OData-сервіс самоописується: `GET /odata/$metadata` повертає документ **CSDL** (Common Schema Definition Language) — entity types із властивостями, ключами, звʼязками та відкритими операціями. CSDL має **XML-представлення** і, з 4.01, — **JSON-представлення**. Інструменти споживають його так само, як gRPC-тулінг споживає protobuf IDL (m10), а GraphQL-тулінг — SDL (m9): Excel/Power BI будують UI запитів, кодогенератори — типізовані клієнти, адмін-фреймворки — гріди, і все без написаної тобою документації. Патерн, який варто помітити крізь увесь гід: **contract-first тулінгу потрібен машиночитний контракт**, як би він не писався.',
          },
        },
      ],
    },
    // ── T5 · $batch ───────────────────────────────────────────────────────────
    {
      id: 'batch',
      title: { en: '$batch: many operations, one request', uk: '$batch: багато операцій, один запит' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: '`POST /odata/$batch` packs multiple operations into one HTTP request — classically as a `multipart/mixed` body of serialized sub-requests, and since 4.01 in a cleaner **JSON batch format**. Reads cut round trips; writes can be grouped into an atomic **change set** — all succeed or all fail. But note what your infrastructure loses: a batch is a `POST` opaque blob, so per-request **HTTP caching, logging, rate limiting and authorization become invisible at the gateway** and must be re-implemented inside the batch handler. With HTTP/2 multiplexing (m3) shrinking the cost of many small requests, reach for `$batch` for atomic change sets, not as a reflex.',
            uk: '`POST /odata/$batch` пакує кілька операцій в один HTTP-запит — класично як `multipart/mixed` тіло з серіалізованими під-запитами, а з 4.01 — у чистішому **JSON batch форматі**. Читання зрізають round trips; записи можна згрупувати в атомарний **change set** — або всі успішні, або всі відкочені. Але зваж, що втрачає твоя інфраструктура: batch — це непрозорий blob у `POST`, тож per-request **HTTP-кешування, логування, rate limiting та авторизація стають невидимими на gateway** і мусять бути перевтілені всередині batch-handler-а. З HTTP/2-мультиплексуванням (m3), що здешевлює багато малих запитів, бери `$batch` заради атомарних change set-ів, а не рефлекторно.',
          },
        },
      ],
    },
    // ── T6 · When OData wins ──────────────────────────────────────────────────
    {
      id: 'when-odata-wins',
      title: { en: 'When OData wins', uk: 'Коли OData виграє' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'OData shines where the API’s job is **exposing a data model to query-hungry, generic consumers**: enterprise/internal data services behind admin UIs and data grids; BI and reporting paths (Excel, Power BI and friends connect natively); products in the Microsoft/SAP gravity well where the ecosystem already speaks it; any place you’d otherwise grow endpoint-per-report sprawl. It solves the same over-/under-fetching pain as GraphQL (m9) with plainer HTTP: GETs with query strings — cacheable in principle, no new runtime, no resolvers. If your consumers are *known apps with curated screens*, REST endpoints stay simpler; if they’re *analysts with questions you can’t predict*, OData’s grammar earns its keep.',
            uk: 'OData сяє там, де робота API — **відкрити модель даних генеричним, спраглим до запитів споживачам**: enterprise/внутрішні data-сервіси за адмін-UI та data-грідами; BI і звітність (Excel, Power BI і друзі підключаються нативно); продукти в гравітаційному полі Microsoft/SAP, де екосистема вже ним говорить; будь-яке місце, де інакше розростається endpoint-на-звіт. Він розвʼязує той самий біль over-/under-fetching, що й GraphQL (m9), але простішим HTTP: GET-и з query string — у принципі кешовані, без нового runtime, без resolver-ів. Якщо твої споживачі — *відомі застосунки з кураторськими екранами*, REST-endpoint-и простіші; якщо це *аналітики з питаннями, яких не передбачиш*, — граматика OData відпрацьовує своє.',
          },
        },
        {
          kind: 'compare',
          a: { en: 'Reach for OData', uk: 'Бери OData' },
          b: { en: 'Prefer plain REST / GraphQL', uk: 'Обери звичайний REST / GraphQL' },
          rows: [
            [
              { en: 'Consumers', uk: 'Споживачі' },
              { en: 'Generic tools: BI, Excel, admin grids', uk: 'Генеричні інструменти: BI, Excel, адмін-гріди' },
              { en: 'Known apps with curated screens → REST', uk: 'Відомі застосунки з кураторськими екранами → REST' },
            ],
            [
              { en: 'Question shape', uk: 'Форма питань' },
              { en: 'Unpredictable ad-hoc queries over one model', uk: 'Непередбачувані ad-hoc запити над однією моделлю' },
              { en: 'Cross-service graph traversal → GraphQL', uk: 'Обхід графа крізь сервіси → GraphQL' },
            ],
            [
              { en: 'Transport', uk: 'Транспорт' },
              { en: 'Plain GETs — cacheable, no new runtime', uk: 'Звичайні GET-и — кешовані, без нового runtime' },
              { en: 'GraphQL brings its own POST endpoint + runtime', uk: 'GraphQL приносить власний POST-endpoint + runtime' },
            ],
            [
              { en: 'Ecosystem', uk: 'Екосистема' },
              { en: 'Microsoft/SAP world speaks it natively', uk: 'Світ Microsoft/SAP говорить ним нативно' },
              { en: 'Outside it, client libraries thin out fast', uk: 'Поза ним клієнтські бібліотеки швидко ріднуть' },
            ],
          ],
        },
      ],
    },
    // ── T7 · Risks + the verdict ──────────────────────────────────────────────
    {
      id: 'risks',
      title: { en: 'Risks: the price of client-side power', uk: 'Ризики: ціна сили на боці клієнта' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Handing clients a query language is handing them your database’s worst day. The risk cluster: **unbounded queries** (a `$filter` over an unindexed property + deep `$skip` + a triple `$expand` = a full-scan JOIN you never planned); **cardinality explosions** via nested `$expand`; **authorization leaks** — row- and column-level rules must hold for *every expressible query shape*, not just the screens you built (an `$expand` reaching a related entity the user shouldn’t see is the classic hole); and **cache futility** — an infinite URL space defeats naive response caching. Mitigations are non-optional: cap `$top` and expansion depth, allowlist filterable/sortable/expandable properties (map them to indexes), enforce authorization *inside* the query pipeline, set statement timeouts, and monitor slow-query shapes like you would raw SQL.',
            uk: 'Дати клієнтам мову запитів — це дати їм найгірший день твоєї бази. Кластер ризиків: **необмежені запити** (`$filter` за неіндексованою властивістю + глибокий `$skip` + потрійний `$expand` = full-scan JOIN, якого ти не планував); **вибухи кардинальності** через вкладені `$expand`; **дірки авторизації** — правила рівня рядків і колонок мають триматися для *кожної виразимої форми запиту*, а не лише для збудованих тобою екранів (класична дірка — `$expand`, що дотягується до повʼязаної entity, якої користувачу не можна бачити); і **марність кешу** — нескінченний простір URL-ів ламає наївне кешування відповідей. Мітигації обовʼязкові: обмеж `$top` і глибину expand, тримай allowlist властивостей для filter/sort/expand (мапуй їх на індекси), застосовуй авторизацію *всередині* конвеєра запиту, став statement timeouts і моніторь повільні форми запитів, як моніторив би сирий SQL.',
          },
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'Authorize the query, not the endpoint', uk: 'Авторизуй запит, а не endpoint' },
          md: {
            en: 'REST authorization habits assume you know each endpoint’s data shape. OData breaks that assumption: one endpoint expresses arbitrarily many shapes, so “can this user call /Orders?” is the wrong question — “can this user see every row, column, and expansion this *particular query* touches?” is the right one. Evaluate policy over the parsed query tree, and treat every new expandable relationship as a new attack surface.',
            uk: 'Звички REST-авторизації припускають, що ти знаєш форму даних кожного endpoint-а. OData ламає це припущення: один endpoint виражає довільно багато форм, тож «чи може цей користувач викликати /Orders?» — неправильне питання; правильне — «чи може він бачити кожен рядок, колонку та expand, яких торкається *саме цей запит*?». Обчислюй політику над розібраним деревом запиту і вважай кожен новий expandable-звʼязок новою поверхнею атаки.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'The verdict', uk: 'Вердикт' },
          md: {
            en: 'Use OData for data-centric internal/enterprise APIs consumed by generic tools — BI, grids, the Microsoft/SAP ecosystem — where one queryable model beats endpoint sprawl. Avoid it for public APIs with unknown callers (the risk surface is huge), for curated product screens (plain REST is simpler), and for cross-service graphs (GraphQL, m9, with its persisted-query discipline). If you adopt it, adopt the guardrails the same day: caps, allowlists, query-level authorization, timeouts.',
            uk: 'Бери OData для data-центричних внутрішніх/enterprise API, які споживають генеричні інструменти — BI, гріди, екосистема Microsoft/SAP — де одна запитувана модель бʼє розростання endpoint-ів. Уникай його для публічних API з невідомими викликачами (поверхня ризику величезна), для кураторських продуктових екранів (звичайний REST простіший) і для міжсервісних графів (GraphQL, m9, з його дисципліною persisted queries). Якщо береш — бери запобіжники того ж дня: ліміти, allowlist-и, авторизацію рівня запиту, timeouts.',
          },
        },
      ],
    },
  ],
  keyPoints: [
    { en: 'OData standardizes a query grammar over REST resources: $filter (WHERE), $select (projection), $expand (JOIN), $orderby/$top/$skip (sort + paging) — one convention instead of endpoint sprawl.', uk: 'OData стандартизує граматику запитів над REST-ресурсами: $filter (WHERE), $select (проєкція), $expand (JOIN), $orderby/$top/$skip (сортування + пагінація) — одна конвенція замість розростання endpoint-ів.' },
    { en: 'Every service self-describes via $metadata (CSDL, XML or JSON since 4.01) — that machine-readable contract is what lets Excel/Power BI/grids query APIs they have never seen.', uk: 'Кожен сервіс самоописується через $metadata (CSDL, XML або JSON з 4.01) — саме цей машиночитний контракт дозволяє Excel/Power BI/грідам запитувати API, яких вони ніколи не бачили.' },
    { en: 'OData 4.01 is the current OASIS Standard (4.02 in committee drafts); Microsoft Graph and SAP are the flagship real-world deployments.', uk: 'OData 4.01 — чинний стандарт OASIS (4.02 — у committee drafts); Microsoft Graph і SAP — флагманські реальні деплої.' },
    { en: '$skip/$top is offset paging with known pathologies — prefer the server-driven @odata.nextLink continuation for deep or hot collections.', uk: '$skip/$top — offset-пагінація з відомими патологіями; для глибоких чи гарячих колекцій обирай server-driven continuation @odata.nextLink.' },
    { en: '$batch packs operations (and atomic change sets) into one POST — at the cost of gateway-visible caching, logging, limits and auth for the sub-requests.', uk: '$batch пакує операції (та атомарні change sets) в один POST — ціною видимості кешування, логування, лімітів і auth для під-запитів на gateway.' },
    { en: 'Client-side query power is the risk: cap $top and expand depth, allowlist queryable properties, authorize the parsed query (not the endpoint), and set timeouts.', uk: 'Сила запитів на боці клієнта — це і є ризик: обмежуй $top і глибину expand, тримай allowlist властивостей, авторизуй розібраний запит (а не endpoint) і став timeouts.' },
  ],
  pitfalls: [
    {
      title: { en: 'Exposing the whole model, unguarded', uk: 'Відкрити всю модель без запобіжників' },
      body: {
        en: 'Auto-generating an OData endpoint over your entire schema hands clients unindexed full scans, unbounded $expand joins, and relationships you never meant to be reachable. Curate the exposed model, allowlist filter/sort/expand properties, and cap page size and depth from day one.',
        uk: 'Автогенерація OData-endpoint-а над усією схемою дарує клієнтам full-scan-и без індексів, необмежені JOIN-и через $expand і звʼязки, які ти не збирався відкривати. Куруй відкриту модель, тримай allowlist властивостей для filter/sort/expand і обмежуй розмір сторінки та глибину з першого дня.',
      },
    },
    {
      title: { en: 'Endpoint-level authorization on a query-level API', uk: 'Авторизація рівня endpoint-а на API рівня запитів' },
      body: {
        en: '“User may GET /Orders” says nothing about which rows, columns, or expansions they may see — one crafted $expand can tunnel into data the screens never showed. Enforce row/column policy inside the query pipeline, per query shape.',
        uk: '«Користувач може GET /Orders» нічого не каже про те, які рядки, колонки чи expand-и йому можна бачити — один хитрий $expand тунелює в дані, яких екрани ніколи не показували. Застосовуй політику рядків/колонок усередині конвеєра запиту, на кожну форму запиту.',
      },
    },
    {
      title: { en: 'Treating OData as a general-purpose public API style', uk: 'Вважати OData універсальним стилем публічного API' },
      body: {
        en: 'Outside the Microsoft/SAP gravity well, client libraries and team familiarity thin out fast, and the attack/load surface of an open query language is hard to justify to unknown callers. For public products, curated REST (or GraphQL with persisted queries) is usually the saner contract.',
        uk: 'Поза гравітаційним полем Microsoft/SAP клієнтські бібліотеки й обізнаність команд швидко ріднуть, а поверхню атаки/навантаження відкритої мови запитів важко виправдати перед невідомими викликачами. Для публічних продуктів кураторський REST (чи GraphQL із persisted queries) — зазвичай розсудливіший контракт.',
      },
    },
  ],
  interview: [
    {
      q: { en: 'Your admin UI team asks for OData over the orders database. What do you set up before the first query lands?', uk: 'Команда адмін-UI просить OData над базою замовлень. Що ти налаштуєш до того, як прилетить перший запит?' },
      a: {
        en: 'First the exposed model: a curated entity model — not the raw schema — with only the entity sets, properties and navigation paths the UI actually needs. Then the guardrails, because OData hands clients a query language: a hard cap on $top and a default server-driven page with @odata.nextLink; an allowlist of filterable/sortable/expandable properties, each mapped to an index; a maximum $expand depth and width; statement timeouts at the database. Authorization moves from endpoint-level to query-level: policy is evaluated over the parsed query tree so row- and column-rules hold for every expressible shape, including expansions into related entities. Operationally: log and monitor query shapes like raw SQL (slowest predicates, deepest expands), and rate-limit by cost, not just request count. And I would confirm the consumers genuinely are generic/query-hungry (grids, BI, Excel) — if it is really three fixed screens, plain REST endpoints are simpler and safer.',
        uk: 'Спершу відкрита модель: кураторська entity-модель — не сира схема — лише з тими entity sets, властивостями й navigation-шляхами, які справді потрібні UI. Далі запобіжники, бо OData дає клієнтам мову запитів: жорсткий ліміт $top і server-driven сторінка за замовчуванням із @odata.nextLink; allowlist властивостей для filter/sort/expand, кожна змапована на індекс; максимальні глибина й ширина $expand; statement timeouts у базі. Авторизація зсувається з рівня endpoint-а на рівень запиту: політика обчислюється над розібраним деревом запиту, щоб правила рядків і колонок трималися для кожної виразимої форми, включно з expand-ами в повʼязані entity. Операційно: логуй і моніторь форми запитів як сирий SQL (найповільніші предикати, найглибші expand-и) і rate-limit-и за вартістю, а не лише за кількістю запитів. І я б підтвердив, що споживачі справді генеричні/спраглі до запитів (гріди, BI, Excel) — якщо це насправді три фіксовані екрани, звичайні REST-endpoint-и простіші й безпечніші.',
      },
      level: 'senior',
    },
  ],
  seeAlso: ['m5-rest', 'm9-graphql', 'm20-pagination-limits', 'm22-security-threats', 'm3-http-transport'],
  sources: [
    { title: 'OASIS — OData Version 4.01 Part 1: Protocol (the current standard)', url: 'https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html' },
    { title: 'OASIS — OData Version 4.02 Part 1: Protocol (committee draft)', url: 'https://docs.oasis-open.org/odata/odata/v4.02/odata-v4.02-part1-protocol.html' },
    { title: 'OASIS — OData CSDL JSON Representation 4.02 (committee draft)', url: 'https://oasis-tcs.github.io/odata-specs/odata-csdl-json/odata-csdl-json.html' },
    { title: 'OData.org — Understand OData in 6 steps', url: 'https://www.odata.org/getting-started/understand-odata-in-6-steps/' },
    { title: 'Microsoft Graph — Use query parameters ($filter, $select, $expand…)', url: 'https://learn.microsoft.com/en-us/graph/query-parameters' },
    { title: 'Microsoft — OData security guidance (query limits, validation)', url: 'https://learn.microsoft.com/en-us/odata/webapi/odata-security' },
  ],
};
