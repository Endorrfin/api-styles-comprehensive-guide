import type { Module } from '../types';

/*
 * m5-rest — GOLDEN module (s2). The baseline every other style is compared against.
 * Signature sim: 'rest-request-lifecycle'. Figures: 'rest-anatomy', 'http-status-classes'.
 * Facts verified S1–S2: RFC 9110 (HTTP Semantics), RFC 9111 (Caching), RFC 9457 (Problem Details),
 * Fielding's dissertation (REST), Richardson Maturity Model (Fowler), MDN HTTP.
 */
export const m5: Module = {
  id: 'm5-rest',
  num: 5,
  section: 's1-req-resp-http',
  order: 1,
  level: 'middle',
  signature: true,
  title: { en: 'REST', uk: 'REST' },
  tagline: {
    en: 'Resources, a uniform interface, and HTTP used as intended — the baseline every other style is measured against.',
    uk: 'Ресурси, uniform interface і HTTP за призначенням — baseline, з яким порівнюють кожен інший стиль.',
  },
  readMins: 18,
  mentalModel: {
    en: 'REST is not "JSON over HTTP". It is a set of constraints — resources with a uniform interface, stateless requests, cacheable responses — that trade raw efficiency for evolvability, visibility, and scale.',
    uk: 'REST — це не «JSON над HTTP». Це набір обмежень — ресурси з uniform interface, stateless-запити, кешовані відповіді — що обмінюють сиру ефективність на evolvability, видимість і масштаб.',
  },
  topics: [
    // ── T1 · Resources & the uniform interface ───────────────────────────────
    {
      id: 'resources-and-uniform-interface',
      title: { en: 'Resources & the uniform interface', uk: 'Ресурси та uniform interface' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'REST is an **architectural style**, defined by Roy Fielding in 2000, not a protocol or a format. Its core idea: model everything worth exposing as a **resource** — a user, an order, a search result — each named by a stable URL. You never call a *method* on the server; you transfer **representations** of resources (a JSON or XML snapshot) using a small, fixed vocabulary of HTTP operations. That fixed vocabulary is the **uniform interface**, and it is what makes REST feel predictable: once you know how one resource behaves, you know how all of them behave.',
            uk: 'REST — це **архітектурний стиль**, визначений Roy Fielding у 2000, а не протокол чи формат. Головна ідея: моделюй усе варте експонування як **ресурс** — користувача, замовлення, результат пошуку — кожен з іменем-URL. Ти ніколи не викликаєш *метод* на сервері; ти передаєш **representations** ресурсів (JSON- чи XML-знімок) невеликим фіксованим словником HTTP-операцій. Цей фіксований словник — **uniform interface**, і саме він робить REST передбачуваним: знаєш, як поводиться один ресурс — знаєш усі.',
          },
        },
        {
          kind: 'figure',
          fig: 'rest-anatomy',
          caption: {
            en: 'Anatomy of a REST exchange: a method + resource URL + headers travel up; a status code + headers + representation travel back.',
            uk: 'Анатомія REST-обміну: метод + URL ресурсу + заголовки йдуть угору; статус-код + заголовки + representation повертаються.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: 'Two more constraints do the heavy lifting. **Statelessness:** each request carries everything the server needs to understand it — no session stored server-side between calls — so any node in a pool can answer, which is why REST scales horizontally so cleanly. **Cacheability:** responses declare whether and how long they may be reused, letting browsers, CDNs and proxies answer on the server’s behalf. These are not incidental; they are the source of REST’s strengths *and* its limits.',
            uk: 'Ще два обмеження роблять основну роботу. **Statelessness:** кожен запит несе все потрібне серверу — жодної сесії на боці сервера між викликами — тож будь-який вузол пулу може відповісти, і саме тому REST так чисто масштабується горизонтально. **Cacheability:** відповіді декларують, чи і як довго їх можна перевикористати, дозволяючи браузерам, CDN і проксі відповідати замість сервера. Це не випадковість; це джерело і сильних сторін REST, *і* його обмежень.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Statelessness is a scaling decision, not a religion', uk: 'Statelessness — це рішення про масштаб, а не релігія' },
          md: {
            en: 'Because no per-client state lives on the server, a load balancer can route any request to any instance. The cost you pay is redundant context on every request (auth token, filters, pagination cursor). That trade — a fatter request for a stateless fleet — is exactly what lets REST APIs run behind a CDN with dozens of interchangeable nodes.',
            uk: 'Оскільки на сервері немає per-client стану, балансувальник може направити будь-який запит на будь-який інстанс. Ціна — надлишковий контекст у кожному запиті (auth token, фільтри, cursor пагінації). Саме цей обмін — товщий запит заради stateless-флоту — дозволяє REST API працювати за CDN із десятками взаємозамінних вузлів.',
          },
        },
      ],
    },
    // ── T2 · The request lifecycle (SIM) ─────────────────────────────────────
    {
      id: 'the-request-lifecycle',
      title: { en: 'The request lifecycle', uk: 'Життєвий цикл запиту' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The best way to *feel* REST is to watch a request move through the system. The simulator below sends a `GET` for a resource and walks it through the stages every real REST call passes: **client → cache lookup → conditional revalidation → origin handler → response**. Toggle a warm cache and an `ETag`, and watch the same URL resolve in one round-trip, a cheap `304 Not Modified`, or a full origin fetch — the difference between a fast API and a slow one is almost always here, not in the handler.',
            uk: 'Найкраще *відчути* REST — простежити, як запит рухається системою. Симулятор нижче надсилає `GET` за ресурсом і проводить його через стадії, які проходить кожен реальний REST-виклик: **client → cache lookup → conditional revalidation → origin handler → response**. Увімкни теплий кеш і `ETag` — і побач, як той самий URL резолвиться за один round-trip, дешевий `304 Not Modified` або повний origin-fetch — різниця між швидким і повільним API майже завжди тут, а не в handler.',
          },
        },
        {
          kind: 'sim',
          sim: 'rest-request-lifecycle',
          caption: {
            en: 'Step a GET through the REST pipeline. Flip cache/ETag and climb the Richardson maturity ladder to see how each choice changes the round-trip.',
            uk: 'Проведи GET через REST-пайплайн. Перемикай cache/ETag і піднімайся драбиною Richardson, щоб побачити, як кожен вибір змінює round-trip.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Read the stages, not just the result', uk: 'Читай стадії, а не лише результат' },
          md: {
            en: 'A `200` and a `304` both "work", but the `304` skips serialization and transfers almost no bytes. When an endpoint is slow, ask which stage it stops at — most latency wins come from moving work *earlier* in this pipeline (cache, then revalidate) rather than optimizing the origin handler.',
            uk: 'І `200`, і `304` «працюють», але `304` пропускає серіалізацію і майже не передає байтів. Коли endpoint повільний, питай, на якій стадії він зупиняється — більшість виграшів latency — це перенесення роботи *раніше* в пайплайні (кеш, потім revalidate), а не оптимізація origin-handler.',
          },
        },
      ],
    },
    // ── T3 · Methods: safe & idempotent ──────────────────────────────────────
    {
      id: 'methods-safe-idempotent',
      title: { en: 'Methods: safe & idempotent', uk: 'Методи: safe та idempotent' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The uniform interface is a handful of methods with **defined semantics** (RFC 9110). Two properties matter most for correctness. A method is **safe** if it does not change server state (a `GET` should never place an order). A method is **idempotent** if sending it *N* times has the same effect as sending it once — which is what makes a retry safe after a dropped connection. Get these wrong and a flaky network turns one order into three.',
            uk: 'Uniform interface — це кілька методів із **визначеною семантикою** (RFC 9110). Дві властивості найважливіші для коректності. Метод **safe**, якщо не змінює стан сервера (`GET` не має створювати замовлення). Метод **idempotent**, якщо надсилання його *N* разів дає той самий ефект, що й один раз — саме це робить retry безпечним після обриву зʼєднання. Помилися тут — і нестабільна мережа перетворить одне замовлення на три.',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Method', uk: 'Метод' },
            { en: 'Safe', uk: 'Safe' },
            { en: 'Idempotent', uk: 'Idempotent' },
            { en: 'Typical use', uk: 'Типове використання' },
          ],
          rows: [
            [
              { en: 'GET', uk: 'GET' },
              { en: 'Yes', uk: 'Так' },
              { en: 'Yes', uk: 'Так' },
              { en: 'Read a resource / collection', uk: 'Читання ресурсу / колекції' },
            ],
            [
              { en: 'POST', uk: 'POST' },
              { en: 'No', uk: 'Ні' },
              { en: 'No', uk: 'Ні' },
              { en: 'Create / non-idempotent action', uk: 'Створення / неідемпотентна дія' },
            ],
            [
              { en: 'PUT', uk: 'PUT' },
              { en: 'No', uk: 'Ні' },
              { en: 'Yes', uk: 'Так' },
              { en: 'Replace a resource at a known URL', uk: 'Заміна ресурсу за відомим URL' },
            ],
            [
              { en: 'PATCH', uk: 'PATCH' },
              { en: 'No', uk: 'Ні' },
              { en: 'Not necessarily', uk: 'Не обовʼязково' },
              { en: 'Partial update', uk: 'Часткове оновлення' },
            ],
            [
              { en: 'DELETE', uk: 'DELETE' },
              { en: 'No', uk: 'Ні' },
              { en: 'Yes', uk: 'Так' },
              { en: 'Remove a resource', uk: 'Видалення ресурсу' },
            ],
          ],
          caption: {
            en: 'RFC 9110 method semantics. Idempotent methods are safe to retry after a timeout; POST is not — which is why mutating POSTs need an idempotency key.',
            uk: 'Семантика методів RFC 9110. Idempotent-методи безпечно повторювати після timeout; POST — ні, тому мутуючі POST потребують idempotency key.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'Make POST retriable with an idempotency key', uk: 'Зроби POST повторюваним через idempotency key' },
          md: {
            en: 'Because `POST` is not idempotent, a client that retries after a dropped connection can create a duplicate. The fix is a client-supplied `Idempotency-Key` header: the server records the key with the result and returns the original response on any replay — one effect, no matter how many retries.',
            uk: 'Оскільки `POST` не idempotent, клієнт, що повторює після обриву, може створити дублікат. Рішення — наданий клієнтом заголовок `Idempotency-Key`: сервер запамʼятовує ключ із результатом і повертає оригінальну відповідь на будь-який replay — один ефект, скільки б не було retries.',
          },
        },
      ],
    },
    // ── T4 · Status codes & error semantics ──────────────────────────────────
    {
      id: 'status-codes-and-errors',
      title: { en: 'Status codes & error semantics', uk: 'Статус-коди та семантика помилок' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The **status code** is the first, machine-readable line of every response — and the part REST APIs most often get wrong (the infamous `200 OK` wrapping `{ "error": true }`). Codes come in five classes; the client should be able to branch on the class before parsing the body.',
            uk: '**Статус-код** — перший, машиночитний рядок кожної відповіді — і саме те, що REST API найчастіше роблять неправильно (сумнозвісний `200 OK`, що загортає `{ "error": true }`). Коди діляться на пʼять класів; клієнт має вміти розгалужуватись за класом ще до парсингу тіла.',
          },
        },
        {
          kind: 'figure',
          fig: 'http-status-classes',
          caption: {
            en: 'The five status classes. Branch on the class first (2xx/3xx/4xx/5xx), then read the body for detail.',
            uk: 'Пʼять класів статусів. Спершу розгалужуйся за класом (2xx/3xx/4xx/5xx), потім читай тіло по деталі.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: 'For error *bodies*, stop inventing shapes. **RFC 9457 "Problem Details"** (which obsoletes RFC 7807) defines a standard JSON object — `type`, `title`, `status`, `detail`, `instance` — served as `application/problem+json`. One shape your whole platform (and its clients) can rely on.',
            uk: 'Для *тіл* помилок припини вигадувати форми. **RFC 9457 «Problem Details»** (замінює RFC 7807) визначає стандартний JSON-обʼєкт — `type`, `title`, `status`, `detail`, `instance` — що віддається як `application/problem+json`. Одна форма, на яку може покладатися вся платформа (і її клієнти).',
          },
        },
        {
          kind: 'code',
          lang: 'http',
          code: `HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json

{
  "type": "https://api.example.com/problems/out-of-stock",
  "title": "Item out of stock",
  "status": 422,
  "detail": "SKU-42 has 0 units available.",
  "instance": "/orders/8f2c"
}`,
          note: {
            en: 'RFC 9457 Problem Details — a typed, self-describing error the client can branch on without guessing.',
            uk: 'RFC 9457 Problem Details — типізована самоописова помилка, на яку клієнт реагує без здогадок.',
          },
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'Leak nothing in error detail', uk: 'Нічого не зливай у деталі помилки' },
          md: {
            en: 'A `detail` string is developer-facing text, not a place for stack traces, SQL, or internal hostnames. Return a stable `type` URI the client can match on, and keep sensitive diagnostics in your server logs behind the trace id.',
            uk: 'Рядок `detail` — це текст для розробника, а не місце для stack trace, SQL чи внутрішніх hostname. Повертай стабільний `type`-URI, на який клієнт може матчитись, а чутливу діагностику тримай у логах сервера за trace id.',
          },
        },
      ],
    },
    // ── T5 · Caching & conditional requests ──────────────────────────────────
    {
      id: 'caching-and-conditional-requests',
      title: { en: 'Caching & conditional requests', uk: 'Кешування та conditional requests' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Caching is REST’s super-power and the reason a well-designed API can serve millions of reads cheaply. **RFC 9111** governs it. A response uses `Cache-Control` (e.g. `max-age`, `no-cache`, `private`) to say how long it stays *fresh*. When it goes stale, the client **revalidates** cheaply with a **conditional request**: it sends the resource’s `ETag` back in `If-None-Match`, and the server answers `304 Not Modified` with no body if nothing changed. The same `ETag` in `If-Match` on a write gives you **optimistic concurrency** — a lost-update guard for free.',
            uk: 'Кешування — суперсила REST і причина, чому добре спроєктований API дешево віддає мільйони читань. Ним керує **RFC 9111**. Відповідь використовує `Cache-Control` (напр. `max-age`, `no-cache`, `private`), щоб сказати, як довго вона *свіжа*. Коли протухає, клієнт дешево **revalidate** через **conditional request**: надсилає `ETag` ресурсу в `If-None-Match`, а сервер відповідає `304 Not Modified` без тіла, якщо нічого не змінилось. Той самий `ETag` в `If-Match` на записі дає **optimistic concurrency** — захист від lost-update безкоштовно.',
          },
        },
        {
          kind: 'code',
          lang: 'http',
          code: `# 1) First read — server returns a validator
GET /articles/42
→ 200 OK
  ETag: "a1b2c3"
  Cache-Control: max-age=60

# 2) After max-age — revalidate instead of refetch
GET /articles/42
  If-None-Match: "a1b2c3"
→ 304 Not Modified        # no body; near-zero bytes

# 3) Safe write — reject a stale update
PUT /articles/42
  If-Match: "a1b2c3"
→ 412 Precondition Failed  # someone edited it first`,
          note: {
            en: 'One validator (ETag) powers both cheap revalidation (304) and lost-update protection (412).',
            uk: 'Один валідатор (ETag) живить і дешеву revalidation (304), і захист від lost-update (412).',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Cache the reads, not the writes', uk: 'Кешуй читання, а не записи' },
          md: {
            en: 'Only safe, idempotent responses are cacheable. The lever most teams underuse is `ETag` + `If-None-Match` on collections and hot resources — it collapses bandwidth without any staleness risk, because the origin still gets the final say on every revalidation.',
            uk: 'Кешованими є лише safe, idempotent відповіді. Важіль, який більшість недовикористовує — `ETag` + `If-None-Match` на колекціях і гарячих ресурсах — він обвалює трафік без ризику застарілості, бо origin усе одно вирішує на кожній revalidation.',
          },
        },
      ],
    },
    // ── T6 · Richardson maturity & HATEOAS ───────────────────────────────────
    {
      id: 'richardson-maturity-and-hateoas',
      title: { en: 'Richardson maturity & HATEOAS', uk: 'Richardson maturity та HATEOAS' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The **Richardson Maturity Model** grades how much of HTTP an API actually uses. **Level 0:** one URL, one verb (`POST`) — RPC in disguise. **Level 1:** many resources, still one verb. **Level 2:** resources *and* HTTP verbs + status codes used correctly — where most "REST" APIs live, and honestly, where most should. **Level 3:** **HATEOAS** — responses embed links telling the client what it can do next, so the client navigates by following links rather than hard-coding URLs.',
            uk: '**Richardson Maturity Model** оцінює, скільки HTTP насправді використовує API. **Level 0:** один URL, одне дієслово (`POST`) — RPC під маскою. **Level 1:** багато ресурсів, досі одне дієслово. **Level 2:** ресурси *і* HTTP-дієслова + коректні статус-коди — де живе більшість «REST» API, і, чесно, де більшості й варто. **Level 3:** **HATEOAS** — відповіді містять лінки, що кажуть клієнту, що робити далі, тож клієнт навігує за лінками, а не хардкодить URL.',
          },
        },
        {
          kind: 'compare',
          a: { en: 'Level 2 (verbs + status)', uk: 'Level 2 (дієслова + статус)' },
          b: { en: 'Level 3 (HATEOAS)', uk: 'Level 3 (HATEOAS)' },
          rows: [
            [
              { en: 'Client knows URLs', uk: 'Клієнт знає URL' },
              { en: 'Hard-codes URL templates', uk: 'Хардкодить шаблони URL' },
              { en: 'Follows links from responses', uk: 'Йде за лінками з відповідей' },
            ],
            [
              { en: 'Coupling', uk: 'Coupling' },
              { en: 'Tighter — URL changes break clients', uk: 'Тісніший — зміна URL ламає клієнтів' },
              { en: 'Looser — server can move resources', uk: 'Вільніший — сервер може рухати ресурси' },
            ],
            [
              { en: 'Real-world adoption', uk: 'Реальне поширення' },
              { en: 'The pragmatic default', uk: 'Прагматичний дефолт' },
              { en: 'Rare; shines in long-lived hypermedia APIs', uk: 'Рідкісний; сяє в довгоживучих hypermedia API' },
            ],
          ],
        },
        {
          kind: 'prose',
          md: {
            en: 'Be honest about Level 3: full HATEOAS is elegant but rarely pays off, because most clients are written against a known contract and *do* hard-code paths. Reach for it when clients and server evolve independently over years (long-lived platform APIs). For a typical product API, a clean Level 2 with great docs beats a half-built Level 3.',
            uk: 'Будь чесним щодо Level 3: повний HATEOAS елегантний, але рідко окуповується, бо більшість клієнтів пишуть під відомий контракт і *таки* хардкодять шляхи. Бери його, коли клієнти й сервер еволюціонують незалежно роками (довгоживучі платформні API). Для типового продуктового API чистий Level 2 із гарними доками кращий за недобудований Level 3.',
          },
        },
      ],
    },
    // ── T7 · Content negotiation ─────────────────────────────────────────────
    {
      id: 'content-negotiation',
      title: { en: 'Content negotiation', uk: 'Content negotiation' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'One resource can have many **representations** — JSON, XML, CSV, a specific schema version. The client states preferences with `Accept` (and `Accept-Language`, `Accept-Encoding`); the server picks one, echoes it in `Content-Type`, and — crucially — sets `Vary` so caches key on the right dimensions. This is how a single URL serves both `v1` and `v2` clients, or JSON and CSV, without multiplying endpoints.',
            uk: 'Один ресурс може мати багато **representations** — JSON, XML, CSV, конкретну версію schema. Клієнт зазначає вподобання через `Accept` (і `Accept-Language`, `Accept-Encoding`); сервер обирає одне, повертає в `Content-Type` і — критично — виставляє `Vary`, щоб кеші ключувалися за правильними вимірами. Саме так один URL обслуговує і `v1`, і `v2` клієнтів, або JSON і CSV, не множачи endpoint-и.',
          },
        },
        {
          kind: 'code',
          lang: 'http',
          code: `GET /reports/42
  Accept: text/csv, application/json;q=0.8

→ 200 OK
  Content-Type: text/csv
  Vary: Accept          # caches must not serve CSV to a JSON client`,
          note: {
            en: 'q-values rank preferences; Vary keeps the cache honest across representations.',
            uk: 'q-values ранжують вподобання; Vary тримає кеш чесним між representations.',
          },
        },
      ],
    },
    // ── T8 · When to use REST (and when not) ─────────────────────────────────
    {
      id: 'when-to-use-rest',
      title: { en: 'When to use REST — and when not', uk: 'Коли використовувати REST — а коли ні' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'REST is the correct **default** for resource-shaped, public, cacheable APIs — CRUD over well-defined entities, consumed by many heterogeneous clients over the open web. Its uniformity, cache story, and ubiquitous tooling are unmatched. It strains when the interaction is *not* request/response over discrete resources: chatty mobile screens that need many resources at once (GraphQL), low-latency service-to-service RPC with streaming (gRPC), or server-initiated pushes (SSE/WebSockets/webhooks).',
            uk: 'REST — правильний **дефолт** для ресурсо-подібних, публічних, кешованих API — CRUD над чітко визначеними сутностями, споживаний багатьма різнорідними клієнтами через відкритий веб. Його uniformity, історія з кешем і всюдисуще tooling неперевершені. Він тріщить, коли взаємодія — *не* request/response над дискретними ресурсами: балакучі мобільні екрани, яким треба багато ресурсів одразу (GraphQL), low-latency service-to-service RPC зі streaming (gRPC), або server-initiated push (SSE/WebSockets/webhooks).',
          },
        },
        {
          kind: 'compare',
          a: { en: 'Use REST when', uk: 'Використовуй REST, коли' },
          b: { en: 'Reach for something else when', uk: 'Бери інше, коли' },
          rows: [
            [
              { en: 'Shape', uk: 'Форма' },
              { en: 'Resource CRUD over the open web', uk: 'Resource CRUD через відкритий веб' },
              { en: 'Streaming / server push / P2P media', uk: 'Streaming / server push / P2P медіа' },
            ],
            [
              { en: 'Clients', uk: 'Клієнти' },
              { en: 'Many, heterogeneous, cache-friendly', uk: 'Багато, різнорідні, cache-friendly' },
              { en: 'One typed client per service (gRPC/tRPC)', uk: 'Один типізований клієнт на сервіс (gRPC/tRPC)' },
            ],
            [
              { en: 'Fetch pattern', uk: 'Патерн вибірки' },
              { en: 'Predictable, per-resource reads', uk: 'Передбачувані, per-resource читання' },
              { en: 'Deeply nested / client-shaped queries (GraphQL)', uk: 'Глибоко вкладені / client-shaped запити (GraphQL)' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'Most "we need GraphQL/gRPC" is really "we have a bad REST design"', uk: '«Нам треба GraphQL/gRPC» часто насправді «у нас поганий REST-дизайн»' },
          md: {
            en: 'Before switching styles, check whether over-fetching is a missing `fields=` parameter, whether N calls are a missing composite resource, and whether "slow" is a missing `ETag`. A disciplined Level 2 REST API solves more problems than teams expect — reserve a style change for a real mismatch in interaction shape, not a fixable design smell.',
            uk: 'Перш ніж міняти стиль, перевір: over-fetching — це відсутній параметр `fields=`, N викликів — відсутній композитний ресурс, а «повільно» — відсутній `ETag`. Дисциплінований Level 2 REST вирішує більше, ніж очікують — лишай зміну стилю для реального розходження у формі взаємодії, а не для виправного design smell.',
          },
        },
      ],
    },
  ],
  keyPoints: [
    { en: 'REST is a set of constraints (uniform interface, statelessness, cacheability), not "JSON over HTTP".', uk: 'REST — це набір обмежень (uniform interface, statelessness, cacheability), а не «JSON над HTTP».' },
    { en: 'Safe vs idempotent is a correctness property: it decides which requests are safe to retry.', uk: 'Safe проти idempotent — це властивість коректності: вона вирішує, які запити безпечно повторювати.' },
    { en: 'The status code is the machine-readable contract; use RFC 9457 Problem Details for error bodies.', uk: 'Статус-код — це машиночитний контракт; для тіл помилок використовуй RFC 9457 Problem Details.' },
    { en: 'ETag + conditional requests give cheap revalidation (304) and optimistic concurrency (412) from one validator.', uk: 'ETag + conditional requests дають дешеву revalidation (304) і optimistic concurrency (412) з одного валідатора.' },
    { en: 'Aim for a clean Richardson Level 2; full HATEOAS (Level 3) rarely pays off for product APIs.', uk: 'Цілься в чистий Richardson Level 2; повний HATEOAS (Level 3) рідко окуповується для продуктових API.' },
    { en: 'REST is the default for resource CRUD over the open web; streaming/push/P2P need other styles.', uk: 'REST — дефолт для resource CRUD через відкритий веб; streaming/push/P2P потребують інших стилів.' },
  ],
  pitfalls: [
    {
      title: { en: 'Tunneling everything through 200 OK', uk: 'Тунелювання всього через 200 OK' },
      body: {
        en: 'Returning `200` with `{"error": ...}` breaks every generic client, cache, and monitor that branches on status. Let the status code carry the outcome.',
        uk: 'Повертати `200` з `{"error": ...}` ламає кожен generic-клієнт, кеш і монітор, що розгалужуються за статусом. Хай статус-код несе результат.',
      },
    },
    {
      title: { en: 'Verbs in the URL', uk: 'Дієслова в URL' },
      body: {
        en: '`POST /createUser` and `GET /getUser?id=1` are RPC wearing REST’s clothes (Level 0/1). The verb belongs in the method, not the path.',
        uk: '`POST /createUser` і `GET /getUser?id=1` — це RPC в одязі REST (Level 0/1). Дієслово належить методу, а не шляху.',
      },
    },
    {
      title: { en: 'Non-idempotent PUT/DELETE', uk: 'Неідемпотентні PUT/DELETE' },
      body: {
        en: 'If a repeated `DELETE` errors instead of returning the same final state, retries after a timeout become unsafe. Honor the method’s contract.',
        uk: 'Якщо повторний `DELETE` дає помилку замість того самого кінцевого стану, retries після timeout стають небезпечними. Дотримуйся контракту методу.',
      },
    },
    {
      title: { en: 'Ignoring caching entirely', uk: 'Повне ігнорування кешування' },
      body: {
        en: 'Shipping without `Cache-Control`/`ETag` throws away REST’s biggest advantage and pushes every read to the origin. Most "the API is slow" reports die here.',
        uk: 'Реліз без `Cache-Control`/`ETag` викидає найбільшу перевагу REST і жене кожне читання в origin. Більшість скарг «API повільний» помирають тут.',
      },
    },
  ],
  interview: [
    {
      q: { en: 'What is the difference between a safe and an idempotent method? Give an example that is idempotent but not safe.', uk: 'Яка різниця між safe та idempotent методом? Наведи приклад idempotent, але не safe.' },
      a: {
        en: 'Safe = no state change (GET, HEAD). Idempotent = repeating it yields the same result as doing it once. `PUT` and `DELETE` are idempotent but not safe: they mutate, yet a retry converges to the same final state, which is why they are safe to re-send after a timeout. `POST` is neither, which is why you add an idempotency key.',
        uk: 'Safe = без зміни стану (GET, HEAD). Idempotent = повтор дає той самий результат, що й один раз. `PUT` і `DELETE` — idempotent, але не safe: вони мутують, проте retry сходиться до того самого кінцевого стану, тому їх безпечно перенадсилати після timeout. `POST` — ні те, ні те, тому додають idempotency key.',
      },
      level: 'middle',
    },
    {
      q: { en: 'A client sees a slow, chatty REST API. Walk through what you check before recommending GraphQL.', uk: 'Клієнт бачить повільний, балакучий REST API. Пройдись, що ти перевіриш перед тим, як радити GraphQL.' },
      a: {
        en: 'Is over-fetching solvable with sparse fieldsets (`?fields=`)? Are the N calls a missing composite/aggregate resource? Is "slow" a missing `ETag`/`Cache-Control` (revalidation vs refetch)? Is pagination cursor-based? Only if the interaction is genuinely client-shaped, deeply nested, and varies per screen does GraphQL’s cost (server complexity, caching loss, N+1 risk) pay off.',
        uk: 'Чи вирішується over-fetching sparse fieldset-ами (`?fields=`)? Чи N викликів — це відсутній композитний/агрегатний ресурс? Чи «повільно» — це відсутній `ETag`/`Cache-Control` (revalidation проти refetch)? Чи пагінація cursor-based? Лише якщо взаємодія справді client-shaped, глибоко вкладена й різна на кожен екран — вартість GraphQL (складність сервера, втрата кешу, ризик N+1) окуповується.',
      },
      level: 'senior',
    },
  ],
  seeAlso: ['m3-http-transport', 'm6-odata', 'm9-graphql', 'm10-grpc', 'm19-errors-status', 'm20-pagination-limits'],
  sources: [
    { title: 'RFC 9110 — HTTP Semantics (methods, status, conditional requests)', url: 'https://www.rfc-editor.org/rfc/rfc9110.html' },
    { title: 'RFC 9111 — HTTP Caching', url: 'https://www.rfc-editor.org/rfc/rfc9111.html' },
    { title: 'RFC 9457 — Problem Details for HTTP APIs', url: 'https://www.rfc-editor.org/rfc/rfc9457.html' },
    { title: 'Fielding — Architectural Styles and the Design of Network-based Software Architectures (REST)', url: 'https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm' },
    { title: 'Martin Fowler — Richardson Maturity Model', url: 'https://martinfowler.com/articles/richardsonMaturityModel.html' },
    { title: 'MDN — HTTP request methods', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods' },
  ],
};
