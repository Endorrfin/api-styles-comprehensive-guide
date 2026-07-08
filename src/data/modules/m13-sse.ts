import type { Module } from '../types';

/*
 * m13-sse — server push over plain HTTP (s3, Real-time/push/event-driven). No sim (diagram-first):
 * figure 'sse-stream-anatomy' (the text/event-stream format + the auto-reconnect/Last-Event-ID loop).
 * Five curriculum topics: the text/event-stream format (figure) → auto-reconnect & Last-Event-ID →
 * vs WebSockets → the HTTP/1.1 connection-limit & buffering caveats → when SSE is enough + verdict.
 * Facts web-verified S9: WHATWG HTML §9.2 (EventSource; fields data:/event:/id:/retry:, UTF-8, blank
 * line dispatches; reconnect sends the Last-Event-ID request header); the ~6-connections-per-origin
 * HTTP/1.1 browser limit (lifted by HTTP/2 multiplexing); SSE is the de-facto transport for LLM token
 * streaming (OpenAI & Anthropic APIs stream over text/event-stream).
 */
export const m13: Module = {
  id: 'm13-sse',
  num: 13,
  section: 's3-realtime-events',
  order: 2,
  level: 'middle',
  title: { en: 'Server-Sent Events (SSE)', uk: 'Server-Sent Events (SSE)' },
  tagline: {
    en: 'Server push over plain HTTP — the simple one.',
    uk: 'Server push через звичайний HTTP — простий варіант.',
  },
  readMins: 11,
  mentalModel: {
    en: 'SSE is **one HTTP response that never ends**: the server keeps the connection open and writes text events down it; the browser’s `EventSource` parses them and — the killer feature — **reconnects by itself**, telling the server the last event id it saw so the stream can resume. One direction only (server→client), plain HTTP all the way: no upgrade, no frames, no new protocol.',
    uk: 'SSE — це **одна HTTP-відповідь, що ніколи не закінчується**: сервер тримає зʼєднання відкритим і пише в нього текстові події; браузерний `EventSource` їх парсить і — вбивча фіча — **перепідключається сам**, кажучи серверу останній бачений id події, щоб потік відновився. Лише один напрямок (server→client), звичайний HTTP до кінця: без upgrade, без фреймів, без нового протоколу.',
  },
  topics: [
    // ── T1 · The wire format (figure) ─────────────────────────────────────────
    {
      id: 'text-event-stream',
      title: { en: 'The wire: text/event-stream', uk: 'На дроті: text/event-stream' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'An SSE stream is a normal HTTP response with `Content-Type: text/event-stream` that simply… keeps going. The body is UTF-8 text in line-oriented fields: **`data:`** carries the payload (consecutive `data:` lines concatenate with newlines), **`event:`** names an event type to route listeners, **`id:`** sets the *last event ID* the browser will remember, and **`retry:`** tunes the reconnect delay in milliseconds. A **blank line dispatches the event**. That’s the whole protocol — you can read it with `curl`, debug it in any proxy, and serve it from any HTTP stack without new infrastructure.',
            uk: 'SSE-потік — це звичайна HTTP-відповідь із `Content-Type: text/event-stream`, яка просто… не закінчується. Тіло — UTF-8 текст у рядкових полях: **`data:`** несе payload (послідовні рядки `data:` склеюються переносами), **`event:`** іменує тип події для маршрутизації слухачів, **`id:`** встановлює *last event ID*, який браузер запамʼятає, а **`retry:`** налаштовує затримку reconnect у мілісекундах. **Порожній рядок відправляє подію.** Оце й увесь протокол — його можна читати `curl`-ом, дебажити в будь-якому proxy й віддавати з будь-якого HTTP-стека без нової інфраструктури.',
          },
        },
        {
          kind: 'figure',
          fig: 'sse-stream-anatomy',
          caption: {
            en: 'One long-lived response: retry/id/event/data fields, a blank line dispatching each event — and the loop that makes SSE resilient: drop → wait `retry` ms → re-GET with `Last-Event-ID` → the server resumes.',
            uk: 'Одна довгоживуча відповідь: поля retry/id/event/data, порожній рядок відправляє кожну подію — і цикл, що робить SSE живучим: обрив → чекання `retry` мс → повторний GET із `Last-Event-ID` → сервер відновлює.',
          },
        },
        {
          kind: 'code',
          lang: 'js',
          code: `// Server (Node/Express): an endless response
app.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'X-Accel-Buffering': 'no',            // tell nginx-style proxies: do NOT buffer (T4)
  });
  const send = (id, data) =>
    res.write(\`id: \${id}\\nevent: price\\ndata: \${JSON.stringify(data)}\\n\\n\`);
  const t = setInterval(() => send(nextId(), latestPrice()), 1000);
  req.on('close', () => clearInterval(t)); // client gone — stop writing
});

// Browser: three lines, reconnect included
const es = new EventSource('/stream');
es.addEventListener('price', (e) => render(JSON.parse(e.data)));`,
          note: {
            en: 'No library on either side. The browser handles parsing, listener routing, and reconnection; your only server obligations are flushing each event and cleaning up on close.',
            uk: 'Жодної бібліотеки з обох боків. Браузер бере на себе парсинг, маршрутизацію слухачів і reconnect; твої єдині серверні обовʼязки — flush кожної події та прибирання при close.',
          },
        },
      ],
    },
    // ── T2 · Auto-reconnect & Last-Event-ID ───────────────────────────────────
    {
      id: 'auto-reconnect-last-event-id',
      title: { en: 'Auto-reconnect & Last-Event-ID', uk: 'Авто-reconnect і Last-Event-ID' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'This is SSE’s unfair advantage over raw WebSockets: **resilience is built into the client**. When the connection drops, `EventSource` waits the `retry:` interval and re-issues the GET *on its own* — no reconnect library, no backoff code. And if your events carried `id:` fields, the browser sends the last one it processed in a **`Last-Event-ID`** request header, so the server can **resume the stream from that point** instead of restarting it. The catch senior engineers watch for: the *browser* only remembers the id — **replaying the gap is your server’s job**, which means keeping a short history (a ring buffer, a log offset, a DB cursor) keyed by event id.',
            uk: 'Це нечесна перевага SSE над сирими WebSockets: **живучість вбудована в клієнт**. Коли зʼєднання рветься, `EventSource` чекає інтервал `retry:` і повторює GET *самотужки* — без reconnect-бібліотеки, без коду backoff. А якщо твої події несли поля `id:`, браузер шле останній оброблений у заголовку запиту **`Last-Event-ID`**, тож сервер може **відновити потік із того місця**, а не почати заново. Пастка, яку виглядають senior-и: *браузер* лише памʼятає id — **відтворити пропуск має твій сервер**, а це означає тримати коротку історію (ring buffer, offset лога, курсор БД) за id події.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Design the ids before you need them', uk: 'Проєктуй id до того, як знадобляться' },
          md: {
            en: 'Monotonic, resumable ids (a sequence number, a log offset) turn reconnects from “missed everything in between” into a seamless catch-up. Add them from day one — retrofitting resume onto id-less events means clients silently lost data during every blip.',
            uk: 'Монотонні, відновлювані id (sequence-номер, offset лога) перетворюють reconnect із «пропустив усе між» на безшовний catch-up. Додай їх із першого дня — прикручувати resume до подій без id означає, що клієнти тихо губили дані під час кожного мигу мережі.',
          },
        },
      ],
    },
    // ── T3 · vs WebSockets ────────────────────────────────────────────────────
    {
      id: 'vs-websockets',
      title: { en: 'SSE vs WebSockets', uk: 'SSE проти WebSockets' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The decision is direction. **WebSockets** (m12) buy full-duplex — both sides push — at the cost of a protocol upgrade, custom framing, hand-rolled heartbeats and reconnect, and infrastructure that must understand something that isn’t HTTP. **SSE** pushes one way over plain HTTP, so *everything already works*: load balancers, HTTP/2 multiplexing, auth middleware and cookies, compression, CDN pass-through, `curl`. Client→server communication doesn’t disappear — it goes over ordinary `fetch` POSTs alongside the stream, which is exactly the shape of most “real-time” apps: many updates down, occasional commands up. Two native limits to know: `EventSource` can’t set custom headers (token auth rides cookies, a query param, or a fetch-based SSE reader), and payloads are text (binary needs base64 or a WebSocket).',
            uk: 'Рішення — це напрямок. **WebSockets** (m12) купують full-duplex — пушать обидві сторони — ціною апгрейду протоколу, власного фреймінгу, ручних heartbeat-ів і reconnect-у та інфраструктури, що мусить розуміти щось не-HTTP. **SSE** пушить в один бік через звичайний HTTP, тож *усе вже працює*: балансувальники, мультиплексування HTTP/2, auth-middleware і cookies, стиснення, CDN pass-through, `curl`. Звʼязок клієнт→сервер нікуди не зникає — він іде звичайними `fetch` POST-ами поруч із потоком, і саме така форма в більшості «real-time» застосунків: багато оновлень вниз, зрідка команди вгору. Дві нативні межі, які треба знати: `EventSource` не вміє кастомних заголовків (токен їде в cookie, query-параметрі або через fetch-based SSE-reader), а payload — текст (бінарне — base64 або WebSocket).',
          },
        },
        {
          kind: 'compare',
          a: { en: 'SSE', uk: 'SSE' },
          b: { en: 'WebSockets', uk: 'WebSockets' },
          rows: [
            [
              { en: 'Direction', uk: 'Напрямок' },
              { en: 'Server → client only', uk: 'Лише server → client' },
              { en: 'Full-duplex, both push', uk: 'Full-duplex, пушать обидва' },
            ],
            [
              { en: 'Transport', uk: 'Транспорт' },
              { en: 'Plain HTTP response', uk: 'Звичайна HTTP-відповідь' },
              { en: 'Upgrade → its own framing', uk: 'Upgrade → власний фреймінг' },
            ],
            [
              { en: 'Reconnect & resume', uk: 'Reconnect і resume' },
              { en: 'Built-in (retry + Last-Event-ID)', uk: 'Вбудовані (retry + Last-Event-ID)' },
              { en: 'Yours to build (heartbeat + backoff)', uk: 'Будуєш сам (heartbeat + backoff)' },
            ],
            [
              { en: 'Infra fit', uk: 'Сумісність з інфрою' },
              { en: 'Proxies/LB/auth/CDN just work', uk: 'Proxy/LB/auth/CDN просто працюють' },
              { en: 'Needs WS-aware infra + stickiness', uk: 'Потрібна WS-свідома інфра + stickiness' },
            ],
            [
              { en: 'Payload', uk: 'Payload' },
              { en: 'UTF-8 text events', uk: 'UTF-8 текстові події' },
              { en: 'Text + binary frames', uk: 'Текстові + бінарні фрейми' },
            ],
          ],
        },
      ],
    },
    // ── T4 · The HTTP/1.1 caveat (+ buffering) ────────────────────────────────
    {
      id: 'http2-multiplexing-caveat',
      title: { en: 'The HTTP/1.1 caveat (and buffering proxies)', uk: 'Застереження HTTP/1.1 (і буферизуючі proxy)' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'SSE’s honesty about being “just HTTP” has two operational edges. **Connection limits:** an SSE stream occupies a connection for its lifetime, and browsers cap HTTP/1.1 at **~6 connections per origin** — shared across *all tabs*. A user with your app open in six tabs has zero connections left for anything else; tab seven hangs mysteriously. **HTTP/2 fixes this** by multiplexing every stream over one connection (default ~100 concurrent), which is why SSE in production should ride HTTP/2+ (m3). **Buffering:** every hop — nginx, a gateway, compression middleware — must *flush* events immediately; a proxy that buffers the response turns your real-time stream into a batch job. Disable proxy buffering for the stream route (e.g. the `X-Accel-Buffering: no` header) and flush after each event.',
            uk: 'Чесність SSE щодо «просто HTTP» має два операційні краї. **Ліміти зʼєднань:** SSE-потік займає зʼєднання на весь свій вік, а браузери обмежують HTTP/1.1 **~6 зʼєднаннями на origin** — спільними для *всіх вкладок*. Користувач із твоїм застосунком у шести вкладках не має жодного зʼєднання на решту; сьома вкладка загадково висне. **HTTP/2 це лагодить**, мультиплексуючи всі стріми через одне зʼєднання (типово ~100 паралельних), — тому продакшен-SSE має їхати на HTTP/2+ (m3). **Буферизація:** кожен хоп — nginx, gateway, compression-middleware — мусить *flush-ити* події одразу; proxy, що буферизує відповідь, перетворює твій real-time потік на batch-джобу. Вимкни буферизацію proxy для маршруту потоку (напр., заголовок `X-Accel-Buffering: no`) і flush-и після кожної події.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: '“Works locally, dies behind the proxy”', uk: '«Локально працює, за proxy вмирає»' },
          md: {
            en: 'The classic SSE incident: events stream perfectly in dev, then arrive in 30-second clumps (or never) in production — because a reverse proxy, a gzip layer, or a serverless platform that buffers whole responses sits in the path. Audit every hop for streaming support and flushing; platforms that only return complete responses can’t serve SSE at all.',
            uk: 'Класичний SSE-інцидент: у dev події течуть ідеально, а в проді приходять грудками раз на 30 секунд (або ніколи) — бо на шляху стоїть reverse proxy, шар gzip чи serverless-платформа, що буферизує цілі відповіді. Проаудитуй кожен хоп на підтримку стримінгу та flush; платформи, що вміють лише завершені відповіді, SSE не віддадуть узагалі.',
          },
        },
        // CHANGED (s12a): §D(7) — the module's top security threat, named explicitly.
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'Top threat: the stream outlives its credentials', uk: 'Головна загроза: потік переживає свої credentials' },
          md: {
            en: 'An SSE connection is authenticated **once, at the request** — then lives for minutes or hours while the token that opened it expires, or the user is deactivated, mid-stream. Enforce a **max stream lifetime** and re-authenticate on every reconnect (the auto-reconnect makes this cheap), and push access re-checks into event *generation*, not just the connection. The constraint feeding this: native `EventSource` **cannot set an `Authorization` header**, so tokens land in **cookies** (now the endpoint needs CSRF/`SameSite` discipline and a strict CORS allowlist — never `*` with credentials) or **query strings** (they leak into proxy and access logs — prefer short-lived, single-use stream tickets). And because each stream pins server resources for its lifetime, **cap concurrent streams per user/token** — connection exhaustion is this style’s cheapest DoS (m17 · m20 · m22).',
            uk: 'SSE-зʼєднання автентифікується **раз, на запиті** — а живе хвилини чи години, поки токен, що його відкрив, спливає, або користувача деактивовано, посеред потоку. Введи **максимальний вік потоку** і ре-автентифікуй на кожному reconnect (авто-reconnect робить це дешевим), а перевірки доступу перенеси в *генерацію* подій, не лише на зʼєднання. Обмеження, що це живить: нативний `EventSource` **не вміє ставити заголовок `Authorization`**, тож токени осідають у **cookies** (тепер endpoint-у потрібна дисципліна CSRF/`SameSite` і суворий CORS-allowlist — ніколи `*` з credentials) або в **query string** (вони течуть у логи proxy й access-логи — кращими є короткоживучі одноразові stream-квитки). А оскільки кожен потік утримує ресурси сервера на весь свій вік, **обмежуй паралельні потоки на user/token**: вичерпання зʼєднань — найдешевший DoS цього стилю (m17 · m20 · m22).',
          },
        },
      ],
    },
    // ── T5 · When SSE is enough + the verdict ─────────────────────────────────
    {
      id: 'when-sse-is-enough',
      title: { en: 'When SSE is enough', uk: 'Коли SSE достатньо' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Most “we need real-time” requirements are one-directional: notifications, live dashboards, feeds, progress bars, job status. For all of those, SSE delivers push with a fraction of WebSockets’ machinery — and it’s having a renaissance as the transport behind the decade’s defining UX: **LLM token streaming**. When ChatGPT or Claude “types”, that’s an SSE-style `text/event-stream` response from the OpenAI and Anthropic APIs, one `data:` chunk per token batch — request/response for the prompt, a one-way stream for the answer, nothing bidirectional needed. If the fanciest real-time product of the 2020s runs on SSE, your notification feed probably can too.',
            uk: 'Більшість вимог «нам треба real-time» однонапрямні: нотифікації, живі дашборди, стрічки, progress bar-и, статуси задач. Для всього цього SSE дає push із часткою машинерії WebSockets — і переживає ренесанс як транспорт визначального UX десятиліття: **стримінгу LLM-токенів**. Коли ChatGPT чи Claude «друкує», це SSE-подібна відповідь `text/event-stream` від API OpenAI та Anthropic, один чанк `data:` на пакет токенів — request/response для промпта, односторонній потік для відповіді, нічого двонапрямного не треба. Якщо найефектніший real-time продукт 2020-х їде на SSE, твоя стрічка нотифікацій, мабуть, теж зможе.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'The verdict', uk: 'Вердикт' },
          md: {
            en: 'Reach for SSE when only the server talks: notifications, dashboards, feeds, progress, token streams. Its superpowers are plain HTTP (infrastructure just works) and built-in reconnect-with-resume. Move up to WebSockets (m12) only when the *client* must also push continuously — chat typing, games, collaborative editing — and to WebRTC (m14) for peer-to-peer media. The order of consideration for real-time on the web: **SSE first, WebSockets when bidirectional, WebRTC when peer-to-peer.**',
            uk: 'Бери SSE, коли говорить лише сервер: нотифікації, дашборди, стрічки, прогрес, потоки токенів. Його суперсили — звичайний HTTP (інфраструктура просто працює) і вбудований reconnect із resume. Піднімайся до WebSockets (m12) лише коли *клієнт* теж мусить постійно пушити — набір у чаті, ігри, спільне редагування, — і до WebRTC (m14) для peer-to-peer медіа. Порядок розгляду real-time у вебі: **спершу SSE, WebSockets коли двонапрямно, WebRTC коли peer-to-peer.**',
          },
        },
      ],
    },
  ],
  keyPoints: [
    { en: 'SSE is one never-ending HTTP response (text/event-stream): data/event/id/retry lines, a blank line dispatches — readable with curl, served from any HTTP stack.', uk: 'SSE — одна нескінченна HTTP-відповідь (text/event-stream): рядки data/event/id/retry, порожній рядок відправляє — читається curl-ом, віддається з будь-якого HTTP-стека.' },
    { en: 'Resilience is built in: EventSource auto-reconnects after `retry:` ms and sends Last-Event-ID — but replaying the gap from that id is your server’s job.', uk: 'Живучість вбудована: EventSource сам перепідключається за `retry:` мс і шле Last-Event-ID — але відтворити пропуск від того id має твій сервер.' },
    { en: 'It’s one-directional by design: server→client push, with client→server going over normal fetch/POST — which matches most “real-time” products.', uk: 'Він однонапрямний за дизайном: server→client push, а клієнт→сервер іде звичайним fetch/POST — що збігається з більшістю «real-time» продуктів.' },
    { en: 'Over HTTP/1.1 the ~6-connections-per-origin browser cap (shared across tabs) strangles SSE — run it over HTTP/2+, and make every proxy hop flush instead of buffer.', uk: 'Над HTTP/1.1 браузерний ліміт ~6 зʼєднань на origin (спільний для вкладок) душить SSE — жени його через HTTP/2+ і змусь кожен proxy-хоп flush-ити, а не буферизувати.' },
    { en: 'Native limits: EventSource sets no custom headers (auth via cookies/query/fetch-readers) and carries text only — binary means base64 or WebSockets.', uk: 'Нативні межі: EventSource не ставить кастомних заголовків (auth через cookies/query/fetch-readers) і несе лише текст — бінарне означає base64 або WebSockets.' },
    { en: 'SSE is the transport behind LLM token streaming (OpenAI, Anthropic) — the modern default for one-way real-time; escalate to WS only for true bidirectionality.', uk: 'SSE — транспорт стримінгу LLM-токенів (OpenAI, Anthropic) — сучасний дефолт для одностороннього real-time; ескалюй до WS лише заради справжньої двонапрямності.' },
  ],
  pitfalls: [
    {
      title: { en: 'A buffering hop turns the stream into a batch job', uk: 'Буферизуючий хоп перетворює потік на batch-джобу' },
      body: {
        en: 'Any proxy, gzip layer, or serverless platform that buffers responses delays events by seconds or swallows them entirely — the classic “works in dev” incident. Disable buffering on the stream route (X-Accel-Buffering: no), flush after every event, and verify streaming end-to-end through production infrastructure.',
        uk: 'Будь-який proxy, шар gzip чи serverless-платформа, що буферизує відповіді, затримує події на секунди або ковтає їх повністю — класичний інцидент «у dev працює». Вимкни буферизацію на маршруті потоку (X-Accel-Buffering: no), flush-и після кожної події й перевір стримінг end-to-end крізь продакшен-інфраструктуру.',
      },
    },
    {
      title: { en: 'Serving SSE over HTTP/1.1 in production', uk: 'Віддавати SSE через HTTP/1.1 у проді' },
      body: {
        en: 'Each stream pins one of ~6 per-origin HTTP/1.1 connections shared across all tabs, so multi-tab users starve every other request to your domain and hit mysterious hangs. Serve SSE over HTTP/2+, where streams multiplex over a single connection.',
        uk: 'Кожен потік займає одне з ~6 HTTP/1.1-зʼєднань на origin, спільних для всіх вкладок, — тож користувачі з кількома вкладками виморюють решту запитів до твого домену й ловлять загадкові зависання. Віддавай SSE через HTTP/2+, де стріми мультиплексуються в одному зʼєднанні.',
      },
    },
    {
      title: { en: 'Id-less events: reconnects silently lose data', uk: 'Події без id: reconnect-и тихо гублять дані' },
      body: {
        en: 'Auto-reconnect without id:/Last-Event-ID resume means every network blip drops whatever was sent in between — invisibly. Emit monotonic ids from day one and keep enough history server-side to replay the gap on resume.',
        uk: 'Авто-reconnect без resume через id:/Last-Event-ID означає, що кожен миг мережі губить надіслане в проміжку — непомітно. Видавай монотонні id з першого дня і тримай на сервері досить історії, щоб відтворити пропуск при resume.',
      },
    },
  ],
  interview: [
    {
      q: { en: 'When would you choose SSE over WebSockets, and what breaks when you deploy SSE to production?', uk: 'Коли обереш SSE замість WebSockets і що ламається при деплої SSE в прод?' },
      a: {
        en: 'Choose SSE when the flow is server→client: notifications, dashboards, feeds, progress, LLM token streams — the OpenAI and Anthropic APIs stream over text/event-stream precisely because a prompt/response pair needs no bidirectional channel. SSE wins on operations: it’s a plain HTTP response, so LBs, auth, cookies, compression and CDNs just work, and EventSource gives reconnect-with-resume (retry: + Last-Event-ID) for free — with WebSockets you build heartbeats and reconnect yourself and need WS-aware infra with sticky routing. Take WebSockets only when the client genuinely pushes continuously (chat, games, collaboration). Production gotchas: over HTTP/1.1 the ~6-connection-per-origin browser cap shared across tabs strangles multi-tab users — serve over HTTP/2+; any buffering hop (nginx defaults, gzip middleware, response-buffering serverless platforms) batches or swallows events — disable buffering and flush per event; EventSource can’t set an Authorization header, so auth rides cookies, a query param, or a fetch-based reader; and resume only works if I emit monotonic ids and keep server-side history to replay the gap.',
        uk: 'Обирай SSE, коли потік server→client: нотифікації, дашборди, стрічки, прогрес, потоки LLM-токенів — API OpenAI та Anthropic стрімлять через text/event-stream саме тому, що парі промпт/відповідь не потрібен двонапрямний канал. SSE виграє операційно: це звичайна HTTP-відповідь, тож LB, auth, cookies, стиснення й CDN просто працюють, а EventSource дає reconnect із resume (retry: + Last-Event-ID) безплатно — з WebSockets ти сам будуєш heartbeat-и й reconnect і потребуєш WS-свідомої інфри зі sticky routing. Бери WebSockets лише коли клієнт справді постійно пушить (чат, ігри, колаборація). Продакшен-пастки: над HTTP/1.1 браузерний ліміт ~6 зʼєднань на origin, спільний для вкладок, душить багатовкладкових користувачів — віддавай через HTTP/2+; будь-який буферизуючий хоп (дефолти nginx, gzip-middleware, serverless-платформи з буферизацією відповідей) збиває події в пачки чи ковтає — вимикай буферизацію і flush-и на кожну подію; EventSource не ставить заголовок Authorization, тож auth їде в cookies, query-параметрі чи fetch-based reader-і; а resume працює лише якщо я видаю монотонні id і тримаю історію на сервері, щоб відтворити пропуск.',
      },
      level: 'senior',
    },
  ],
  seeAlso: ['m12-websockets', 'm14-webrtc', 'm15-webhooks', 'm3-http-transport', 'm5-rest'],
  sources: [
    { title: 'WHATWG HTML — §9.2 Server-sent events (the spec)', url: 'https://html.spec.whatwg.org/multipage/server-sent-events.html' },
    { title: 'MDN — Using server-sent events', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events' },
    { title: 'MDN — EventSource', url: 'https://developer.mozilla.org/en-US/docs/Web/API/EventSource' },
    { title: 'MDN — Last-Event-ID request header', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Last-Event-ID' },
    { title: 'Ably — Server-Sent Events: a WebSockets alternative', url: 'https://ably.com/topic/server-sent-events' },
    { title: 'OpenAI — Streaming API responses (SSE)', url: 'https://developers.openai.com/api/docs/guides/streaming-responses' },
  ],
};
