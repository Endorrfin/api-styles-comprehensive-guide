import type { Module } from '../types';

/*
 * m2-decision-axes — the coordinate system (s3). SIGNATURE: sim 'style-compass' (also the landing hero).
 * Figures: 'decision-axes' (overview), 'coupling-spectrum'. Seven topics = the seven axes, each a
 * deep-link. Facts leaned on here are structural (HTTP is client-pull; gRPC has four call types; SSE/WS
 * add push; brokers decouple in time) and cited below; the axis synthesis is the guide's own framing.
 */
export const m2: Module = {
  id: 'm2-decision-axes',
  num: 2,
  section: 's0-foundations',
  order: 2,
  level: 'middle',
  signature: true,
  title: { en: 'The decision axes', uk: 'Осі рішення' },
  tagline: {
    en: 'The coordinate system that separates every style — set the axes, watch the styles sort themselves.',
    uk: 'Система координат, що розрізняє кожен стиль — задай осі й дивись, як стилі сортуються самі.',
  },
  readMins: 16,
  mentalModel: {
    en: 'No style is “best”. Each is a point on a few axes — sync/async, request/stream/push, unary/bidi, client/server-driven, text/binary, point-to-point/broker, loose/tight. Pick your point on each axis and the right style falls out.',
    uk: 'Немає «найкращого» стилю. Кожен — точка на кількох осях: sync/async, request/stream/push, unary/bidi, client/server-driven, text/binary, point-to-point/broker, loose/tight. Обери свою точку на кожній осі — і потрібний стиль випливе сам.',
  },
  topics: [
    // ── T1 · Sync vs async (+ the compass + the overview figure) ─────────────
    {
      id: 'sync-vs-async',
      title: { en: 'Sync vs async', uk: 'Sync проти async' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Every API style is a **point in a coordinate system**. Instead of memorizing twelve styles, learn the handful of **axes** that separate them — then any style is just its position on those axes, and choosing one becomes choosing coordinates. This module walks all seven axes. The **Style Compass** below plots every style on them at once: set any axis and watch the styles re-rank by fit; open a style to read its module.',
            uk: 'Кожен стиль API — це **точка в системі координат**. Замість зубрити дванадцять стилів, вивчи кілька **осей**, що їх розрізняють — і тоді будь-який стиль це просто його позиція на цих осях, а вибір стає вибором координат. Цей модуль проходить усі сім осей. **Style Compass** нижче наносить кожен стиль на них одразу: задай будь-яку вісь і дивись, як стилі пересортовуються за придатністю; відкрий стиль, щоб прочитати його модуль.',
          },
        },
        {
          kind: 'figure',
          fig: 'decision-axes',
          caption: {
            en: 'The seven axes. A style is a point on each; “choosing a style” is choosing where you sit.',
            uk: 'Сім осей. Стиль — це точка на кожній; «обрати стиль» — це обрати, де ти сидиш.',
          },
        },
        {
          kind: 'sim',
          sim: 'style-compass',
          caption: {
            en: 'The Style Compass: constrain the axes to your boundary and the best-fit styles rise to the top. Each card links to its module.',
            uk: 'Style Compass: обмеж осі під свій boundary — і найкращі стилі піднімуться вгору. Кожна картка веде до свого модуля.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: 'Start with the most fundamental axis: **does the caller wait?** In a **synchronous** interaction the client sends a request and blocks on the answer — REST, GraphQL, a unary gRPC call. In an **asynchronous** interaction the client hands off work and moves on; the result arrives later — or never directly at all. Async needs somewhere to put that result: a callback URL (webhooks), a stream the client reads later, or a broker that holds the message until a consumer is ready.',
            uk: 'Почни з найфундаментальнішої осі: **чи чекає викликач?** У **синхронній** взаємодії клієнт надсилає запит і блокується на відповіді — REST, GraphQL, unary gRPC-виклик. В **асинхронній** клієнт передає роботу й іде далі; результат приходить пізніше — або взагалі не напряму. Async потребує, куди покласти той результат: callback-URL (webhooks), потік, який клієнт читає пізніше, або broker, що тримає повідомлення, доки consumer не готовий.',
          },
        },
        {
          kind: 'compare',
          a: { en: 'Synchronous', uk: 'Synchronous' },
          b: { en: 'Asynchronous', uk: 'Asynchronous' },
          rows: [
            [
              { en: 'Result', uk: 'Результат' },
              { en: 'Returned in the same call', uk: 'Повертається в тому ж виклику' },
              { en: 'Arrives later, elsewhere', uk: 'Приходить пізніше, деінде' },
            ],
            [
              { en: 'Failure is…', uk: 'Відмова це…' },
              { en: 'Visible immediately to the caller', uk: 'Одразу видима викликачу' },
              { en: 'Deferred — needs retries/timeouts/DLQ', uk: 'Відкладена — треба retries/timeouts/DLQ' },
            ],
            [
              { en: 'Coupling in time', uk: 'Звʼязність у часі' },
              { en: 'Both sides up at once', uk: 'Обидві сторони онлайн водночас' },
              { en: 'Sender & receiver decoupled', uk: 'Sender і receiver розчеплені' },
            ],
            [
              { en: 'Fits', uk: 'Пасує' },
              { en: 'Reads, queries, “give me an answer now”', uk: 'Читання, запити, «дай відповідь зараз»' },
              { en: 'Jobs, events, spikes, slow work', uk: 'Задачі, події, сплески, повільна робота' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'This axis is about the interaction, not your `await`', uk: 'Ця вісь про взаємодію, а не про твій `await`' },
          md: {
            en: 'Non-blocking I/O (`async/await`, an event loop) is a *local* implementation detail — your thread is free while a **synchronous** request is in flight. The axis here is about the **contract**: does the caller get its answer in the same exchange, or is the result decoupled in time? A Node service can serve a fully synchronous REST API using entirely non-blocking I/O. Don’t conflate the two.',
            uk: 'Non-blocking I/O (`async/await`, event loop) — це *локальна* деталь реалізації: твій потік вільний, поки летить **синхронний** запит. Вісь тут про **контракт**: чи отримує викликач відповідь у тому ж обміні, чи результат розчеплено в часі? Node-сервіс може віддавати повністю синхронний REST API на цілком non-blocking I/O. Не плутай ці дві речі.',
          },
        },
      ],
    },
    // ── T2 · Request/response, streaming, push ───────────────────────────────
    {
      id: 'reqresp-streaming-push',
      title: { en: 'Request/response, streaming, push', uk: 'Request/response, streaming, push' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The **flow** axis asks how data moves over time. **Request/response** is one question, one answer — the web’s default (REST, GraphQL, RPC). **Streaming** keeps the channel open for many messages: a server stream (SSE, a gRPC server stream) drips results as they’re ready; a bidirectional stream (WebSockets, gRPC bidi) lets both sides send continuously. **Push** flips initiative entirely: the server sends you something you never requested in this exchange — a webhook firing on an event, a message landing from a broker.',
            uk: 'Вісь **flow** питає, як дані рухаються в часі. **Request/response** — одне питання, одна відповідь — дефолт вебу (REST, GraphQL, RPC). **Streaming** тримає канал відкритим для багатьох повідомлень: серверний стрім (SSE, серверний стрім gRPC) капає результати, щойно готові; двонапрямлений стрім (WebSockets, gRPC bidi) дозволяє обом сторонам слати безперервно. **Push** повністю перевертає ініціативу: сервер шле тобі те, чого ти не просив у цьому обміні — webhook на подію, повідомлення з broker-а.',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Flow', uk: 'Flow' },
            { en: 'Shape', uk: 'Форма' },
            { en: 'Typical styles', uk: 'Типові стилі' },
          ],
          rows: [
            [
              { en: 'Request/response', uk: 'Request/response' },
              { en: '1 ask → 1 answer', uk: '1 питання → 1 відповідь' },
              { en: 'REST, GraphQL, gRPC-unary, JSON-RPC', uk: 'REST, GraphQL, gRPC-unary, JSON-RPC' },
            ],
            [
              { en: 'Streaming', uk: 'Streaming' },
              { en: '1 ask → many, over time', uk: '1 питання → багато, у часі' },
              { en: 'SSE, gRPC streams, WebSockets', uk: 'SSE, gRPC-стріми, WebSockets' },
            ],
            [
              { en: 'Push / event', uk: 'Push / event' },
              { en: '0 asks → server sends', uk: '0 питань → сервер шле' },
              { en: 'Webhooks, async messaging', uk: 'Webhooks, async messaging' },
            ],
          ],
          caption: {
            en: 'Pick by who has the data and when: if only the server knows when something happens, request/response makes the client poll.',
            uk: 'Обирай за тим, хто має дані й коли: якщо лише сервер знає, коли щось стається, request/response змушує клієнта поллити.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Polling is the smell that you need streaming or push', uk: 'Polling — це запах, що тобі потрібен streaming чи push' },
          md: {
            en: 'When a client loops “anything new yet?” every few seconds, request/response is being stretched past its shape. That’s the signal to move right on this axis — SSE for one-way updates, WebSockets for two-way, webhooks for server-to-server events — and stop paying for empty round-trips.',
            uk: 'Коли клієнт крутить «є щось нове?» кожні кілька секунд, request/response розтягують за межі його форми. Це сигнал зсунутись праворуч по осі — SSE для односторонніх апдейтів, WebSockets для двосторонніх, webhooks для server-to-server подій — і перестати платити за порожні round-trip-и.',
          },
        },
      ],
    },
    // ── T3 · Unary vs bidirectional ──────────────────────────────────────────
    {
      id: 'unary-vs-bidirectional',
      title: { en: 'Unary vs bidirectional', uk: 'Unary проти bidirectional' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The **direction** axis is about who can speak, and when. A **unary / one-way** exchange has a clear sender and receiver: the client talks, the server answers (REST, unary gRPC), or the server talks and the client only listens (SSE). A **bidirectional** channel is full-duplex — both sides send whenever they like, without taking turns (WebSockets, WebRTC data channels, gRPC bidi streams). Full-duplex unlocks chat, presence, collaborative editing, and games; it also costs you a persistent connection and the state that comes with it.',
            uk: 'Вісь **direction** про те, хто може говорити й коли. **Unary / one-way** обмін має чіткого відправника й отримувача: клієнт говорить, сервер відповідає (REST, unary gRPC), або сервер говорить, а клієнт лише слухає (SSE). **Bidirectional** канал — full-duplex: обидві сторони шлють, коли захочуть, без черги (WebSockets, WebRTC data channels, gRPC bidi-стріми). Full-duplex відмикає чат, presence, спільне редагування та ігри; він також коштує тобі постійного зʼєднання і стану, що з ним іде.',
          },
        },
        {
          kind: 'compare',
          a: { en: 'Unary / one-way', uk: 'Unary / one-way' },
          b: { en: 'Bidirectional', uk: 'Bidirectional' },
          rows: [
            [
              { en: 'Who sends', uk: 'Хто шле' },
              { en: 'One side at a time', uk: 'Одна сторона за раз' },
              { en: 'Both, at once', uk: 'Обидві, водночас' },
            ],
            [
              { en: 'Connection', uk: 'Зʼєднання' },
              { en: 'Short-lived, stateless-friendly', uk: 'Короткоживуче, дружнє до stateless' },
              { en: 'Persistent, stateful', uk: 'Постійне, stateful' },
            ],
            [
              { en: 'Scales by', uk: 'Масштабується' },
              { en: 'Adding interchangeable nodes', uk: 'Додаванням взаємозамінних вузлів' },
              { en: 'Sticky sessions + fan-out', uk: 'Sticky-сесії + fan-out' },
            ],
            [
              { en: 'Examples', uk: 'Приклади' },
              { en: 'REST, SSE, unary gRPC', uk: 'REST, SSE, unary gRPC' },
              { en: 'WebSockets, WebRTC, gRPC bidi', uk: 'WebSockets, WebRTC, gRPC bidi' },
            ],
          ],
        },
      ],
    },
    // ── T4 · Client-driven vs server-driven ──────────────────────────────────
    {
      id: 'client-vs-server-driven',
      title: { en: 'Client-driven vs server-driven', uk: 'Client-driven проти server-driven' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The **initiative** axis asks: who starts the conversation? HTTP — the substrate almost everything rides on — is **client-pull by design**: nothing reaches the client until the client asks. That single fact shaped a generation of APIs, and every **server-driven** style is a way around it. Long-polling fakes push by holding a request open. **SSE** keeps one response streaming. **WebSockets** upgrade to a two-way pipe. **Webhooks** invert the roles entirely — the server becomes a client of *your* endpoint. **Brokers** let a producer publish with no client in sight at all.',
            uk: 'Вісь **initiative** питає: хто починає розмову? HTTP — субстрат, на якому їде майже все — **client-pull за задумом**: до клієнта нічого не дійде, доки клієнт не попросить. Цей єдиний факт сформував ціле покоління API, і кожен **server-driven** стиль — це спосіб його обійти. Long-polling імітує push, тримаючи запит відкритим. **SSE** тримає одну відповідь у стрімі. **WebSockets** апгрейдять до двосторонньої труби. **Webhooks** повністю інвертують ролі — сервер стає клієнтом *твого* endpoint-а. **Broker-и** дають producer-у публікувати взагалі без клієнта в полі зору.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'The web is client-initiated; every push style is a workaround', uk: 'Веб — client-initiated; кожен push-стиль це обхід' },
          md: {
            en: 'Knowing that HTTP is pull-only explains the entire real-time landscape at a glance: SSE, WebSockets, long-poll and webhooks all exist to give the *server* a way to speak first. When you evaluate a “real-time” requirement, the first question isn’t “which library?” — it’s “which direction does initiative actually need to flow, and how often?”',
            uk: 'Розуміння, що HTTP — лише pull, пояснює весь real-time ландшафт з одного погляду: SSE, WebSockets, long-poll і webhooks існують, щоб дати *серверу* спосіб заговорити першим. Коли оцінюєш «real-time» вимогу, перше питання не «яка бібліотека?», а «у який бік насправді має текти ініціатива й наскільки часто?»',
          },
        },
      ],
    },
    // ── T5 · Text vs binary ──────────────────────────────────────────────────
    {
      id: 'text-vs-binary',
      title: { en: 'Text vs binary', uk: 'Text проти binary' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The **encoding** axis is a trade between human eyes and machine efficiency. **Text** formats — JSON, XML — are readable in a terminal, debuggable with `curl`, and universally supported; you pay in bytes and parse time. **Binary** formats — Protobuf, MessagePack, CBOR, Avro — are smaller and faster to (de)serialize and usually come with a schema, but you can’t eyeball them and you need the schema or tooling to read them at all. The heavier the traffic and the tighter the latency budget, the more the axis tilts toward binary.',
            uk: 'Вісь **encoding** — це обмін між людськими очима й машинною ефективністю. **Text**-формати — JSON, XML — читаються в терміналі, дебажаться через `curl` і всюди підтримуються; ти платиш байтами й часом парсингу. **Binary**-формати — Protobuf, MessagePack, CBOR, Avro — менші й швидші на (де)серіалізації і зазвичай ідуть зі schema, але їх не роздивишся оком, і без schema чи tooling їх узагалі не прочитати. Що важчий трафік і тісніший бюджет latency, то більше вісь хилиться до binary.',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Dimension', uk: 'Вимір' },
            { en: 'Text (JSON/XML)', uk: 'Text (JSON/XML)' },
            { en: 'Binary (Protobuf…)', uk: 'Binary (Protobuf…)' },
          ],
          rows: [
            [
              { en: 'Human-readable', uk: 'Читабельність людиною' },
              { en: 'Yes — debug with curl', uk: 'Так — дебаг через curl' },
              { en: 'No — needs the schema/tooling', uk: 'Ні — потрібна schema/tooling' },
            ],
            [
              { en: 'Size & speed', uk: 'Розмір і швидкість' },
              { en: 'Larger, slower to parse', uk: 'Більший, повільніший парсинг' },
              { en: 'Compact, fast (de)serialize', uk: 'Компактний, швидка (де)серіалізація' },
            ],
            [
              { en: 'Schema', uk: 'Schema' },
              { en: 'Optional (schemaless by default)', uk: 'Опційна (schemaless за замовч.)' },
              { en: 'Usually required', uk: 'Зазвичай обовʼязкова' },
            ],
            [
              { en: 'Reach', uk: 'Доступність' },
              { en: 'Runs anywhere, any client', uk: 'Працює будь-де, будь-який клієнт' },
              { en: 'Best with generated clients', uk: 'Найкраще з generated-клієнтами' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'Binary is not encryption; text is not insecure', uk: 'Binary — не шифрування; text — не небезпека' },
          md: {
            en: 'This axis is orthogonal to security. Protobuf on the wire is just as readable to an attacker with the schema as JSON is — encoding hides nothing. Confidentiality comes from **TLS**, not from the payload being binary. Choose text vs binary for size, speed, and tooling; encrypt everything either way.',
            uk: 'Ця вісь ортогональна до безпеки. Protobuf на дроті так само читабельний для атакувальника зі schema, як і JSON — encoding нічого не ховає. Конфіденційність дає **TLS**, а не «бінарність» payload-а. Обирай text чи binary за розміром, швидкістю й tooling; шифруй усе в будь-якому разі.',
          },
        },
      ],
    },
    // ── T6 · Point-to-point vs broker ────────────────────────────────────────
    {
      id: 'p2p-vs-broker',
      title: { en: 'Point-to-point vs broker', uk: 'Point-to-point проти broker' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The **topology** axis asks what sits between the two sides. In **point-to-point** the caller talks directly to the callee — REST, gRPC, a WebSocket, even a WebRTC peer connection. Simple, low-latency, and easy to reason about, but both sides must be up at the same time and the sender must know the receiver. A **broker** — a message queue or log like RabbitMQ, Kafka, or an MQTT broker — sits in the middle and **decouples them in time**: the producer publishes and leaves; consumers read at their own pace, later, in parallel, or after a crash. You trade a network hop and an operational component for durability, buffering, and fan-out.',
            uk: 'Вісь **topology** питає, що стоїть між двома сторонами. У **point-to-point** викликач говорить напряму з викликаним — REST, gRPC, WebSocket, навіть WebRTC peer-connection. Просто, low-latency і легко міркувати, але обидві сторони мають бути онлайн водночас, і відправник має знати отримувача. **Broker** — черга чи лог на кшталт RabbitMQ, Kafka чи MQTT-broker — стоїть посередині й **розчіплює їх у часі**: producer публікує й іде; consumers читають у своєму темпі, пізніше, паралельно чи після краху. Ти міняєш мережевий стрибок і операційний компонент на durability, буферизацію та fan-out.',
          },
        },
        {
          kind: 'compare',
          a: { en: 'Point-to-point', uk: 'Point-to-point' },
          b: { en: 'Broker-mediated', uk: 'Broker-mediated' },
          rows: [
            [
              { en: 'Both sides up at once?', uk: 'Обидві сторони онлайн?' },
              { en: 'Required', uk: 'Обовʼязково' },
              { en: 'No — decoupled in time', uk: 'Ні — розчеплено в часі' },
            ],
            [
              { en: 'Sender knows receiver?', uk: 'Sender знає receiver?' },
              { en: 'Yes — direct address', uk: 'Так — пряма адреса' },
              { en: 'No — publishes to a topic', uk: 'Ні — публікує в topic' },
            ],
            [
              { en: 'Buffering & retries', uk: 'Буферизація й retries' },
              { en: 'Caller’s problem', uk: 'Проблема викликача' },
              { en: 'The broker holds & redelivers', uk: 'Broker тримає й передоставляє' },
            ],
            [
              { en: 'Cost', uk: 'Ціна' },
              { en: 'Lowest latency, tight coupling', uk: 'Найнижча latency, тісний звʼязок' },
              { en: 'Extra hop + infra to run', uk: 'Зайвий стрибок + інфра' },
            ],
          ],
        },
      ],
    },
    // ── T7 · The coupling spectrum ───────────────────────────────────────────
    {
      id: 'coupling-spectrum',
      title: { en: 'The coupling spectrum', uk: 'Спектр звʼязності' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The last axis is the meta-axis the others feed into: **how tightly must the two sides share a contract?** At the **loose** end, a response is **self-describing** and the client is forgiving — classic REST/JSON, where adding a field breaks no one and any HTTP client can call in. At the **tight** end, both sides compile against a shared **schema or IDL** — gRPC’s `.proto`, SOAP’s WSDL, tRPC’s TypeScript types — so a mismatch is caught at build time and calls are precise and fast, but every consumer needs the schema and moves closer to lockstep releases.',
            uk: 'Остання вісь — мета-вісь, у яку впадають інші: **наскільки тісно дві сторони мають ділити контракт?** На **loose** кінці відповідь **self-describing**, а клієнт поблажливий — класичний REST/JSON, де додавання поля нікого не ламає, і будь-який HTTP-клієнт може викликати. На **tight** кінці обидві сторони компілюються під спільну **schema чи IDL** — `.proto` gRPC, WSDL SOAP, TypeScript-типи tRPC — тож розбіжність ловиться на build-time, а виклики точні й швидкі, але кожен consumer потребує schema й наближається до релізів у lockstep.',
          },
        },
        {
          kind: 'figure',
          fig: 'coupling-spectrum',
          caption: {
            en: 'Styles along the loose→tight coupling axis. Left buys independent evolution and reach; right buys precision, speed, and tooling.',
            uk: 'Стилі вздовж осі loose→tight. Ліворуч купує незалежну еволюцію й доступність; праворуч — точність, швидкість і tooling.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: 'This is the trade the whole guide keeps circling back to. Tighter coupling gives you compile-time safety, smaller payloads, and generated clients — worth a lot **inside** one system or between teams that release together. Looser coupling gives you independent evolution, universal reach, and no shared build — worth more at the **edges**, where you can’t make thousands of unknown clients upgrade in step. Most real platforms are **polyglot**: tight gRPC between internal services, loose REST at the public boundary.',
            uk: 'Це той обмін, до якого посібник постійно вертається. Тісніша звʼязність дає compile-time безпеку, менші payload-и й generated-клієнтів — вартує багато **всередині** однієї системи чи між командами, що релізять разом. Слабша звʼязність дає незалежну еволюцію, універсальну доступність і жодного спільного build-у — вартує більше на **краях**, де не змусиш тисячі невідомих клієнтів оновитись синхронно. Більшість реальних платформ **polyglot**: тісний gRPC між внутрішніми сервісами, слабкий REST на публічній межі.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Coupling is organizational, not just technical', uk: 'Звʼязність — організаційна, не лише технічна' },
          md: {
            en: 'A contract boundary is also a team boundary (Conway’s law). Tight coupling *within* a team that ships together is cheap and worth it; tight coupling *across* orgs that release on different schedules is where integration pain concentrates. When you place a style on this axis, ask who owns each side and how independently they must ship — the answer often decides the axis before the technology does.',
            uk: 'Межа контракту — це й межа команди (закон Conway). Тісна звʼязність *усередині* команди, що релізить разом, дешева й виправдана; тісна звʼязність *між* організаціями з різними графіками релізів — там концентрується біль інтеграції. Розміщуючи стиль на цій осі, спитай, хто володіє кожною стороною і наскільки незалежно вони мусять релізити — відповідь часто вирішує вісь раніше за технологію.',
          },
        },
      ],
    },
  ],
  keyPoints: [
    { en: 'A style is a point on a few axes; choosing a style is choosing coordinates, not memorizing twelve options.', uk: 'Стиль — точка на кількох осях; вибір стилю — це вибір координат, а не зубріння дванадцяти варіантів.' },
    { en: 'Sync/async is about the contract (when the result arrives), not your language’s non-blocking I/O.', uk: 'Sync/async — про контракт (коли приходить результат), а не про non-blocking I/O твоєї мови.' },
    { en: 'HTTP is client-pull by design — SSE, WebSockets, webhooks and brokers all exist to give the server initiative.', uk: 'HTTP — client-pull за задумом; SSE, WebSockets, webhooks і broker-и існують, щоб дати серверу ініціативу.' },
    { en: 'Text vs binary trades debuggability/reach for size/speed/schema — and is orthogonal to security (use TLS).', uk: 'Text проти binary міняє дебажність/доступність на розмір/швидкість/schema — і ортогональне до безпеки (TLS).' },
    { en: 'A broker decouples producer and consumer in time, buying durability and fan-out for an extra hop + infra.', uk: 'Broker розчіплює producer і consumer у часі, купуючи durability й fan-out за зайвий стрибок + інфру.' },
    { en: 'Coupling is the meta-axis: tight buys precision inside a system; loose buys independent evolution at the edges.', uk: 'Звʼязність — мета-вісь: tight купує точність усередині системи; loose — незалежну еволюцію на краях.' },
  ],
  pitfalls: [
    {
      title: { en: 'Treating the axes as one dial', uk: 'Сприймати осі як один регулятор' },
      body: {
        en: 'Styles don’t line up on a single “simple → advanced” scale. WebSockets are bidirectional but loosely coupled; gRPC is tightly coupled but not real-time-push. Score each axis independently or you’ll pick by vibe.',
        uk: 'Стилі не шикуються на єдиній шкалі «просто → складно». WebSockets двонапрямлені, але слабко звʼязані; gRPC тісно звʼязаний, але не real-time-push. Оцінюй кожну вісь окремо, інакше обиратимеш «на відчуття».',
      },
    },
    {
      title: { en: 'Reaching for real-time when you mean “fresh enough”', uk: 'Хапати real-time, коли йдеться про «достатньо свіже»' },
      body: {
        en: 'Bidirectional push (WebSockets/WebRTC) carries real cost — persistent connections, sticky sessions, fan-out. If a 5-second SSE stream or even cached polling meets the need, the extra axes aren’t worth paying for.',
        uk: 'Двонапрямлений push (WebSockets/WebRTC) має реальну ціну — постійні зʼєднання, sticky-сесії, fan-out. Якщо 5-секундний SSE-стрім чи навіть кешований polling закриває потребу, зайві осі не варті оплати.',
      },
    },
    {
      title: { en: 'Defaulting to tight coupling at the public edge', uk: 'Дефолтити в tight coupling на публічній межі' },
      body: {
        en: 'A shared IDL is great between services you control; forcing it on thousands of unknown external clients makes every change a coordinated migration. Keep the edge loose.',
        uk: 'Спільний IDL чудовий між сервісами, які ти контролюєш; нав’язувати його тисячам невідомих зовнішніх клієнтів — робить кожну зміну координованою міграцією. Тримай край loose.',
      },
    },
  ],
  interview: [
    {
      q: { en: 'A product needs live updates on a dashboard. Walk the decision axes to choose a style.', uk: 'Продукту потрібні живі оновлення на дашборді. Пройдись осями рішення, щоб обрати стиль.' },
      a: {
        en: 'Flow: server has data the client doesn’t know about → streaming/push, not request/response. Direction: does the client ever send back? A read-only dashboard is one-way → SSE fits; a collaborative one is bidirectional → WebSockets. Initiative: server-driven, so we’re working around HTTP’s pull model either way. Encoding: text is fine (JSON events). Topology: point-to-point unless we need fan-out to many services (then a broker behind the edge). Coupling: loose at the browser edge. Net: SSE for one-way, WebSockets if the client must send too — not gRPC or polling.',
        uk: 'Flow: сервер має дані, про які клієнт не знає → streaming/push, не request/response. Direction: чи клієнт колись відповідає? Read-only дашборд односторонній → SSE пасує; спільний — двонапрямлений → WebSockets. Initiative: server-driven, тож у будь-якому разі обходимо pull-модель HTTP. Encoding: text ок (JSON-події). Topology: point-to-point, хіба що потрібен fan-out на багато сервісів (тоді broker за межею). Coupling: loose на межі браузера. Підсумок: SSE для one-way, WebSockets якщо клієнт теж має слати — не gRPC і не polling.',
      },
      level: 'middle',
    },
    {
      q: { en: 'Why is “async” on this map not the same as `async/await` in your code?', uk: 'Чому «async» на цій карті — не те саме, що `async/await` у коді?' },
      a: {
        en: '`async/await` is a *local concurrency* mechanism: it frees the current thread while a call is outstanding, but the call can still be a synchronous request/response contract — the caller gets its answer in the same exchange. The async *axis* is a property of the *interaction*: the result is decoupled in time and arrives elsewhere (a webhook, a stream, a broker message), which forces retries, timeouts, idempotency and dead-lettering into the design. You can implement a synchronous API with non-blocking I/O, and a synchronous client can call an asynchronous (fire-and-forget) API. They’re different layers.',
        uk: '`async/await` — це механізм *локальної конкурентності*: він звільняє поточний потік, поки виклик у польоті, але виклик усе одно може бути синхронним request/response контрактом — викликач отримує відповідь у тому ж обміні. Async-*вісь* — властивість *взаємодії*: результат розчеплено в часі й приходить деінде (webhook, стрім, повідомлення broker-а), що заганяє в дизайн retries, timeouts, idempotency і dead-lettering. Можна зробити синхронний API на non-blocking I/O, і синхронний клієнт може викликати асинхронний (fire-and-forget) API. Це різні шари.',
      },
      level: 'senior',
    },
  ],
  seeAlso: ['m1-what-is-an-api', 'm3-http-transport', 'm4-data-formats', 'm5-rest', 'm24-decision-framework'],
  sources: [
    { title: 'Fielding — REST constraints (Architectural Styles…, 2000)', url: 'https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm' },
    { title: 'MDN — An overview of HTTP (request/response, client-initiated)', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview' },
    { title: 'MDN — Using server-sent events (one-way server push)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events' },
    { title: 'MDN — The WebSocket API (full-duplex)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API' },
    { title: 'gRPC — Core concepts (unary & the three streaming call types)', url: 'https://grpc.io/docs/what-is-grpc/core-concepts/' },
    { title: 'Hohpe & Woolf — Enterprise Integration Patterns (messaging & brokers)', url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/' },
  ],
};
