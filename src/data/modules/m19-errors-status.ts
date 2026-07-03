import type { Module } from '../types';

/*
 * m19-errors-status — Errors & status semantics (s4-cross-cutting, order 3). An error is DATA the client
 * acts on, not a stack trace. Right-sized: no hero sim; figure 'problem-details' (an RFC 9457 body,
 * annotated, mapped to gRPC + GraphQL). Six curriculum topics: http-status-semantics →
 * problem-details-rfc9457 (figure) → grpc-status → graphql-errors → retry-and-backoff → error-taxonomy
 * (verdict). Level: middle (the widest-reach cross-cutting concern).
 *
 * Facts web-verified S11 (2026-07):
 *  - Problem Details = RFC 9457, which OBSOLETES RFC 7807; media type application/problem+json; members
 *    type/title/status/detail/instance + extensions. 9457 adds guidance for MULTIPLE problems + a problem-
 *    type registry; wire format/media type unchanged from 7807 (backward compatible).
 *  - HTTP status semantics = RFC 9110 (4xx client / 5xx server); Retry-After = RFC 9110 §10.2.3 (seconds
 *    or HTTP-date), sent on 429/503.
 *  - gRPC: 16 canonical codes carried in the grpc-status trailer (+ grpc-message); rich detail via
 *    google.rpc.Status { code, message, details[] } (typed Any: BadRequest, RetryInfo, QuotaFailure…).
 *  - GraphQL: response has a top-level errors[] (message/locations/path/extensions) alongside possibly-
 *    partial data; request errors → data null, field errors → partial data. "Errors as data" = model
 *    expected/business errors as schema result/union types rather than the errors array.
 */
