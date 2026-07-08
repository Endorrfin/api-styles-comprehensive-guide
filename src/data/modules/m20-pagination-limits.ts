import type { Module } from '../types';

/*
 * m20-pagination-limits — Pagination & rate limiting (s4-cross-cutting, order 4). Two halves of one
 * discipline: never RETURN an unbounded list (page it), never ACCEPT unbounded load (limit it).
 * Interactive `pagination-compare` (engine src/lib/pagination.ts — offset drift vs cursor exactness
 * under concurrent writes; promoted from the optional figure per PROJECT-BRIEF §10). Five curriculum
 * topics: offset-vs-cursor-keyset (sim) → server-driven-paging → rate-limiting-429 → rate-limit-headers
 * → quotas-fairness (verdict). Level: senior.
 *
 * Facts web-verified S12a (2026-07):
 *  - 429 Too Many Requests = RFC 6585 (2012); Retry-After = RFC 9110 §10.2.3 (seconds or HTTP-date),
 *    also on 503. Web Linking (Link: rel="next") = RFC 8288.
 *  - RateLimit / RateLimit-Policy = draft-ietf-httpapi-ratelimit-headers-11 (2026-05-23), Standards
 *    Track, still an IETF DRAFT (not an RFC). Structured fields: RateLimit-Policy: "name";q=100;w=60
 *    (+ optional pk partition key), RateLimit: "name";r=50;t=30. De facto today: X-RateLimit-Limit/
 *    -Remaining/-Reset (GitHub-style).
 *  - GitHub REST: 5,000 req/h authenticated (60 unauth; 15,000 for Enterprise Cloud app installs);
 *    secondary limits (~900 points/min REST) return 403 or 429; x-ratelimit-* headers.
 *  - Stripe pagination: cursor via starting_after / ending_before (mutually exclusive), limit 1–100
 *    (default 10), has_more flag; auto-pagination helpers in the SDKs.
 *  - Keyset/seek method: use-the-index-luke.com/no-offset (Winand) — OFFSET scans+discards, keyset
 *    seeks via the index; composite (created_at, id) boundary breaks ties.
 *  - GraphQL Cursor Connections spec (relay.dev) — edges/node/cursor + pageInfo.endCursor/hasNextPage;
 *    OData server-driven paging via @odata.nextLink (verified S10a, m6).
 */
