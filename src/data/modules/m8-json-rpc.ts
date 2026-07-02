import type { Module } from '../types';

/*
 * m8-json-rpc — call a function over HTTP, nothing more (s1, Request/Response over HTTP). Right-sized:
 * no sim; figure 'rpc-envelope' (request/response/error + notification + batch). Five curriculum topics:
 * rpc-over-http → the request/response shape → batch & notifications → XML-RPC origins → vs REST vs
 * gRPC + verdict. Facts web-verified S10a: JSON-RPC 2.0 spec (2010, jsonrpc.org, frozen,
 * transport-agnostic); reserved error codes -32700/-32600/-32601/-32602/-32603 and the -32000..-32099
 * server range; XML-RPC (1998) → SOAP lineage; alive today in LSP, Ethereum (eth_*), and MCP — the
 * Model Context Protocol runs JSON-RPC 2.0 over stdio and Streamable HTTP.
 */
export const m8: Module = {
  id: 'm8-json-rpc',
  num: 8,
  section: 's1-req-resp-http',
  order: 4,
  level: 'middle',
  title: { en: 'JSON-RPC & XML-RPC', uk: 'JSON-RPC і XML-RPC' },
  tagline: { en: 'Call a function over HTTP — nothing more.', uk: 'Виклик функції через HTTP — не більше.' },
  readMins: 10,
  mentalModel: {
    en: 'JSON-RPC strips the API problem to its minimum: **name a method, pass params, correlate the reply by `id`**. No resources, no verbs, no status-code semantics — one tiny JSON envelope that works over *any* transport: HTTP, WebSockets, stdio, raw TCP. That smallness is why it keeps being rediscovered: your editor (LSP), Ethereum nodes, and the AI-agent era’s MCP all speak it.',
    uk: 'JSON-RPC зрізає проблему API до мінімуму: **назви метод, передай params, скорелюй відповідь за `id`**. Без ресурсів, без дієслів, без семантики статус-кодів — один крихітний JSON-конверт, що працює через *будь-який* транспорт: HTTP, WebSockets, stdio, сирий TCP. Саме ця малість — причина, чому його перевідкривають знову і знову: ним говорять твій редактор (LSP), вузли Ethereum і MCP ери AI-агентів.',
  },
  topics: [
    // ── T1 · RPC over HTTP ────────────────────────────────────────────────────
    {
      id: 'rpc-over-http',
      title: { en: 'RPC over HTTP: the minimal contract', uk: 'RPC через HTTP: мінімальний контракт' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Where REST (m5) asks *“which resource does this act on?”*, RPC asks the programmer’s native question: *“which function am I calling?”*. **JSON-RPC 2.0** — a deliberately **frozen** one-page spec from 2010 at jsonrpc.org — is that idea at its smallest. It defines exactly one thing: the envelope. Everything else — transport, discovery, types, auth — is out of scope *on purpose*. Over HTTP it’s typically a single `POST /rpc` endpoint; but the same envelope runs over a WebSocket (m12), a Unix pipe, or an editor’s stdio — **transport-agnosticism is the feature**, and it’s why the protocol outlives every hype cycle around it.',
            uk: 'Де REST (m5) питає *«над яким ресурсом це діє?»*, RPC ставить рідне для програміста питання: *«яку функцію я викликаю?»*. **JSON-RPC 2.0** — свідомо **заморожена** односторінкова специфікація 2010 року на jsonrpc.org — ця ідея в найменшому вигляді. Вона визначає рівно одну річ: конверт. Усе решта — транспорт, discovery, типи, auth — *навмисно* поза скоупом. Через HTTP це зазвичай один endpoint `POST /rpc`; але той самий конверт їде через WebSocket (m12), Unix-пайп чи stdio редактора — **транспортна агностичність і є фічею**, і саме тому протокол переживає кожен hype-цикл довкола.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'The 2020s plot twist: JSON-RPC won the agent era', uk: 'Сюжетний поворот 2020-х: JSON-RPC виграв еру агентів' },
          md: {
            en: 'The protocols defining today’s tooling are JSON-RPC 2.0 underneath: the **Language Server Protocol** that powers your editor’s IntelliSense, **Ethereum’s** node API (`eth_getBalance`, `eth_call`), and — the headline — **MCP (Model Context Protocol)**, the standard for connecting AI agents to tools, which runs JSON-RPC 2.0 over stdio locally and Streamable HTTP remotely. When a protocol needs calls over *arbitrary* transports with zero ceremony, this 2010 envelope keeps winning.',
            uk: 'Протоколи, що визначають сьогоднішній тулінг, всередині — JSON-RPC 2.0: **Language Server Protocol**, що живить IntelliSense твого редактора, **API вузлів Ethereum** (`eth_getBalance`, `eth_call`) і — головне — **MCP (Model Context Protocol)**, стандарт підключення AI-агентів до інструментів, який жене JSON-RPC 2.0 через stdio локально та Streamable HTTP віддалено. Коли протоколу потрібні виклики через *довільні* транспорти без церемоній, цей конверт 2010 року перемагає знову.',
          },
        },
      ],
    },
    // ── T2 · The request/response shape (figure) ──────────────────────────────
    {
      id: 'request-response-shape',
      title: { en: 'The envelope: request, response, error', uk: 'Конверт: request, response, error' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'A **request** is four fields: `jsonrpc: "2.0"`, a `method` name, optional `params` (array or object), and an `id` for correlation. A **response** echoes the `id` and carries *exactly one* of `result` or `error`. An **error** is structured: `code` (integer), `message`, optional `data` — with reserved codes for protocol failures: `-32700` parse error, `-32600` invalid request, `-32601` method not found, `-32602` invalid params, `-32603` internal, and `-32000…-32099` for server-defined errors. The `id` is what makes the envelope transport-agnostic: over an async pipe where responses arrive out of order, correlation lives *in the message*, not in the connection.',
            uk: 'У **request** чотири поля: `jsonrpc: "2.0"`, назва `method`, опційні `params` (масив або обʼєкт) та `id` для кореляції. **Response** повторює `id` і несе *рівно одне* з `result` або `error`. **Error** структурований: `code` (ціле), `message`, опційна `data` — із зарезервованими кодами для протокольних відмов: `-32700` parse error, `-32600` invalid request, `-32601` method not found, `-32602` invalid params, `-32603` internal, і `-32000…-32099` для серверних. Саме `id` робить конверт транспортно-агностичним: над асинхронним каналом, де відповіді приходять не по черзі, кореляція живе *в повідомленні*, а не в зʼєднанні.',
          },
        },
        {
          kind: 'figure',
          fig: 'rpc-envelope',
          caption: {
            en: 'The whole protocol on one card: request (method + params + id), success (result, same id), error (code/message), a notification (no id → no reply), and a batch (an array of calls).',
            uk: 'Увесь протокол на одній картці: request (method + params + id), успіх (result, той самий id), error (code/message), notification (без id → без відповіді) і batch (масив викликів).',
          },
        },
        {
          kind: 'code',
          lang: 'json',
          code: `// → request                                  // ← response (same id)
{ "jsonrpc": "2.0",                            { "jsonrpc": "2.0",
  "method": "invoice.markPaid",                  "id": 7,
  "params": { "invoiceId": "inv_42" },           "result": { "status": "paid" } }
  "id": 7 }
                                               // ← or a structured error
                                               { "jsonrpc": "2.0", "id": 7,
                                                 "error": { "code": -32601,
                                                            "message": "Method not found" } }`,
          note: {
            en: 'One shape for every call. Note the anti-pattern it invites: HTTP 200 with an error inside — your monitoring must read the envelope, not the status line (m19, m23).',
            uk: 'Одна форма для кожного виклику. Зауваж анти-патерн, який вона запрошує: HTTP 200 з помилкою всередині — твій моніторинг мусить читати конверт, а не статусний рядок (m19, m23).',
          },
        },
      ],
    },
    // ── T3 · Batch & notifications ────────────────────────────────────────────
    {
      id: 'batch-notifications',
      title: { en: 'Batches & notifications', uk: 'Batch і notifications' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Two envelope tricks round out the spec. A **notification** is a request *without an `id`* — the server MUST NOT reply, even on error: true fire-and-forget for logs, progress ticks, cache invalidation hints (LSP uses them heavily — `textDocument/didChange` is a notification). A **batch** is an array of requests in one message; responses come back as an array matched by `id`, in *any order*, with notifications contributing nothing. The same caveats as OData’s `$batch` (m6) apply — one opaque blob hides the calls from gateway-level caching, limits and logs — plus one sharp edge: a notification’s errors are *silent by design*, so never use one for anything you need to know succeeded.',
            uk: 'Два трюки конверта довершують специфікацію. **Notification** — це request *без `id`* — сервер НЕ ПОВИНЕН відповідати навіть при помилці: справжній fire-and-forget для логів, тіків прогресу, підказок інвалідації кешу (LSP вживає їх щедро — `textDocument/didChange` є notification). **Batch** — масив request-ів в одному повідомленні; відповіді повертаються масивом, зіставленим за `id`, у *будь-якому порядку*, а notifications не додають нічого. Діють ті самі застереження, що для `$batch` в OData (m6) — один непрозорий blob ховає виклики від кешування, лімітів і логів рівня gateway, — плюс один гострий край: помилки notification *тихі за дизайном*, тож ніколи не вживай його для того, про успіх чого мусиш знати.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'A notification is not “probably delivered”', uk: 'Notification — це не «мабуть доставлено»' },
          md: {
            en: 'No id means no response, no error, no retry signal — the spec forbids the server from telling you anything, including “that method doesn’t exist”. If the call mutates state or money, give it an id. Notifications are for telemetry-grade traffic where silent loss is acceptable.',
            uk: 'Немає id — немає відповіді, помилки чи сигналу для retry: специфікація забороняє серверу казати будь-що, включно з «такого методу не існує». Якщо виклик змінює стан чи гроші — дай йому id. Notifications — для трафіку телеметрійного класу, де тиха втрата прийнятна.',
          },
        },
      ],
    },
    // ── T4 · XML-RPC origins ──────────────────────────────────────────────────
    {
      id: 'xml-rpc-origins',
      title: { en: 'XML-RPC: where it all came from', uk: 'XML-RPC: звідки все пішло' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The lineage explains the landscape. **XML-RPC (1998)** — Dave Winer with Microsoft — was the first mainstream “call a function over HTTP” protocol: `<methodCall>` and typed `<params>` in XML, POSTed to an endpoint. It begat two children with opposite temperaments. Grown *upward* — with envelopes, schemas, headers and a standards body — it became **SOAP** (m7). Slimmed *downward* — same call shape, JSON instead of XML, one page instead of a stack — it became JSON-RPC. XML-RPC itself still ships (WordPress’s legacy `xmlrpc.php` is the famous survivor, mostly notable as an attack surface to disable), but its real legacy is the pattern every generation reinvents: the smallest possible way to say *“run this, with these, tell me what happened”*.',
            uk: 'Родовід пояснює ландшафт. **XML-RPC (1998)** — Дейв Вайнер разом із Microsoft — перший мейнстримний протокол «виклич функцію через HTTP»: `<methodCall>` і типізовані `<params>` в XML, POST-нуті на endpoint. Він породив двох дітей із протилежними темпераментами. Вирісши *вгору* — з конвертами, схемами, header-ами та органом стандартизації — став **SOAP** (m7). Схуднувши *вниз* — та сама форма виклику, JSON замість XML, одна сторінка замість стека — став JSON-RPC. Сам XML-RPC досі трапляється (легендарний вцілілий — legacy `xmlrpc.php` у WordPress, відомий здебільшого як поверхня атаки, яку варто вимикати), але справжня спадщина — патерн, який перевинаходить кожне покоління: найменший можливий спосіб сказати *«виконай оце, з оцим, скажи, що вийшло»*.',
          },
        },
      ],
    },
    // ── T5 · vs REST vs gRPC + the verdict ────────────────────────────────────
    {
      id: 'vs-rest-vs-grpc',
      title: { en: 'vs REST vs gRPC — and the verdict', uk: 'Проти REST і gRPC — та вердикт' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Three ways to do request/response, one axis: **how much the protocol does for you**. Against **REST** (m5), JSON-RPC gives up the uniform interface: no resource URLs to cache, no method semantics for proxies, no status codes for middleware — everything is `POST /rpc` + envelope, so the web’s infrastructure goes blind. In exchange: zero impedance mismatch for *action-shaped* operations (`recalculateTaxes` never mapped cleanly onto a resource anyway). Against **gRPC** (m10), it lacks the IDL, codegen, streaming and deadline machinery — but needs no toolchain, no HTTP/2, and stays human-readable in curl and logs. Its niche is precise: **action-oriented calls over flexible transports with minimal ceremony** — internal tools, editor/agent protocols, blockchain nodes, embedded devices.',
            uk: 'Три способи зробити request/response, одна вісь: **скільки протокол робить за тебе**. Проти **REST** (m5) JSON-RPC віддає uniform interface: немає ресурсних URL для кешу, семантики методів для proxy, статус-кодів для middleware — все є `POST /rpc` + конверт, тож інфраструктура вебу сліпне. Натомість: нульовий опір для операцій *у формі дій* (`recalculateTaxes` ніколи чисто не мапився на ресурс). Проти **gRPC** (m10) йому бракує IDL, codegen, стримінгу й машинерії deadline-ів — зате не треба тулчейну, HTTP/2, і він лишається людиночитним у curl і логах. Ніша точна: **виклики-дії через гнучкі транспорти з мінімумом церемоній** — внутрішні інструменти, протоколи редакторів/агентів, блокчейн-вузли, embedded-пристрої.',
          },
        },
        {
          kind: 'compare',
          a: { en: 'Reach for JSON-RPC', uk: 'Бери JSON-RPC' },
          b: { en: 'Prefer REST / gRPC', uk: 'Обери REST / gRPC' },
          rows: [
            [
              { en: 'Operation shape', uk: 'Форма операцій' },
              { en: 'Actions/commands: run, compute, subscribe', uk: 'Дії/команди: виконай, порахуй, підпишись' },
              { en: 'Resource CRUD with caching → REST', uk: 'CRUD ресурсів із кешуванням → REST' },
            ],
            [
              { en: 'Transport', uk: 'Транспорт' },
              { en: 'Must run over stdio/WS/TCP/HTTP alike', uk: 'Має їхати однаково через stdio/WS/TCP/HTTP' },
              { en: 'HTTP-only public APIs → REST conventions', uk: 'Лише HTTP публічні API → конвенції REST' },
            ],
            [
              { en: 'Contract & perf', uk: 'Контракт і перформанс' },
              { en: 'A JSON schema note + tests is enough', uk: 'Досить JSON-схеми в нотатці + тестів' },
              { en: 'Typed IDL, codegen, streaming, deadlines → gRPC', uk: 'Типізований IDL, codegen, стримінг, deadlines → gRPC' },
            ],
            [
              { en: 'Observability', uk: 'Observability' },
              { en: 'You own it: envelope-aware logs/metrics', uk: 'Твоя робота: логи/метрики, свідомі конверта' },
              { en: 'Status codes & URLs light up standard tooling', uk: 'Статус-коди й URL-и вмикають стандартний тулінг' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'The verdict', uk: 'Вердикт' },
          md: {
            en: 'Use JSON-RPC when calls are actions, transports vary, and ceremony must be near zero — internal admin commands, plugin and editor protocols (LSP), agent tooling (MCP), node APIs (Ethereum). Avoid it for public resource-centric APIs (REST’s caching and conventions pay real dividends) and for high-throughput typed microservice meshes (gRPC’s IDL and streaming earn their toolchain). And if you build one: define method-not-found and validation behavior via the reserved codes, log the envelope not the 200, and version your method names (`billing.v2.charge`) from day one.',
            uk: 'Бери JSON-RPC, коли виклики — дії, транспорти різні, а церемоній має бути майже нуль: внутрішні адмін-команди, протоколи плагінів і редакторів (LSP), тулінг агентів (MCP), API вузлів (Ethereum). Уникай його для публічних ресурсо-центричних API (кешування й конвенції REST платять реальні дивіденди) і для високопропускних типізованих мереж мікросервісів (IDL і стримінг gRPC відпрацьовують свій тулчейн). А якщо будуєш свій: визнач поведінку method-not-found і валідації через зарезервовані коди, логуй конверт, а не 200, і версіонуй назви методів (`billing.v2.charge`) з першого дня.',
          },
        },
      ],
    },
  ],
  keyPoints: [
    { en: 'JSON-RPC 2.0 defines only the envelope: method + params + id in, exactly one of result | error out — a frozen one-page spec from 2010 that never needed a v3.', uk: 'JSON-RPC 2.0 визначає лише конверт: method + params + id на вході, рівно одне з result | error на виході — заморожена односторінкова специфікація 2010 року, якій не знадобилася v3.' },
    { en: 'Correlation lives in the message (the id), not the connection — that is what makes it transport-agnostic: HTTP, WebSockets, stdio, TCP all carry it unchanged.', uk: 'Кореляція живе в повідомленні (id), а не в зʼєднанні — саме це робить його транспортно-агностичним: HTTP, WebSockets, stdio, TCP несуть його без змін.' },
    { en: 'Structured errors use reserved codes (-32700 parse, -32601 method not found, -32602 invalid params…, -32000..-32099 server) — but they ride inside an HTTP 200, so monitor the envelope.', uk: 'Структуровані помилки мають зарезервовані коди (-32700 parse, -32601 method not found, -32602 invalid params…, -32000..-32099 серверні) — але їдуть усередині HTTP 200, тож моніторити треба конверт.' },
    { en: 'A notification (no id) gets no reply even on failure — telemetry-grade only; a batch is an array with responses matched by id in any order.', uk: 'Notification (без id) не отримує відповіді навіть при відмові — лише для телеметрійного класу; batch — масив із відповідями, зіставленими за id у довільному порядку.' },
    { en: 'The lineage: XML-RPC (1998) grew up into SOAP and slimmed down into JSON-RPC — the same “call a function over the wire” pattern at three ceremony levels.', uk: 'Родовід: XML-RPC (1998) виріс у SOAP і схуд у JSON-RPC — той самий патерн «виклич функцію через дріт» на трьох рівнях церемоній.' },
    { en: 'It quietly won the tooling era: LSP (your editor), Ethereum nodes (eth_*), and MCP for AI agents (JSON-RPC 2.0 over stdio / Streamable HTTP) all standardized on it.', uk: 'Він тихо виграв еру тулінгу: LSP (твій редактор), вузли Ethereum (eth_*) і MCP для AI-агентів (JSON-RPC 2.0 через stdio / Streamable HTTP) стандартизувалися саме на ньому.' },
  ],
  pitfalls: [
    {
      title: { en: 'HTTP 200 with an error inside — invisible failures', uk: 'HTTP 200 з помилкою всередині — невидимі відмови' },
      body: {
        en: 'Gateways, dashboards and alerting keyed on status codes see a perfectly healthy 200 stream while every call fails with -32602. Parse the envelope at the observability layer: count error codes, alert on their rate, and map them to your error taxonomy (m19).',
        uk: 'Gateway-ї, дашборди й алерти, завʼязані на статус-коди, бачать ідеально здоровий потік 200-х, поки кожен виклик падає з -32602. Парси конверт на рівні observability: рахуй коди помилок, алерти на їхню частку й мапу на твою таксономію помилок (m19).',
      },
    },
    {
      title: { en: 'Using notifications for state-changing calls', uk: 'Notifications для викликів, що змінюють стан' },
      body: {
        en: 'No id means the server is forbidden from replying — no error, no confirmation, no retry signal. A dropped “markPaid” notification is a silently lost payment. Reserve notifications for loss-tolerant telemetry; everything mutating gets an id.',
        uk: 'Без id серверу заборонено відповідати — ані помилки, ані підтвердження, ані сигналу для retry. Загублений notification «markPaid» — тихо втрачений платіж. Лишай notifications для толерантної до втрат телеметрії; все, що мутує, отримує id.',
      },
    },
    {
      title: { en: 'An unversioned, undocumented method namespace', uk: 'Неверсіонований, незадокументований простір методів' },
      body: {
        en: 'With no IDL and no resource structure, the method list IS your API surface — and it drifts fast. Namespace and version method names (billing.v2.charge), publish a schema for params/results (JSON Schema works), and reject unknown methods with -32601 rather than guessing.',
        uk: 'Без IDL і ресурсної структури список методів І Є поверхнею твого API — і він швидко дрейфує. Неймспейс і версіонуй назви методів (billing.v2.charge), публікуй схему params/results (JSON Schema підходить) і відхиляй невідомі методи через -32601, а не вгадуй.',
      },
    },
  ],
  interview: [
    {
      q: { en: 'Why did MCP and LSP pick JSON-RPC instead of REST or gRPC? When would you make the same call?', uk: 'Чому MCP і LSP обрали JSON-RPC замість REST чи gRPC? Коли ти зробиш той самий вибір?' },
      a: {
        en: 'Both protocols need the same three properties. First, transport-agnosticism: an editor talks to a language server over stdio, an AI agent talks to an MCP server over stdio locally or Streamable HTTP remotely — REST is welded to HTTP semantics and gRPC to HTTP/2, while a JSON-RPC envelope with in-message id correlation runs over any byte pipe. Second, action shape: “textDocument/completion” or “tools/call” are commands, not resources — forcing them into REST nouns adds mismatch with zero benefit. Third, near-zero ceremony with bidirectional flexibility: both sides can send requests and notifications over one connection, and implementing a compliant endpoint is an afternoon, with no codegen toolchain as an adoption barrier — critical when you want thousands of third parties to implement servers. The trade-offs accepted: no HTTP caching or status-code observability (the envelope must be parsed for errors), no built-in typing (both specs layer their own schemas on top). I would make the same call for plugin systems, embedded/device control channels, and anything that must run identically over stdio, WebSocket and HTTP; I would not use it for a public resource-centric API (REST) or a typed high-throughput service mesh (gRPC).',
        uk: 'Обом протоколам потрібні ті самі три властивості. Перша — транспортна агностичність: редактор говорить із language-сервером через stdio, AI-агент з MCP-сервером — через stdio локально чи Streamable HTTP віддалено; REST приварений до семантики HTTP, gRPC — до HTTP/2, а конверт JSON-RPC із кореляцією за id у повідомленні їде через будь-який байтовий канал. Друга — форма дій: «textDocument/completion» чи «tools/call» — команди, не ресурси; заганяти їх у REST-іменники — це опір без вигоди. Третя — майже нульова церемонія з двонапрямною гнучкістю: обидві сторони шлють requests і notifications через одне зʼєднання, а сумісний endpoint пишеться за вечір, без codegen-тулчейна як барʼєра — критично, коли хочеш, щоб сервери реалізували тисячі сторонніх розробників. Прийняті trade-off-и: немає HTTP-кешування й observability за статус-кодами (конверт треба парсити на помилки), немає вбудованої типізації (обидві специфікації кладуть власні схеми зверху). Той самий вибір я зроблю для систем плагінів, каналів керування embedded/пристроями і всього, що має однаково їхати через stdio, WebSocket і HTTP; не візьму його для публічного ресурсо-центричного API (REST) чи типізованої високопропускної сервісної мережі (gRPC).',
      },
      level: 'middle',
    },
  ],
  seeAlso: ['m5-rest', 'm10-grpc', 'm7-soap-xml', 'm11-trpc', 'm19-errors-status', 'm12-websockets'],
  sources: [
    { title: 'JSON-RPC 2.0 Specification (jsonrpc.org)', url: 'https://www.jsonrpc.org/specification' },
    { title: 'Model Context Protocol — Specification (JSON-RPC 2.0 base)', url: 'https://modelcontextprotocol.io/specification/2025-11-25' },
    { title: 'Microsoft — Language Server Protocol specification (JSON-RPC framing)', url: 'https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/' },
    { title: 'Ethereum — JSON-RPC API', url: 'https://ethereum.org/en/developers/docs/apis/json-rpc/' },
    { title: 'XML-RPC — the original specification site', url: 'http://xmlrpc.com/' },
    { title: 'WordPress — XML-RPC support (the legacy survivor)', url: 'https://developer.wordpress.org/apis/xml-rpc/' },
  ],
};