export const m19: Module = {
  id: 'm19-errors-status',
  num: 19,
  section: 's4-cross-cutting',
  order: 3,
  level: 'middle',
  title: { en: 'Errors & status semantics', uk: 'Помилки та семантика статусів' },
  tagline: {
    en: 'Problem Details (RFC 9457), gRPC status, GraphQL errors.',
    uk: 'Problem Details (RFC 9457), gRPC status, GraphQL errors.',
  },
  readMins: 14,
  mentalModel: {
    en: 'An error is **data the caller acts on, not a stack trace it will never see.** The client cannot read your logs; it can only branch on what you return — so a good error answers three questions in a machine-readable shape: **what** went wrong (a stable code the client can switch on), **whose fault** it is (client vs server → whether the request can ever succeed as-is), and **whether a retry could help**. Every style has a native error channel — an **HTTP status + a Problem Details body** for REST, the **`grpc-status` trailer** for gRPC, the **`errors` array** for GraphQL — but the discipline underneath is identical: **consistent, categorised, actionable, and free of leaked internals.** The happy path is half a contract; the error model is the other half.',
    uk: 'Помилка — це **дані, на які реагує викликач, а не stack trace, якого він ніколи не побачить.** Клієнт не читає твої логи; він може лише розгалужуватися на те, що ти повернув — тож добра помилка відповідає на три питання в машиночитній формі: **що** пішло не так (стабільний код, на який клієнт перемикається), **чия провина** (клієнт чи сервер → чи може запит узагалі вдатися як є) і **чи допоможе retry**. Кожен стиль має нативний канал помилок — **HTTP-статус + тіло Problem Details** для REST, трейлер **`grpc-status`** для gRPC, масив **`errors`** для GraphQL — але дисципліна під ними однакова: **послідовно, категоризовано, дієво й без витоку внутрішнього.** Щасливий шлях — це половина контракту; модель помилок — друга половина.',
  },
  topics: [
    // ── T1 · HTTP status semantics ────────────────────────────────────────────
    {
      id: 'http-status-semantics',
      title: { en: 'HTTP status: the coarse contract', uk: 'HTTP status: грубий контракт' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The status code (RFC 9110) is the **first, coarsest layer** of the error contract — and it is a contract with the *whole HTTP ecosystem*, not just your client: caches, proxies, retry libraries, and dashboards all read it. The classes carry meaning: **2xx** success, **3xx** redirection, **4xx client error** (the request was wrong — retrying it unchanged will not help), **5xx server error** (we failed — a retry may succeed). Reach for the *specific* code: `400` malformed, `401` unauthenticated, `403` unauthorized, `404` not found, `409` conflict, `422` unprocessable (well-formed but semantically invalid), `429` too many requests, `500` internal, `503` unavailable, `504` gateway timeout. The cardinal sin is **`200 OK` with an error inside**: it lies to every cache that will now store the failure, every proxy, every retry policy, and every monitor counting success. A status code alone is still too coarse — `400` does not say *which field* — which is exactly what a structured error body adds next.',
            uk: 'Статус-код (RFC 9110) — це **перший, найгрубіший шар** контракту помилок, і це контракт з *усією HTTP-екосистемою*, а не лише з твоїм клієнтом: кеші, proxy, retry-бібліотеки й дашборди читають його. Класи несуть сенс: **2xx** успіх, **3xx** редирект, **4xx client error** (запит був хибний — повтор без змін не допоможе), **5xx server error** (ми зазнали збою — retry може вдатися). Бери *конкретний* код: `400` malformed, `401` unauthenticated, `403` unauthorized, `404` not found, `409` conflict, `422` unprocessable (коректний за формою, але семантично невалідний), `429` too many requests, `500` internal, `503` unavailable, `504` gateway timeout. Кардинальний гріх — **`200 OK` з помилкою всередині**: це бреше кожному кешу, що збереже цей збій, кожному proxy, кожній retry-політиці й кожному монітору, що рахує успіх. Сам статус-код усе ще надто грубий — `400` не каже, *яке поле*, — і саме це додає далі структуроване тіло помилки.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: '4xx = fix your request · 5xx = maybe retry', uk: '4xx = виправ запит · 5xx = можливо retry' },
          md: {
            en: 'The class is a signal the client automates on. A validation failure returned as `500` invites pointless retries and pages your on-call; a real outage returned as `200` or `400` hides from monitoring and never gets retried. Pick the class by *whose fault and can-it-succeed*: client’s fault and won’t improve → 4xx; our fault and might recover → 5xx.',
            uk: 'Клас — це сигнал, на якому клієнт автоматизує. Помилка валідації, повернена як `500`, провокує безглузді retry й будить чергового; реальна аварія, повернена як `200` чи `400`, ховається від моніторингу й ніколи не ретраїться. Обирай клас за *чия провина й чи може вдатися*: провина клієнта й не покращиться → 4xx; наша провина й може відновитися → 5xx.',
          },
        },
      ],
    },
    // ── T2 · Problem Details (figure) ─────────────────────────────────────────
    {
      id: 'problem-details-rfc9457',
      title: { en: 'Problem Details (RFC 9457)', uk: 'Problem Details (RFC 9457)' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'A status code says *that* it failed; **Problem Details** says *what* failed in a standard, machine-readable body — so you never invent a bespoke `{error, message}` shape per endpoint again. Defined by **RFC 9457** (which **obsoletes RFC 7807**) with media type **`application/problem+json`**, a problem object has five standard members: **`type`** (a URI naming the problem *kind* — the stable machine key and a link to docs), **`title`** (a short human summary), **`status`** (the HTTP code, echoed for convenience), **`detail`** (a human explanation of *this* occurrence), and **`instance`** (a URI for this specific occurrence). You add **extension members** freely — an `errors` array of field violations, a `traceId`, a `balance`. The client **branches on `type`**, reads `detail` into logs, and renders `title` to humans. What 9457 adds over 7807 is guidance for representing **multiple problems** at once and a **registry** of common problem types; the media type and wire format are unchanged, so the upgrade is backward compatible.',
            uk: 'Статус-код каже, *що* впало; **Problem Details** каже, *що саме* впало, у стандартному машиночитному тілі — тож ти більше ніколи не вигадуєш власну форму `{error, message}` на кожен endpoint. Визначений **RFC 9457** (який **робить застарілим RFC 7807**) з media type **`application/problem+json`**, обʼєкт problem має пʼять стандартних членів: **`type`** (URI, що називає *вид* проблеми — стабільний машинний ключ і лінк на docs), **`title`** (короткий людський підсумок), **`status`** (HTTP-код, продубльований для зручності), **`detail`** (людське пояснення *цього* випадку) і **`instance`** (URI цього конкретного випадку). Ти вільно додаєш **extension-члени** — масив `errors` порушень полів, `traceId`, `balance`. Клієнт **розгалужується на `type`**, читає `detail` у логи й показує `title` людям. Що 9457 додає понад 7807 — це настанови для подання **кількох проблем** одразу й **реєстр** поширених типів проблем; media type і wire-формат незмінні, тож апгрейд backward-сумісний.',
          },
        },
        {
          kind: 'figure',
          fig: 'problem-details',
          caption: {
            en: 'An RFC 9457 application/problem+json body: type is the stable key clients branch on (with a docs link), status echoes the code, detail describes this occurrence, and errors[] is an extension member. The same logical error maps to gRPC (a grpc-status code + google.rpc.Status details) and to GraphQL (an errors[] entry with extensions.code).',
            uk: 'Тіло RFC 9457 application/problem+json: type — стабільний ключ, на який розгалужуються клієнти (з лінком на docs), status дублює код, detail описує цей випадок, а errors[] — extension-член. Та сама логічна помилка мапиться на gRPC (код grpc-status + деталі google.rpc.Status) і на GraphQL (запис errors[] з extensions.code).',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Branch on type, not on title', uk: 'Розгалужуйся на type, а не на title' },
          md: {
            en: '`type` is the machine contract — a stable URI you can switch on and document. `title` and `detail` are for humans and may be reworded, localised, or made more specific over time. A client that string-matches on the `title` text (“Invalid amount”) breaks the moment someone improves the copy; a client that switches on `type` (`…/problems/invalid-amount`) keeps working. Give every error a stable `type`, and treat prose as disposable.',
            uk: '`type` — це машинний контракт: стабільний URI, на який можна перемикатися й який можна документувати. `title` і `detail` — для людей і можуть бути переписані, локалізовані чи уточнені з часом. Клієнт, що матчить рядок `title` («Invalid amount»), ламається щойно хтось покращить текст; клієнт, що перемикається на `type` (`…/problems/invalid-amount`), працює далі. Дай кожній помилці стабільний `type`, а прозу вважай одноразовою.',
          },
        },
      ],
    },
    // ── T3 · gRPC status ──────────────────────────────────────────────────────
    {
      id: 'grpc-status',
      title: { en: 'gRPC status codes & rich details', uk: 'gRPC status-коди й багаті деталі' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'gRPC does **not** use the HTTP status for application errors — at the transport the HTTP/2 response is typically `200`. Instead the outcome rides two **trailers**: **`grpc-status`**, an integer from the **16 canonical codes** (`OK 0`, `INVALID_ARGUMENT 3`, `DEADLINE_EXCEEDED 4`, `NOT_FOUND 5`, `PERMISSION_DENIED 7`, `RESOURCE_EXHAUSTED 8`, `FAILED_PRECONDITION 9`, `UNAVAILABLE 14`, `UNAUTHENTICATED 16`, …), and **`grpc-message`**, a human string. For structured detail there is the **richer error model**: a **`google.rpc.Status`** message carrying `code`, `message`, and a `details` list of **typed `Any` protos** — `BadRequest.FieldViolation` for validation, `RetryInfo` to tell the client when to retry, `QuotaFailure`, and more. The canonical codes map roughly onto HTTP (`NOT_FOUND`↔404, `INVALID_ARGUMENT`↔400, `UNAUTHENTICATED`↔401, `PERMISSION_DENIED`↔403, `UNAVAILABLE`↔503), which is what a gateway uses to translate. Because the status lives in *trailers*, gRPC-Web needs a proxy to surface it (m10).',
            uk: 'gRPC **не** використовує HTTP-статус для помилок застосунку — на транспорті HTTP/2-відповідь зазвичай `200`. Натомість результат їде у двох **трейлерах**: **`grpc-status`**, ціле з **16 канонічних кодів** (`OK 0`, `INVALID_ARGUMENT 3`, `DEADLINE_EXCEEDED 4`, `NOT_FOUND 5`, `PERMISSION_DENIED 7`, `RESOURCE_EXHAUSTED 8`, `FAILED_PRECONDITION 9`, `UNAVAILABLE 14`, `UNAUTHENTICATED 16`, …), і **`grpc-message`**, людський рядок. Для структурованої деталі є **багатша модель помилок**: повідомлення **`google.rpc.Status`** несе `code`, `message` і список `details` з **типізованих `Any`-proto** — `BadRequest.FieldViolation` для валідації, `RetryInfo`, щоб сказати клієнту, коли ретраїти, `QuotaFailure` та інші. Канонічні коди грубо мапляться на HTTP (`NOT_FOUND`↔404, `INVALID_ARGUMENT`↔400, `UNAUTHENTICATED`↔401, `PERMISSION_DENIED`↔403, `UNAVAILABLE`↔503), і це те, чим gateway транслює. Оскільки статус живе в *трейлерах*, gRPC-Web потребує proxy, щоб його показати (m10).',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'UNKNOWN/INTERNAL is the “I didn’t map this” bucket', uk: 'UNKNOWN/INTERNAL — це відро «я це не змапив»' },
          md: {
            en: 'A server that returns `INTERNAL` or `UNKNOWN` for every failure gives the client nothing to react to. Map domain errors to the *specific* code — `INVALID_ARGUMENT` (bad input regardless of state) vs `FAILED_PRECONDITION` (valid input, wrong state) vs `OUT_OF_RANGE` vs `ALREADY_EXISTS` — so callers can distinguish “fix your request” from “retry later” from “resolve a conflict.” Precise codes are what make gRPC errors actionable.',
            uk: 'Сервер, що повертає `INTERNAL` чи `UNKNOWN` на кожен збій, не дає клієнту на що реагувати. Мап домену на *конкретний* код — `INVALID_ARGUMENT` (поганий вхід незалежно від стану) vs `FAILED_PRECONDITION` (валідний вхід, хибний стан) vs `OUT_OF_RANGE` vs `ALREADY_EXISTS` — щоб викликачі відрізняли «виправ запит» від «ретрай пізніше» від «розв’яжи конфлікт». Точні коди й роблять gRPC-помилки дієвими.',
          },
        },
      ],
    },
    // ── T4 · GraphQL errors ───────────────────────────────────────────────────
    {
      id: 'graphql-errors',
      title: { en: 'GraphQL errors & partial data', uk: 'GraphQL errors і часткові дані' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'GraphQL typically answers over a **`200`** (the transport succeeded even if fields failed) and puts failures in a **top-level `errors` array** next to a possibly-**partial `data`**. Two kinds. A **request error** — a malformed query, a validation or parse failure — means nothing executed: `data` is null/absent and `errors` explains why. A **field (execution) error** — a resolver threw — nulls *that* field, appends an entry to `errors` with a **`path`** pointing at it, and lets the **other fields still resolve**, so you get **partial data plus errors together**. Each error carries `message`, `locations`, `path`, and **`extensions`** (where you put a machine `code`, an HTTP-ish status, tracing). The senior refinement is **“errors as data”**: model *expected/business* outcomes — “email already taken”, “insufficient funds” — directly in the **schema** as union/result types (`RegisterResult = RegisterSuccess | EmailTaken`) so they are typed and the client *must* handle them, and reserve the `errors` array for *unexpected/system* failures.',
            uk: 'GraphQL зазвичай відповідає через **`200`** (транспорт вдався, навіть якщо поля впали) і кладе збої в **top-level масив `errors`** поряд із можливо-**частковим `data`**. Два види. **Request error** — зламаний запит, помилка валідації чи парсингу — означає, що нічого не виконалося: `data` null/відсутній, а `errors` пояснює чому. **Field (execution) error** — резолвер кинув виняток — обнуляє *це* поле, додає запис у `errors` з **`path`** на нього й дає **іншим полям усе одно зарезолвитися**, тож ти отримуєш **часткові дані разом із errors**. Кожна помилка несе `message`, `locations`, `path` і **`extensions`** (куди кладеш машинний `code`, HTTP-подібний статус, трейсинг). Senior-уточнення — **«errors as data»**: моделюй *очікувані/бізнесові* результати — «email already taken», «insufficient funds» — прямо в **схемі** як union/result-типи (`RegisterResult = RegisterSuccess | EmailTaken`), щоб вони були типізовані й клієнт *мусив* їх обробити, а масив `errors` лиши для *несподіваних/системних* збоїв.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'Partial success is real — check both data and errors', uk: 'Частковий успіх реальний — перевіряй і data, і errors' },
          md: {
            en: 'Unique to GraphQL: a single response can be **both** successful and failed — some fields resolved, others are null with an entry in `errors`. A client that treats `200` as “all good” and ignores the `errors` array will silently render partial data as complete. Always inspect both, and use the `path` to know exactly which field failed.',
            uk: 'Унікально для GraphQL: одна відповідь може бути **одночасно** успішною й провальною — частина полів зарезолвилась, інші null із записом у `errors`. Клієнт, що трактує `200` як «усе добре» й ігнорує масив `errors`, мовчки покаже часткові дані як повні. Завжди дивись на обидва й використовуй `path`, щоб знати, яке саме поле впало.',
          },
        },
      ],
    },
    // ── T5 · Retry & backoff ──────────────────────────────────────────────────
    {
      id: 'retry-and-backoff',
      title: { en: 'Retries, backoff & Retry-After', uk: 'Retries, backoff і Retry-After' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Errors have a client half: what to do with a failure. **Retry only what is safe.** Transient server/network failures (`502`/`503`/`504`, gRPC `UNAVAILABLE`/`DEADLINE_EXCEEDED`) and rate limits (`429`) are retriable; **`4xx` you caused** (`400`/`404`/`409`) are not — the request will not get better. And **never blindly retry a non-idempotent write** — a retried `POST` can charge a card twice — unless you carry an **idempotency key** so the server dedups it (m21). *How* you retry matters as much as *whether*: **exponential backoff with jitter** (randomised delay), a **cap on attempts**, and honour the server’s **`Retry-After`** header (RFC 9110 §10.2.3, seconds or an HTTP-date) on `429`/`503` — gRPC servers can return `RetryInfo` in the status details for the same purpose. Add a **circuit breaker** so calls to a dead dependency fail fast instead of piling up (m21).',
            uk: 'Помилки мають клієнтську половину: що робити зі збоєм. **Ретрай лише те, що безпечно.** Транзієнтні збої сервера/мережі (`502`/`503`/`504`, gRPC `UNAVAILABLE`/`DEADLINE_EXCEEDED`) і rate limits (`429`) ретріабельні; **`4xx`, які ти спричинив** (`400`/`404`/`409`), — ні: запит не покращиться. І **ніколи не ретрай наосліп не-ідемпотентний запис** — повторений `POST` може двічі списати картку — хіба що ти несеш **idempotency key**, щоб сервер це дедупнув (m21). *Як* ретраїш, важить не менше за *чи*: **exponential backoff із jitter** (рандомізована затримка), **обмеження спроб** і повага до header-а сервера **`Retry-After`** (RFC 9110 §10.2.3, секунди чи HTTP-date) на `429`/`503` — gRPC-сервери можуть повернути `RetryInfo` у деталях статусу для того самого. Додай **circuit breaker**, щоб виклики до мертвої залежності падали швидко, а не накопичувалися (m21).',
          },
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'Retries amplify — backoff + jitter are reliability features', uk: 'Retry підсилюють — backoff + jitter це фічі надійності' },
          md: {
            en: 'Without backoff, jitter, and caps, every client retrying a struggling server **in lockstep** is a self-inflicted DDoS — a brief blip becomes a retry storm that keeps the service down. Fixed-interval retries are the worst: they resynchronise the herd. Randomised exponential backoff spreads the load, a retry budget bounds it, and honouring `Retry-After` lets the server pace its own recovery. Treat retries as load you are adding, not a free safety net.',
            uk: 'Без backoff, jitter і обмежень кожен клієнт, що ретраїть перевантажений сервер **у такт**, — це самозаподіяний DDoS: коротка заминка стає retry-штормом, що тримає сервіс лежачим. Ретраї з фіксованим інтервалом найгірші: вони ре-синхронізують стадо. Рандомізований exponential backoff розмазує навантаження, retry-бюджет обмежує його, а повага до `Retry-After` дає серверу самому задати темп відновлення. Стався до retry як до навантаження, яке ти додаєш, а не як до безкоштовної страхувальної сітки.',
          },
        },
      ],
    },
    // ── T6 · Error taxonomy + verdict ─────────────────────────────────────────
    {
      id: 'error-taxonomy',
      title: { en: 'One taxonomy & the verdict', uk: 'Одна таксономія й вердикт' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Underneath every style is **one taxonomy**, and mapping your domain errors to it once is what keeps them consistent. Sort each error on three axes: **whose fault** — client (`4xx` / `INVALID_ARGUMENT`) vs server (`5xx` / `INTERNAL`/`UNAVAILABLE`); **retriable vs terminal**; and **expected/business vs unexpected/bug**. Expected outcomes should be **modelled as data** — a Problem Details `type`, a gRPC detail, a GraphQL result union — so clients handle them deliberately; unexpected failures collapse to a generic `500`/`INTERNAL` that **leaks nothing**. That last point is a rule, not a nicety: never put stack traces, SQL, or secrets in `detail`; log the real cause with a **`traceId`** and return *the id* so support can correlate without exposing internals (m23). Map once to the taxonomy, then express it natively per style.',
            uk: 'Під кожним стилем — **одна таксономія**, і мапінг твоїх доменних помилок на неї один раз і тримає їх послідовними. Сортуй кожну помилку за трьома осями: **чия провина** — клієнт (`4xx` / `INVALID_ARGUMENT`) vs сервер (`5xx` / `INTERNAL`/`UNAVAILABLE`); **ретріабельна vs термінальна**; і **очікувана/бізнесова vs несподівана/баг**. Очікувані результати варто **моделювати як дані** — `type` у Problem Details, деталь gRPC, result-union у GraphQL — щоб клієнти обробляли їх свідомо; несподівані збої згортаються в загальний `500`/`INTERNAL`, що **нічого не зливає**. Останнє — правило, а не забаганка: ніколи не клади stack trace, SQL чи секрети в `detail`; логуй справжню причину з **`traceId`** і повертай *id*, щоб підтримка корелювала без викриття внутрішнього (m23). Мап один раз на таксономію, тоді виражай нативно в кожному стилі.',
          },
        },
        {
          kind: 'compare',
          a: { en: 'Expected / business error', uk: 'Очікувана / бізнес-помилка' },
          b: { en: 'Unexpected / system error', uk: 'Несподівана / системна помилка' },
          rows: [
            [
              { en: 'Example', uk: 'Приклад' },
              { en: '“Insufficient funds”, “email taken”', uk: '«Insufficient funds», «email taken»' },
              { en: 'NullPointer, DB down, timeout', uk: 'NullPointer, БД лежить, timeout' },
            ],
            [
              { en: 'Model it as', uk: 'Моделюй як' },
              { en: 'Data: Problem type / result union', uk: 'Дані: Problem type / result-union' },
              { en: 'Generic 500 / INTERNAL', uk: 'Загальний 500 / INTERNAL' },
            ],
            [
              { en: 'Detail exposed?', uk: 'Деталь відкрита?' },
              { en: 'Yes — actionable for the client', uk: 'Так — дієва для клієнта' },
              { en: 'No — log with a traceId', uk: 'Ні — логуй з traceId' },
            ],
            [
              { en: 'Retriable?', uk: 'Ретріабельна?' },
              { en: 'No — the caller must change something', uk: 'Ні — викликач має щось змінити' },
              { en: 'Often — transient, back off', uk: 'Часто — транзієнтна, backoff' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'The verdict', uk: 'Вердикт' },
          md: {
            en: 'Treat errors as a **first-class, typed part of the contract**. Use the right status **class** (never `200`-on-failure — GraphQL’s `200` is the one deliberate exception, and even then read the `errors` array). Carry **machine-readable detail** — Problem Details (`type`) for REST, `grpc-status` + `google.rpc.Status` details for gRPC, `extensions.code` and result types for GraphQL — and give clients a **stable code to branch on**, never prose. Make retries **safe** (idempotency keys) and **gentle** (exponential backoff + jitter + caps, honour `Retry-After`). And **leak nothing**: model expected errors as data, collapse the unexpected to a generic failure with a `traceId`. A consistent error model is as much a feature as the happy path.',
            uk: 'Стався до помилок як до **першокласної, типізованої частини контракту**. Використовуй правильний **клас** статусу (ніколи `200`-на-збій — `200` у GraphQL це єдиний свідомий виняток, і навіть тоді читай масив `errors`). Неси **машиночитну деталь** — Problem Details (`type`) для REST, `grpc-status` + деталі `google.rpc.Status` для gRPC, `extensions.code` і result-типи для GraphQL — і дай клієнтам **стабільний код для розгалуження**, ніколи прозу. Роби retry **безпечними** (idempotency keys) і **делікатними** (exponential backoff + jitter + обмеження, повага до `Retry-After`). І **нічого не зливай**: моделюй очікувані помилки як дані, згортай несподівані в загальний збій із `traceId`. Послідовна модель помилок — така сама фіча, як і щасливий шлях.',
          },
        },
      ],
    },
  ],
  keyPoints: [
    { en: 'An error is data, not a stack trace: return a typed, machine-readable shape answering what failed (a stable code), whose fault (client vs server), and whether a retry can help.', uk: 'Помилка — це дані, а не stack trace: повертай типізовану машиночитну форму, що відповідає, що впало (стабільний код), чия провина (клієнт vs сервер) і чи допоможе retry.' },
    { en: 'HTTP status is a contract with the whole ecosystem: 4xx = fix the request (do not retry unchanged), 5xx = server fault (may retry). Never return 200 with an error body — it lies to caches, proxies, retries, and monitors.', uk: 'HTTP-статус — це контракт з усією екосистемою: 4xx = виправ запит (не ретрай без змін), 5xx = провина сервера (можна retry). Ніколи не повертай 200 з тілом помилки — це бреше кешам, proxy, retry й моніторам.' },
    { en: 'Problem Details (RFC 9457, obsoletes 7807; application/problem+json) is the standard REST error body: type (branch on this) · title · status · detail · instance + extensions. 9457 adds multiple-problems + a type registry.', uk: 'Problem Details (RFC 9457, робить застарілим 7807; application/problem+json) — стандартне тіло помилки REST: type (розгалужуйся на нього) · title · status · detail · instance + extensions. 9457 додає кілька-проблем + реєстр типів.' },
    { en: 'gRPC carries the outcome in the grpc-status trailer (16 canonical codes) + grpc-message, with rich detail via google.rpc.Status details; map domain errors to the specific code, not UNKNOWN/INTERNAL.', uk: 'gRPC несе результат у трейлері grpc-status (16 канонічних кодів) + grpc-message, з багатою деталлю через google.rpc.Status details; мап домен на конкретний код, а не UNKNOWN/INTERNAL.' },
    { en: 'GraphQL answers over 200 with a top-level errors[] plus possibly-partial data (request error → data null; field error → partial + a path). Model expected/business errors as schema result types — “errors as data”.', uk: 'GraphQL відповідає через 200 з top-level errors[] плюс можливо-частковими data (request error → data null; field error → часткові + path). Моделюй очікувані/бізнес-помилки як result-типи схеми — «errors as data».' },
    { en: 'Retry only what is safe (transient 5xx/429/UNAVAILABLE, idempotent or keyed writes) with exponential backoff + jitter + a cap, honouring Retry-After — lockstep retries without jitter are a self-inflicted DDoS.', uk: 'Ретрай лише безпечне (транзієнтні 5xx/429/UNAVAILABLE, ідемпотентні чи keyed записи) з exponential backoff + jitter + обмеженням, з повагою до Retry-After — ретраї в такт без jitter це самозаподіяний DDoS.' },
  ],
  pitfalls: [
    {
      title: { en: '200 OK with an error inside (or the wrong class)', uk: '200 OK з помилкою всередині (чи хибний клас)' },
      body: {
        en: 'Returning success for a failure — or a 500 for a validation error — lies to every cache, proxy, retry policy, and dashboard that reads the status. Use the right 4xx/5xx class so automated handling works. GraphQL’s 200-with-errors is the single deliberate exception, and even there the client must read the errors array rather than trust the 200.',
        uk: 'Повертати успіх на збій — чи 500 на помилку валідації — бреше кожному кешу, proxy, retry-політиці й дашборду, що читає статус. Використовуй правильний клас 4xx/5xx, щоб автоматика працювала. 200-з-errors у GraphQL — єдиний свідомий виняток, і навіть там клієнт має читати масив errors, а не вірити 200.',
      },
    },
    {
      title: { en: 'Branching on prose / leaking internals', uk: 'Розгалуження на прозу / витік внутрішнього' },
      body: {
        en: 'Matching on the human message text (“Invalid amount”) is brittle — it breaks on rewording or localisation; branch on a stable type/code instead. And never put stack traces, SQL, or secrets in the error body: model expected errors as data and collapse unexpected ones to a generic failure with a traceId you log server-side.',
        uk: 'Матчинг на людський текст повідомлення («Invalid amount») крихкий — ламається на переписуванні чи локалізації; розгалужуйся натомість на стабільний type/code. І ніколи не клади stack trace, SQL чи секрети в тіло помилки: моделюй очікувані помилки як дані, а несподівані згортай у загальний збій із traceId, який логуєш на сервері.',
      },
    },
    {
      title: { en: 'Blind or lockstep retries', uk: 'Ретраї наосліп чи в такт' },
      body: {
        en: 'Retrying a non-idempotent write double-applies it (a double charge); retrying a 400/404 never succeeds; and retrying in fixed-interval lockstep without jitter or caps turns a blip into a retry storm that keeps the service down. Retry only safe/idempotent (or idempotency-keyed) requests, with exponential backoff + jitter + a budget, and honour Retry-After.',
        uk: 'Ретрай не-ідемпотентного запису застосовує його двічі (подвійне списання); ретрай 400/404 ніколи не вдасться; а ретрай у такт з фіксованим інтервалом без jitter чи обмежень перетворює заминку на retry-шторм, що тримає сервіс лежачим. Ретрай лише безпечні/ідемпотентні (чи idempotency-keyed) запити з exponential backoff + jitter + бюджетом і поважай Retry-After.',
      },
    },
  ],
  interview: [
    {
      q: {
        en: 'Design the error responses for a REST endpoint that validates and submits a payment: one for a bad amount, one for a downstream outage.',
        uk: 'Спроєктуй відповіді-помилки для REST-endpoint, що валідує й подає платіж: одну для поганої суми, одну для downstream-аварії.',
      },
      a: {
        en: 'Both use the same Problem Details (application/problem+json) shape so the client has one parser, but they differ on class and on what I expose. The bad amount is a client error and is safe to detail: I return 422 (well-formed but semantically invalid) with type "https://api.acme.com/problems/invalid-amount" — the stable key the client branches on, and a link to docs — a title "Invalid amount", the status echoed, a human detail like "amount must be greater than 0", and an extension errors array pinning the field. It is not retriable: the caller must change the request. The downstream outage is a server fault: I return 503 with a generic Problem Details (type "…/service-unavailable"), a Retry-After header so the client backs off on the server’s schedule, and crucially no leaked internals — I log the real cause (the timeout, the stack) with a traceId and return that traceId in the body so support can correlate. The contrasts are the teaching points: 4xx don’t retry, 5xx may; validation is safe to expose, internals never are; the client switches on type, not on the prose; and expected errors are modelled as data while the unexpected collapses to a generic failure with a correlation id.',
        uk: 'Обидві використовують ту саму форму Problem Details (application/problem+json), щоб у клієнта був один парсер, але різняться класом і тим, що я відкриваю. Погана сума — це client error і її безпечно деталізувати: я повертаю 422 (коректна за формою, але семантично невалідна) з type "https://api.acme.com/problems/invalid-amount" — стабільний ключ, на який розгалужується клієнт, і лінк на docs — title "Invalid amount", продубльований status, людський detail на кшталт "amount must be greater than 0" й extension-масив errors, що вказує поле. Вона не ретріабельна: викликач має змінити запит. Downstream-аварія — це провина сервера: я повертаю 503 із загальним Problem Details (type "…/service-unavailable"), header Retry-After, щоб клієнт відступив за розкладом сервера, і головне — без витоку внутрішнього: я логую справжню причину (timeout, стек) із traceId і повертаю цей traceId у тілі, щоб підтримка корелювала. Контрасти — це навчальні тези: 4xx не ретраять, 5xx можуть; валідацію безпечно відкрити, внутрішнє — ніколи; клієнт перемикається на type, а не на прозу; очікувані помилки моделюються як дані, а несподівані згортаються в загальний збій із correlation id.',
      },
      level: 'middle',
    },
    {
      q: {
        en: 'A client is hammering your struggling service with retries and making the outage worse. What is going wrong, and how do you fix both sides?',
        uk: 'Клієнт гатить твій перевантажений сервіс ретраями й погіршує аварію. Що не так і як полагодити обидві сторони?',
      },
      a: {
        en: 'This is a retry storm: retries are being treated as free, so a brief failure amplifies into sustained load that prevents recovery. On the server side, I make sure I’m signalling correctly — return 429 or 503 with a Retry-After so clients pace themselves, shed load rather than accept work I can’t finish, and add a circuit breaker so callers fail fast; I also check I’m not returning a retriable 5xx for something that is really a terminal 4xx, which would invite pointless retries. On the client side, the fix is exponential backoff WITH jitter instead of fixed intervals — fixed intervals resynchronise the whole herd — plus a hard cap on attempts and a retry budget so a single logical call can’t spawn unbounded traffic, and it must honour Retry-After. Retries must also be restricted to idempotent or idempotency-keyed requests so they don’t double-apply writes (m21). The root cause is the assumption that a retry is a free safety net; once retries are safe via idempotency and gentle via backoff-jitter-caps, the amplification that turned a blip into an outage disappears.',
        uk: 'Це retry-шторм: ретраї трактуються як безкоштовні, тож короткий збій підсилюється в тривале навантаження, що не дає відновитися. На боці сервера я переконуюсь, що сигналю правильно — повертаю 429 чи 503 із Retry-After, щоб клієнти самі задавали темп, скидаю навантаження замість приймати роботу, яку не завершу, і додаю circuit breaker, щоб викликачі падали швидко; ще перевіряю, що не повертаю ретріабельний 5xx для того, що насправді термінальний 4xx, бо це провокує безглузді ретраї. На боці клієнта фікс — exponential backoff ІЗ jitter замість фіксованих інтервалів (фіксовані ре-синхронізують усе стадо) плюс жорстке обмеження спроб і retry-бюджет, щоб один логічний виклик не породжував безмежний трафік, і він мусить поважати Retry-After. Ретраї також слід обмежити ідемпотентними чи idempotency-keyed запитами, щоб не застосовувати записи двічі (m21). Корінь — припущення, що retry це безкоштовна страхувальна сітка; щойно ретраї безпечні через ідемпотентність і делікатні через backoff-jitter-обмеження, підсилення, що зробило заминку аварією, зникає.',
      },
      level: 'senior',
    },
  ],
  seeAlso: ['m5-rest', 'm10-grpc', 'm9-graphql', 'm21-idempotency', 'm20-pagination-limits'],
  sources: [
    { title: 'RFC 9457 — Problem Details for HTTP APIs (obsoletes RFC 7807)', url: 'https://www.rfc-editor.org/rfc/rfc9457.html' },
    { title: 'RFC 9110 — HTTP Semantics (status codes; §10.2.3 Retry-After)', url: 'https://www.rfc-editor.org/rfc/rfc9110.html' },
    { title: 'gRPC — Status codes and their use in gRPC', url: 'https://grpc.io/docs/guides/status-codes/' },
    { title: 'Google — API Design Guide: Errors (google.rpc.Status model)', url: 'https://cloud.google.com/apis/design/errors' },
    { title: 'GraphQL Specification — Section 7.1.2 Errors (response format)', url: 'https://spec.graphql.org/draft/#sec-Errors' },
    { title: 'Apollo GraphQL — Errors as Data (result/union modelling)', url: 'https://www.apollographql.com/docs/graphos/schema-design/guides/errors-as-data-explained' },
    { title: 'Amazon Builders’ Library — Timeouts, retries, and backoff with jitter', url: 'https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/' },
  ],
};