export const m20: Module = {
  id: 'm20-pagination-limits',
  num: 20,
  section: 's4-cross-cutting',
  order: 4,
  level: 'senior',
  title: { en: 'Pagination & rate limiting', uk: 'Пагінація та rate limiting' },
  tagline: {
    en: 'Cursor vs offset; 429 and the token bucket.',
    uk: 'Cursor проти offset; 429 і token bucket.',
  },
  readMins: 15,
  mentalModel: {
    en: '**Never return an unbounded list, never accept unbounded load.** Both halves of this module are the same discipline — putting a **bound on work** — applied in two directions. Pagination bounds the *response*: the client gets a page and a way to ask for the next one, and the shape of that "way" is the whole game — an **offset counts rows from the top** (a position, which concurrent writes silently shift), a **cursor names the last row you saw** (a value, which writes cannot move). Rate limiting bounds the *request stream*: every caller gets a budget, the server sheds what exceeds it with **`429` + `Retry-After`**, and honest headers let a well-behaved client slow down *before* hitting the wall. An API without both is an API whose worst-case cost is decided by its least careful caller.',
    uk: '**Ніколи не віддавай безмежний список і ніколи не приймай безмежне навантаження.** Обидві половини цього модуля — одна дисципліна, **межа на роботу**, застосована у двох напрямках. Пагінація обмежує *відповідь*: клієнт отримує сторінку і спосіб попросити наступну, і форма цього «способу» — вся гра: **offset рахує рядки від верху** (позиція, яку паралельні записи тихо зсувають), **cursor називає останній побачений рядок** (значення, яке записи зрушити не можуть). Rate limiting обмежує *потік запитів*: кожен викликач має бюджет, надлишок сервер скидає через **`429` + `Retry-After`**, а чесні заголовки дають вихованому клієнту сповільнитися *до* стіни. API без обох — це API, чию найгіршу ціну визначає його найнеобережніший викликач.',
  },
  topics: [
    // ── T1 · Offset vs cursor (keyset) — the sim ─────────────────────────────
    {
      id: 'offset-vs-cursor-keyset',
      title: { en: 'Offset vs cursor (keyset)', uk: 'Offset проти cursor (keyset)' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Offset pagination (`?limit=20&offset=40`, or its costume `?page=3`) defines a page by **position**: "skip N rows, give me the next 20." It is trivial to implement and gives random access — page 7 is one URL away. It has two structural faults. First, **the database pays for the skip**: `OFFSET 10000` walks and *discards* ten thousand rows before returning twenty, so latency grows with depth — deep pages get slower, and a crawler walking your list is a denial-of-service you built yourself. Second — and this is the fault people meet in production — **the window drifts under writes**. Positions are relative to the *current* dataset: insert 3 rows on top between two fetches and page 2 re-serves 3 rows the client already has (duplicates); delete rows the client has seen and the next window slides past rows it will *never* see (silent loss). Cursor pagination defines a page by **value** instead: "give me 20 rows *after this row*" — `after=obj_16`, Stripe\'s `starting_after`. The boundary is pinned to data the client already consumed, so writes above it cannot move the resume point. Watch both walk the same mutating feed:',
            uk: 'Offset-пагінація (`?limit=20&offset=40`, або її костюм `?page=3`) визначає сторінку **позицією**: «пропусти N рядків, дай наступні 20». Її тривіально реалізувати, і вона дає довільний доступ — сторінка 7 за один URL. Але в неї два структурні дефекти. Перший — **за пропуск платить база**: `OFFSET 10000` проходить і *викидає* десять тисяч рядків, перш ніж віддати двадцять, тож латентність росте з глибиною — глибокі сторінки повільнішають, а crawler, що йде по списку, — це denial-of-service, який ти збудував сам. Другий — і саме на нього наштовхуються в production — **вікно дрейфує під записами**. Позиції відносні до *поточного* dataset-у: встав 3 рядки зверху між двома fetch-ами — і сторінка 2 повторно віддасть 3 рядки, які клієнт уже має (дублі); видали побачені клієнтом рядки — і наступне вікно проскочить повз рядки, яких він *ніколи* не побачить (тиха втрата). Cursor-пагінація визначає сторінку **значенням**: «дай 20 рядків *після цього рядка*» — `after=obj_16`, Stripe-ів `starting_after`. Межа прикріплена до даних, які клієнт уже спожив, тож записи вище неї не можуть зсунути точку продовження. Подивись, як обидві стратегії йдуть тим самим мінливим фідом:',
          },
        },
        {
          kind: 'sim',
          sim: 'pagination-compare',
          caption: {
            en: 'The same newest-first feed, walked three pages deep by both strategies while rows are inserted or deleted between fetches. Offset\'s page boundary is a position — writes shift its window (⚠ duplicates on insert, silently missed rows on delete). Cursor\'s boundary is the last-seen value — the walk stays exact.',
            uk: 'Той самий фід (новіші зверху), пройдений на три сторінки обома стратегіями, поки між fetch-ами вставляються чи видаляються рядки. Межа сторінки в offset — позиція: записи зсувають вікно (⚠ дублі при insert, тихо пропущені рядки при delete). Межа в cursor — останнє побачене значення: прохід лишається точним.',
          },
        },
        {
          kind: 'code',
          lang: 'sql',
          code: `-- offset: the database walks and THROWS AWAY 10,000 rows to serve page 501
SELECT id, title FROM posts
ORDER BY created_at DESC, id DESC
LIMIT 20 OFFSET 10000;

-- keyset (the "seek method"): jump straight to the boundary the client already saw
SELECT id, title FROM posts
WHERE (created_at, id) < (:last_created_at, :last_id)   -- the cursor, decoded
ORDER BY created_at DESC, id DESC
LIMIT 20;                                               -- needs INDEX (created_at DESC, id DESC)`,
          note: {
            en: 'Keyset is the cursor\'s database half: an index seek instead of a scan-and-discard, O(log n) at any depth. The composite `(created_at, id)` boundary breaks timestamp ties — a cursor on a non-unique column alone can skip or repeat rows on the tie.',
            uk: 'Keyset — це «базова» половина cursor-а: index seek замість scan-and-discard, O(log n) на будь-якій глибині. Композитна межа `(created_at, id)` розв\'язує однакові timestamp-и — cursor лише по неунікальній колонці може пропустити чи повторити рядки на збігу.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'The cursor must be opaque', uk: 'Cursor мусить бути непрозорим' },
          md: {
            en: 'A cursor is a **contract about position, not a peek into your schema**. Encode it (base64 of `{created_at, id}` or an encrypted token) and document it as *opaque*: clients must not parse, construct, or arithmetic on it. The moment callers build cursors by hand, your sort key, tie-breaker, and index layout are frozen into their code — you\'ve leaked the implementation you\'ll want to change. Opaque cursors also close the injection door a raw `WHERE`-fragment cursor would open.',
            uk: 'Cursor — це **контракт про позицію, а не підглядання у твою схему**. Кодуй його (base64 від `{created_at, id}` чи шифрований токен) і документуй як *opaque*: клієнти не повинні його парсити, конструювати чи рахувати. Щойно викликачі збирають cursor-и руками, твій sort key, tie-breaker і розкладка індексу вморожені в їхній код — ти злив імплементацію, яку захочеш змінити. Opaque cursor також зачиняє двері injection, які відчинив би cursor-фрагмент сирого `WHERE`.',
          },
        },
      ],
    },
    // ── T2 · Server-driven paging ─────────────────────────────────────────────
    {
      id: 'server-driven-paging',
      title: { en: 'Server-driven paging', uk: 'Server-driven пагінація' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The mature form of cursor pagination is **server-driven**: the client never *builds* a "next page" request, it **follows one the server hands out**. REST does it with a **`Link: <…>; rel="next"` header (RFC 8288)** — GitHub\'s style — or an in-body link; **Stripe** returns `has_more` and lets you resume with `starting_after=<last id>` (`limit` 1–100, default 10, `ending_before` for the other direction); **OData** appends **`@odata.nextLink`** (m6); **GraphQL** standardized the *Connections* pattern — `edges { node, cursor }` + `pageInfo { endCursor, hasNextPage }` — so tooling like Relay can paginate any list uniformly (m9). The division of labour is the point: the *server* owns the paging strategy (keyset columns, page size caps, even switching strategies later), the *client* owns exactly one behaviour — "if there\'s a next link and I want more, follow it." That is HATEOAS doing real work (m5): the contract shrinks to "follow the link", and every knob stays server-side where it can evolve without breaking anyone.',
            uk: 'Зріла форма cursor-пагінації — **server-driven**: клієнт ніколи не *збирає* запит «наступної сторінки», він **іде за тим, що видав сервер**. REST робить це заголовком **`Link: <…>; rel="next"` (RFC 8288)** — стиль GitHub — або лінком у тілі; **Stripe** повертає `has_more` і продовжує через `starting_after=<останній id>` (`limit` 1–100, дефолт 10, `ending_before` — у зворотний бік); **OData** додає **`@odata.nextLink`** (m6); **GraphQL** стандартизував патерн *Connections* — `edges { node, cursor }` + `pageInfo { endCursor, hasNextPage }`, — щоб тулінг на кшталт Relay пагінував будь-який список однаково (m9). Суть — у розподілі праці: *сервер* володіє стратегією пагінації (keyset-колонки, ліміти розміру сторінки, навіть заміна стратегії згодом), *клієнт* володіє рівно однією поведінкою — «є next-лінк і хочу ще — йду за ним». Це HATEOAS за справжньою роботою (m5): контракт стискається до «йди за лінком», а кожна ручка лишається на боці сервера, де може еволюціонувати, нікого не ламаючи.',
          },
        },
        {
          kind: 'compare',
          a: { en: 'Offset / page number', uk: 'Offset / номер сторінки' },
          b: { en: 'Cursor (keyset)', uk: 'Cursor (keyset)' },
          rows: [
            [
              { en: 'Page boundary', uk: 'Межа сторінки' },
              { en: 'A position — "skip N rows"', uk: 'Позиція — «пропусти N рядків»' },
              { en: 'A value — "after this row"', uk: 'Значення — «після цього рядка»' },
            ],
            [
              { en: 'Random access ("page 7")', uk: 'Довільний доступ («сторінка 7»)' },
              { en: 'Yes — any page, one URL', uk: 'Так — будь-яка сторінка, один URL' },
              { en: 'No — you walk forward from what you saw', uk: 'Ні — йдеш вперед від побаченого' },
            ],
            [
              { en: 'Under concurrent writes', uk: 'Під паралельними записами' },
              { en: 'Drifts: duplicates on insert, silent misses on delete', uk: 'Дрейфує: дублі при insert, тихі пропуски при delete' },
              { en: 'Exact: the boundary is pinned to consumed data', uk: 'Точно: межа прикріплена до спожитих даних' },
            ],
            [
              { en: 'Cost of deep pages', uk: 'Ціна глибоких сторінок' },
              { en: 'O(offset) — scan and discard', uk: 'O(offset) — scan and discard' },
              { en: 'O(log n) — index seek at any depth', uk: 'O(log n) — index seek на будь-якій глибині' },
            ],
            [
              { en: 'Total count / progress bar', uk: 'Загальна кількість / progress bar' },
              { en: 'Natural fit (page X of Y)', uk: 'Природно (сторінка X з Y)' },
              { en: 'Separate (estimated) count, if at all', uk: 'Окремий (приблизний) count, якщо взагалі' },
            ],
            [
              { en: 'Where it belongs', uk: 'Де доречний' },
              { en: 'Small, slow-changing admin tables', uk: 'Малі, повільно змінні admin-таблиці' },
              { en: 'Feeds, infinite scroll, exports, public APIs', uk: 'Фіди, infinite scroll, експорти, публічні API' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Design the page size like an API parameter, because it is one', uk: 'Проєктуй розмір сторінки як параметр API, бо це він і є' },
          md: {
            en: 'Give `limit` a **default** (Stripe: 10) and a **hard cap** (Stripe: 100) and validate both — `?limit=1000000` must clamp or `400`, never execute. An uncapped page size turns your paginated endpoint back into the unbounded list you were avoiding, and a missing default punishes every client that forgot the parameter.',
            uk: 'Дай `limit`-у **дефолт** (Stripe: 10) і **жорсткий cap** (Stripe: 100) і валідуй обидва — `?limit=1000000` має clamp-нутись або дати `400`, ніколи не виконатись. Необмежений розмір сторінки перетворює твій пагінований endpoint назад на безмежний список, якого ти уникав, а відсутній дефолт карає кожного клієнта, що забув параметр.',
          },
        },
      ],
    },
    // ── T3 · Rate limiting & 429 ──────────────────────────────────────────────
    {
      id: 'rate-limiting-429',
      title: { en: 'Rate limiting & 429', uk: 'Rate limiting і 429' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Rate limiting is **load shedding as a contract**: the server declares a budget per caller and rejects the excess *cheaply* — a `429 Too Many Requests` (**RFC 6585**) with a **`Retry-After`** header (**RFC 9110**) costs microseconds; the query it replaced might have cost a database. The budget needs an identity to attach to — an API key, a token\'s subject, a tenant, an IP as the fallback for the anonymous — and an **algorithm** to spend against. Four dominate. A **fixed window** ("100/minute, reset on :00") is a counter — trivial, but callers can burst 200 across a boundary (100 at :59, 100 at :01). A **sliding window** smooths that by weighting the previous window. The **token bucket** — the industry default — refills at the steady rate but lets a caller *save up* to the bucket\'s capacity, so short bursts pass while the average holds; the **leaky bucket** is its stricter sibling, draining at a constant rate for when downstream needs smoothness (payment processors, third-party quotas). Enforce at the **edge** (gateway, m23), where the counter store is shared and rejects don\'t touch your services — GitHub\'s tiers are the reference shape: 5,000 req/h authenticated, 60 unauthenticated, plus *secondary* burst limits (~900 points/min) that return `403` or `429` even when the hourly budget looks healthy.',
            uk: 'Rate limiting — це **load shedding як контракт**: сервер оголошує бюджет на викликача і відкидає надлишок *дешево* — `429 Too Many Requests` (**RFC 6585**) з заголовком **`Retry-After`** (**RFC 9110**) коштує мікросекунди; запит, який він замінив, міг коштувати базу даних. Бюджету потрібна ідентичність — API key, subject токена, tenant, IP як fallback для анонімів — і **алгоритм** витрачання. Домінують чотири. **Fixed window** («100/хвилину, скидання на :00») — лічильник: тривіально, але викликач може burst-нути 200 через межу (100 о :59, 100 о :01). **Sliding window** згладжує це зваженим попереднім вікном. **Token bucket** — індустріальний дефолт — поповнюється зі сталою швидкістю, але дає викликачу *накопичити* до ємності відра, тож короткі burst-и проходять, а середнє тримається; **leaky bucket** — суворіший родич, що зливає зі сталою швидкістю, коли downstream потребує гладкості (платіжні процесори, чужі квоти). Застосовуй на **краю** (gateway, m23), де сховище лічильників спільне, а відмови не торкаються твоїх сервісів — еталонна форма — тіри GitHub: 5,000 req/год автентифіковано, 60 — без, плюс *secondary* burst-ліміти (~900 points/хв), що повертають `403` чи `429`, навіть коли годинний бюджет виглядає здоровим.',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Algorithm', uk: 'Алгоритм' },
            { en: 'Bursts', uk: 'Burst-и' },
            { en: 'State it keeps', uk: 'Стан' },
            { en: 'Edge behaviour', uk: 'Поведінка на межі' },
          ],
          rows: [
            [
              { en: 'Fixed window', uk: 'Fixed window' },
              { en: 'Up to 2× at the boundary', uk: 'До 2× на межі вікон' },
              { en: 'One counter per window', uk: 'Один лічильник на вікно' },
              { en: 'Hard reset — thundering herd at :00', uk: 'Жорсткий reset — thundering herd о :00' },
            ],
            [
              { en: 'Sliding window', uk: 'Sliding window' },
              { en: 'Damped', uk: 'Пригашені' },
              { en: 'Two counters (weighted)', uk: 'Два лічильники (зважені)' },
              { en: 'Smooth approximation', uk: 'Гладка апроксимація' },
            ],
            [
              { en: 'Token bucket', uk: 'Token bucket' },
              { en: 'Allowed up to bucket capacity', uk: 'Дозволені до ємності відра' },
              { en: 'Tokens + last-refill time', uk: 'Токени + час останнього поповнення' },
              { en: 'Burst then steady rate — the default', uk: 'Burst, далі стала швидкість — дефолт' },
            ],
            [
              { en: 'Leaky bucket', uk: 'Leaky bucket' },
              { en: 'Queued or shed — never passed through', uk: 'У чергу або скинуті — ніколи навпростець' },
              { en: 'Queue depth', uk: 'Глибина черги' },
              { en: 'Constant outflow — protects downstream', uk: 'Сталий відтік — захищає downstream' },
            ],
          ],
          caption: {
            en: 'The four limiter shapes. Token bucket (rate + burst capacity) is the default answer; leaky bucket when what\'s behind you needs a smooth flow, not a fair average.',
            uk: 'Чотири форми limiter-а. Token bucket (швидкість + ємність burst-у) — відповідь за замовчуванням; leaky bucket — коли те, що позаду, потребує гладкого потоку, а не чесного середнього.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'A 429 without Retry-After creates the traffic it fears', uk: '429 без Retry-After породжує трафік, якого боїться' },
          md: {
            en: 'Reject a thousand clients with a bare `429` and they all retry on their own schedules — usually *immediately*, in sync, amplifying the spike that tripped the limiter (the retry storm, m21). Always send `Retry-After`; well-behaved clients honour it and add **jitter**. And never rate-limit the *error path more gently than the happy path* — an attacker probing credentials loves an endpoint whose failures are free (m17).',
            uk: 'Відкинь тисячу клієнтів голим `429` — і всі вони ретраять за власним розкладом, зазвичай *негайно* й синхронно, підсилюючи той самий сплеск, що зірвав limiter (retry storm, m21). Завжди шли `Retry-After`; виховані клієнти шанують його і додають **jitter**. І ніколи не лімітуй *шлях помилки м\'якше за щасливий шлях* — атакер, що перебирає credentials, обожнює endpoint, чиї збої безкоштовні (m17).',
          },
        },
      ],
    },
    // ── T4 · Rate-limit headers ───────────────────────────────────────────────
    {
      id: 'rate-limit-headers',
      title: { en: 'Rate-limit headers', uk: 'Rate-limit заголовки' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'A limit the client can only discover by *hitting* it produces exactly the traffic you were shedding. Honest APIs **advertise the budget on every response**, so clients can pace themselves and back off *before* the wall. Today that means the **de facto `X-RateLimit-*` trio** — `Limit`, `Remaining`, `Reset` (GitHub-style, an epoch timestamp) — which every ecosystem understands but no standard defines: names, units, and `Reset` semantics (epoch? seconds-from-now?) vary per provider, which is precisely why the **IETF HTTPAPI working group** is standardizing **`RateLimit-Policy`** (the declared quota: `"hour";q=5000;w=3600`) and **`RateLimit`** (the live state: `"hour";r=0;t=30`) as structured fields. As of mid-2026 that is **draft-ietf-httpapi-ratelimit-headers-11 (May 2026) — Standards Track, still a draft, not an RFC**: ship the `X-` trio for compatibility, and treat the structured pair as the direction of travel to adopt alongside, not instead.',
            uk: 'Ліміт, який клієнт відкриває лише *вдарившись* об нього, породжує саме той трафік, який ти скидав. Чесні API **рекламують бюджет у кожній відповіді**, щоб клієнти тримали темп і сповільнювалися ще *до* стіни. Сьогодні це **de facto трійка `X-RateLimit-*`** — `Limit`, `Remaining`, `Reset` (стиль GitHub, epoch-мітка), — яку розуміє кожна екосистема, але не визначає жоден стандарт: імена, одиниці й семантика `Reset` (epoch? секунди-від-тепер?) різняться між провайдерами. Саме тому **IETF HTTPAPI working group** стандартизує **`RateLimit-Policy`** (оголошена квота: `"hour";q=5000;w=3600`) і **`RateLimit`** (живий стан: `"hour";r=0;t=30`) як structured fields. Станом на середину 2026 це **draft-ietf-httpapi-ratelimit-headers-11 (травень 2026) — Standards Track, усе ще draft, не RFC**: шли трійку `X-` для сумісності, а structured-пару вважай напрямком руху — впроваджуй поруч, не замість.',
          },
        },
        {
          kind: 'code',
          lang: 'http',
          code: `HTTP/1.1 429 Too Many Requests
Content-Type: application/problem+json
Retry-After: 30

X-RateLimit-Limit: 5000            # de facto trio (GitHub-style) — everyone reads these
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1782900000      # epoch seconds — semantics vary by provider!

RateLimit-Policy: "hour";q=5000;w=3600    # IETF draft-11: the declared quota (structured field)
RateLimit: "hour";r=0;t=30                # …and the live state: 0 remaining, try in 30 s`,
          note: {
            en: 'Both generations on one 429, plus a Problem Details body (m19) naming the policy that tripped. `Retry-After` is the one header retry libraries already honour — never omit it.',
            uk: 'Обидва покоління на одному 429, плюс тіло Problem Details (m19), що називає порушену політику. `Retry-After` — єдиний заголовок, який retry-бібліотеки вже шанують: ніколи не пропускай його.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Clients: treat Remaining as a fuel gauge, not a dare', uk: 'Клієнтам: Remaining — це датчик пального, а не запрошення розігнатися' },
          md: {
            en: 'A polite client watches `Remaining`/`r` and **spreads work across the window** when it runs low, instead of sprinting to zero and parking on `429`s. For batch jobs, read the budget first and schedule against it — GitHub\'s secondary limits exist precisely because "5,000/hour" was being read as "5,000 in the first minute".',
            uk: 'Ввічливий клієнт стежить за `Remaining`/`r` і **розмазує роботу по вікну**, коли лишається мало, замість спринту до нуля й паркування на `429`. Для batch-джобів читай бюджет спершу і плануй проти нього — secondary-ліміти GitHub існують саме тому, що «5,000/год» читали як «5,000 за першу хвилину».',
          },
        },
      ],
    },
    // ── T5 · Quotas, fairness & the verdict ───────────────────────────────────
    {
      id: 'quotas-fairness',
      title: { en: 'Quotas, fairness & the verdict', uk: 'Квоти, справедливість і вердикт' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Rate limits and quotas answer different questions on different clocks. A **rate limit** protects *capacity right now* — requests per second or minute, enforced at the edge, breached and reset within moments. A **quota** allocates *value over a horizon* — calls per day, tokens per month, gigabytes per billing cycle; breach it and the conversation is commercial (upgrade, `402`-shaped) rather than operational ("slow down"). Multi-tenant systems need **fairness** between the two: per-tenant buckets so one noisy customer cannot starve the rest, tier-shaped budgets (free/pro/enterprise), and — inside the request — **cost-aware weighting**, because "one request" is a lie when a single GraphQL query can fan out to thousands of resolver calls (m9\'s depth/complexity limits are this module wearing its query-language costume). Fairness is also where pagination and limiting reconnect: a caller who *must* page through results in bounded slices is a caller whose worst query you have already capped.',
            uk: 'Rate limits і квоти відповідають на різні питання на різних годинниках. **Rate limit** захищає *потужність просто зараз* — запити на секунду чи хвилину, на краю, порушується і скидається за миті. **Квота** розподіляє *цінність на горизонті* — виклики на день, токени на місяць, гігабайти на billing-цикл; її порушення — розмова комерційна (upgrade, у формі `402`), а не операційна («сповільнись»). Multi-tenant системам потрібна **справедливість** між ними: per-tenant відра, щоб один шумний клієнт не морив голодом решту, бюджети за тірами (free/pro/enterprise) і — всередині запиту — **зважування за вартістю**, бо «один запит» — брехня, коли єдиний GraphQL-запит може розгорнутись у тисячі викликів resolver-ів (ліміти depth/complexity з m9 — це той самий модуль у костюмі мови запитів). Справедливість — це й місце, де пагінація та ліміти знову зустрічаються: викликач, *змушений* пагінувати результати обмеженими скибками, — це викликач, чий найгірший запит ти вже закрив.',
          },
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'Top threat: unbounded work as a weapon', uk: 'Головна загроза: необмежена робота як зброя' },
          md: {
            en: 'The characteristic attack on this module\'s territory is **resource exhaustion**: unauthenticated endpoints hammered into a DoS, credential stuffing riding an unlimited login route, scrapers walking an unpaginated list, and complexity bombs (`?limit=1000000`, a depth-12 GraphQL query) that make *one* request cost like a million. The defences are this module: identity-attached budgets, cheap early `429`s, capped page sizes, cost-aware weighting — plus per-route strictness where failure is interesting (login, password reset, m17; DoS taxonomy in m22).',
            uk: 'Характерна атака на території цього модуля — **вичерпання ресурсів**: DoS по неавтентифікованих endpoint-ах, credential stuffing по логін-маршруту без лімітів, scraper-и по непагінованому списку і complexity-бомби (`?limit=1000000`, GraphQL-запит глибини 12), що роблять *один* запит вартим мільйона. Захист — цей модуль: бюджети на ідентичність, дешеві ранні `429`, обмежені розміри сторінок, зважування за вартістю — плюс per-route суворість там, де збій цікавий (login, password reset, m17; таксономія DoS у m22).',
          },
        },
        {
          kind: 'prose',
          md: {
            en: '**Use / avoid.** Default to **cursor pagination** for anything a user scrolls, a job exports, or the public calls — accept offset only for small, slow-moving, bounded admin tables where "jump to page 7" is a real requirement. Cap every `limit`. Rate-limit **every** public surface (authenticated by key/subject, anonymous by IP), shed with `429` + `Retry-After` + honest headers, and split short-horizon *rate* from long-horizon *quota* so an operational brake never masquerades as a billing decision. Avoid: offset pagination on a write-hot feed (you will ship the duplicate-rows bug), `COUNT(*)` on every page of a huge table (pay it once or estimate), limits enforced only in application code on one node (the counter must be shared at the edge), and punishing bursts your own SDK\'s retry policy generates (m21 — the limiter and the retrier must be designed together).',
            uk: '**Використовуй / уникай.** За замовчуванням — **cursor-пагінація** для всього, що користувач скролить, джоб експортує чи публіка викликає; offset приймай лише для малих, повільних, обмежених admin-таблиць, де «стрибни на сторінку 7» — реальна вимога. Обмежуй кожен `limit`. Лімітуй **кожну** публічну поверхню (автентифікованих — за key/subject, анонімів — за IP), скидай через `429` + `Retry-After` + чесні заголовки, і розділяй короткогоризонтний *rate* від довгогоризонтної *quota*, щоб операційне гальмо не вдавало billing-рішення. Уникай: offset-пагінації на write-гарячому фіді (відвантажиш баг дублікатів), `COUNT(*)` на кожній сторінці величезної таблиці (заплати раз або оцінюй), лімітів лише в коді застосунку на одному вузлі (лічильник має бути спільним на краю) і покарання за burst-и, які генерує retry-політика твого ж SDK (m21 — limiter і retrier проєктуються разом).',
          },
        },
      ],
    },
  ],
  keyPoints: [
    {
      en: 'Both halves are one discipline: **bound the work** — page every list, budget every caller.',
      uk: 'Обидві половини — одна дисципліна: **обмеж роботу** — пагінуй кожен список, бюджетуй кожного викликача.',
    },
    {
      en: 'Offset defines a page by **position** — concurrent writes shift the window: duplicates on insert, silent misses on delete, and the database pays O(offset) for the skip.',
      uk: 'Offset визначає сторінку **позицією** — паралельні записи зсувають вікно: дублі при insert, тихі пропуски при delete, і база платить O(offset) за пропуск.',
    },
    {
      en: 'A cursor defines a page by **value** (keyset: `WHERE (created_at, id) < boundary`) — exact under writes, O(log n) at any depth, but no random access. Keep it opaque.',
      uk: 'Cursor визначає сторінку **значенням** (keyset: `WHERE (created_at, id) < межа`) — точний під записами, O(log n) на будь-якій глибині, але без довільного доступу. Тримай його opaque.',
    },
    {
      en: 'Server-driven paging (Link rel="next", `has_more` + `starting_after`, `@odata.nextLink`, GraphQL Connections) keeps the strategy server-side; the client just follows the link.',
      uk: 'Server-driven пагінація (Link rel="next", `has_more` + `starting_after`, `@odata.nextLink`, GraphQL Connections) тримає стратегію на сервері; клієнт просто йде за лінком.',
    },
    {
      en: 'Shed load with **`429` (RFC 6585) + `Retry-After` (RFC 9110)**; the token bucket (rate + burst) is the default algorithm; enforce at the edge with a shared counter.',
      uk: 'Скидай навантаження через **`429` (RFC 6585) + `Retry-After` (RFC 9110)**; token bucket (швидкість + burst) — алгоритм за замовчуванням; застосовуй на краю зі спільним лічильником.',
    },
    {
      en: 'Advertise the budget: de facto `X-RateLimit-*` today, IETF `RateLimit` / `RateLimit-Policy` (draft-11, May 2026 — still not an RFC) as the emerging standard. Rate = now; quota = the billing horizon.',
      uk: 'Рекламуй бюджет: de facto `X-RateLimit-*` сьогодні, IETF `RateLimit` / `RateLimit-Policy` (draft-11, травень 2026 — досі не RFC) як стандарт, що надходить. Rate = зараз; quota = billing-горизонт.',
    },
  ],
  pitfalls: [
    {
      title: { en: 'Offset pagination on a live feed', uk: 'Offset-пагінація на живому фіді' },
      body: {
        en: 'The demo works; production drifts. Users see the same post twice after every refresh burst (inserts) or support asks why an export "lost" records that plainly exist (deletes slid them past the window). If the dataset takes writes while readers page, offset is the wrong tool — the bug is structural, not a race you can patch.',
        uk: 'Демо працює; production дрейфує. Користувачі бачать той самий пост двічі після кожного сплеску (insert-и), або support питає, чому експорт «загубив» записи, які явно існують (delete-и просунули їх повз вікно). Якщо dataset приймає записи, поки читачі пагінують, offset — не той інструмент: баг структурний, а не race, який можна залатати.',
      },
    },
    {
      title: { en: 'A COUNT(*) tax on every page', uk: 'Податок COUNT(*) на кожній сторінці' },
      body: {
        en: '"Page 3 of 41,207" reads nice and costs a full index scan per request on a big table — often more than the page itself. Pay for the count once and cache it, estimate it (`reltuples`-style), or drop it: infinite scroll needs `hasNextPage`, not the total.',
        uk: '«Сторінка 3 з 41,207» читається гарно, а коштує повний index scan на кожен запит по великій таблиці — часто дорожче за саму сторінку. Заплати за count раз і кешуй, оцінюй (у стилі `reltuples`) або прибери: infinite scroll потребує `hasNextPage`, а не тотал.',
      },
    },
    {
      title: { en: 'Rate limits nobody can see', uk: 'Rate-ліміти, яких ніхто не бачить' },
      body: {
        en: 'A bare `429` — no `Retry-After`, no remaining-budget headers, undocumented tiers — turns every integration into guesswork and every spike into a synchronized retry storm. If callers can\'t see the wall, they find it by collision, in sync, repeatedly.',
        uk: 'Голий `429` — без `Retry-After`, без заголовків бюджету, з незадокументованими тірами — перетворює кожну інтеграцію на вгадування, а кожен сплеск на синхронний retry storm. Якщо викликачі не бачать стіну, вони знаходять її зіткненням, синхронно, повторно.',
      },
    },
  ],
  interview: [
    {
      q: {
        en: 'Your feed endpoint uses `?page=N` and users report seeing duplicate posts while scrolling. Explain the mechanism and fix it without breaking existing clients overnight.',
        uk: 'Твій feed-endpoint використовує `?page=N`, і користувачі скаржаться на дублікати постів під час скролу. Поясни механізм і виправ, не ламаючи наявних клієнтів за одну ніч.',
      },
      a: {
        en: 'Mechanism: `page=N` is offset pagination — the page boundary is a *position* in the current dataset. New posts inserted on top between two fetches shift every row down, so page N+1 re-serves rows from the old page N (and deletes cause silent skips symmetrically). Fix: move the boundary from position to *value* — keyset pagination on `(created_at, id)` behind an opaque cursor, returned server-driven (`next` link / `endCursor`). Migration: add the cursor contract alongside `page` (versioning, m18), have official SDKs follow the next-link, deprecate `page` with a Sunset header, and in the interim serve `page` requests best-effort while logging callers for outreach. The composite tie-breaker matters — cursoring on `created_at` alone repeats or skips rows on timestamp ties.',
        uk: 'Механізм: `page=N` — offset-пагінація, межа сторінки — *позиція* в поточному dataset-і. Нові пости зверху між двома fetch-ами зсувають усі рядки вниз, тож сторінка N+1 повторно віддає рядки старої сторінки N (а delete-и симетрично дають тихі пропуски). Виправлення: перенеси межу з позиції на *значення* — keyset по `(created_at, id)` за opaque cursor-ом, відданим server-driven (`next`-лінк / `endCursor`). Міграція: додай cursor-контракт поруч із `page` (версіонування, m18), нехай офіційні SDK йдуть за next-лінком, депрекуй `page` із Sunset-заголовком, а тим часом обслуговуй `page` best-effort, логуючи викликачів для комунікації. Композитний tie-breaker важливий — cursor лише по `created_at` повторює чи пропускає рядки на збігах часу.',
      },
      level: 'senior',
    },
    {
      q: {
        en: 'Design rate limiting for a multi-tenant API where one enterprise customer is 100× bigger than the median tenant. What do you limit, where, and how do you keep the big tenant from starving the rest?',
        uk: 'Спроєктуй rate limiting для multi-tenant API, де один enterprise-клієнт у 100× більший за медіанного tenant-а. Що лімітуєш, де, і як не даси великому tenant-у виморити ресурси решти?',
      },
      a: {
        en: 'Layers: (1) edge/gateway enforcement with a shared store — token buckets keyed by tenant, then by token/user inside the tenant, so one runaway service inside the big customer can\'t spend the whole tenant budget; (2) tier-shaped budgets (the enterprise tenant *buys* a bigger bucket — quota is commercial, rate is operational); (3) cost-aware weighting — points per request like GitHub\'s secondary limits, or query complexity for GraphQL — so "one request" can\'t hide a thousand; (4) isolation: per-tenant concurrency caps or partitioned capacity (bulkheads, m21) so bursts degrade the burster, not the neighbourhood; (5) honest signalling — `429` + `Retry-After` + budget headers, and *stricter* buckets on auth endpoints where failures are attack-shaped. Watch the interaction with retries: your own SDK backoff must respect `Retry-After`, or the limiter manufactures its own load.',
        uk: 'Шари: (1) enforcement на краю/gateway зі спільним сховищем — token bucket-и за tenant-ом, далі за token/user всередині tenant-а, щоб один некерований сервіс великого клієнта не спалив увесь tenant-бюджет; (2) бюджети за тірами (enterprise-tenant *купує* більше відро — quota комерційна, rate операційний); (3) зважування за вартістю — points на запит як secondary-ліміти GitHub або query complexity для GraphQL, — щоб «один запит» не ховав тисячу; (4) ізоляція: per-tenant ліміти конкурентності чи партиційована потужність (bulkheads, m21), щоб burst деградував burster-а, а не сусідів; (5) чесна сигналізація — `429` + `Retry-After` + заголовки бюджету, і *суворіші* відра на auth-endpoint-ах, де збої мають форму атаки. Стеж за взаємодією з retry: backoff твого ж SDK мусить шанувати `Retry-After`, інакше limiter виробляє власне навантаження.',
      },
      level: 'staff',
    },
  ],
  seeAlso: ['m5-rest', 'm6-odata', 'm9-graphql', 'm19-errors-status', 'm21-idempotency'],
  sources: [
    { title: 'RFC 6585 — Additional HTTP Status Codes (429)', url: 'https://www.rfc-editor.org/rfc/rfc6585' },
    { title: 'RFC 9110 — HTTP Semantics §10.2.3 Retry-After', url: 'https://www.rfc-editor.org/rfc/rfc9110#section-10.2.3' },
    { title: 'draft-ietf-httpapi-ratelimit-headers — RateLimit header fields for HTTP', url: 'https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/' },
    { title: 'RFC 8288 — Web Linking (Link: rel="next")', url: 'https://www.rfc-editor.org/rfc/rfc8288' },
    { title: 'Stripe API — Pagination (starting_after / ending_before)', url: 'https://docs.stripe.com/api/pagination' },
    { title: 'GitHub Docs — Rate limits for the REST API', url: 'https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api' },
    { title: 'Markus Winand — No OFFSET (the seek method / keyset pagination)', url: 'https://use-the-index-luke.com/no-offset' },
    { title: 'GraphQL Cursor Connections Specification', url: 'https://relay.dev/graphql/connections.htm' },
  ],
};
