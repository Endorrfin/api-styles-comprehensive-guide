import type { Module } from '../types';

/*
 * m12-websockets — the persistent, full-duplex pipe (s3, Real-time/push/event-driven). SIGNATURE: sim
 * 'websocket-frames' (handshake → full-duplex frame timeline). Figure: 'websocket-frame-anatomy'. Eight
 * curriculum topics: the HTTP Upgrade handshake → frames & opcodes (figure) → full-duplex (sim) →
 * ping/pong keepalive → subprotocols → scaling (sticky + fan-out) → backpressure → security (wss/Origin/
 * CSWSH) + the verdict. Facts web-verified S7: RFC 6455 (101 handshake, Sec-WebSocket-Accept magic GUID
 * 258EAFA5…, opcodes, client-masking rule, ping 0x9/pong 0xA), RFC 8441/9220 (WS over HTTP/2 & HTTP/3 via
 * Extended CONNECT; 9220 shipped 2022 with little production uptake by 2026), RFC 7692 permessage-deflate,
 * CSWSH/Origin (CORS does not gate WS).
 */
export const m12: Module = {
  id: 'm12-websockets',
  num: 12,
  section: 's3-realtime-events',
  order: 1,
  level: 'senior',
  signature: true,
  title: { en: 'WebSockets', uk: 'WebSockets' },
  tagline: {
    en: 'One socket, both sides talking at once: an HTTP request that upgrades into a persistent full-duplex pipe.',
    uk: 'Один сокет, обидві сторони говорять водночас: HTTP-запит, що апгрейдиться в постійну full-duplex трубу.',
  },
  readMins: 18,
  mentalModel: {
    en: 'A WebSocket is a persistent, **full-duplex** pipe. It is born as an ordinary HTTP request that asks to **Upgrade**; once the server answers `101 Switching Protocols`, HTTP framing falls away and both sides send message **frames** whenever they like, in either direction, over the one TCP connection — until someone sends a close frame. You trade HTTP’s statelessness and cacheability for a live, stateful, symmetric channel.',
    uk: 'WebSocket — це постійна **full-duplex** труба. Він народжується як звичайний HTTP-запит, що просить **Upgrade**; щойно сервер відповідає `101 Switching Protocols`, HTTP-фреймінг зникає, і обидві сторони шлють **фрейми** повідомлень коли завгодно, в будь-якому напрямку, через одне TCP-зʼєднання — доки хтось не надішле close-фрейм. Ти міняєш statelessness і кешованість HTTP на живий, stateful, симетричний канал.',
  },
  topics: [
    // ── T1 · Upgrade handshake ────────────────────────────────────────────────
    {
      id: 'upgrade-handshake',
      title: { en: 'Born from an HTTP Upgrade', uk: 'Народжений з HTTP Upgrade' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'A WebSocket connection begins as a normal **HTTP/1.1 GET** carrying `Upgrade: websocket`, `Connection: Upgrade`, a random `Sec-WebSocket-Key`, and `Sec-WebSocket-Version: 13`. The server proves it actually speaks WebSocket by echoing **`101 Switching Protocols`** with a `Sec-WebSocket-Accept` derived from the key: base64(SHA-1(key + the fixed GUID `258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)). After that 101, the bytes on the socket are **no longer HTTP** — they’re the WebSocket framing protocol over the same TCP connection. That handshake is the “Web” in WebSocket: it rides ports 80/443 and passes through existing HTTP infrastructure.',
            uk: 'Зʼєднання WebSocket починається як звичайний **HTTP/1.1 GET** із `Upgrade: websocket`, `Connection: Upgrade`, випадковим `Sec-WebSocket-Key` і `Sec-WebSocket-Version: 13`. Сервер доводить, що справді говорить WebSocket, повертаючи **`101 Switching Protocols`** із `Sec-WebSocket-Accept`, виведеним із ключа: base64(SHA-1(key + фіксований GUID `258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)). Після цього 101 байти в сокеті **вже не HTTP** — це протокол фреймінгу WebSocket над тим самим TCP-зʼєднанням. Це рукостискання — і є «Web» у WebSocket: воно їде на портах 80/443 і проходить крізь наявну HTTP-інфраструктуру.',
          },
        },
        {
          kind: 'code',
          lang: 'http',
          code: `GET /chat HTTP/1.1
Host: example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13

HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=`,
          note: {
            en: 'One HTTP round trip. After the 101, framing switches from HTTP to WebSocket on the same socket — no more requests, just frames.',
            uk: 'Один HTTP round trip. Після 101 фреймінг перемикається з HTTP на WebSocket на тому ж сокеті — більше жодних запитів, лише фрейми.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'The magic GUID, and WS over HTTP/2 & HTTP/3', uk: 'Магічний GUID і WS над HTTP/2 та HTTP/3' },
          md: {
            en: 'The fixed GUID has no cryptographic role — it exists so an HTTP server or proxy that doesn’t understand WebSocket can’t accidentally complete the handshake. Over HTTP/2 (RFC 8441) and HTTP/3 (RFC 9220) the upgrade instead uses the **Extended CONNECT** method with a `:protocol` pseudo-header, so a WebSocket becomes one multiplexed stream alongside normal traffic — but support is uneven (RFC 9220 shipped in 2022 with little production uptake by 2026), so the HTTP/1.1 Upgrade above is still the common path.',
            uk: 'Фіксований GUID не має криптографічної ролі — він існує, щоб HTTP-сервер чи proxy, який не розуміє WebSocket, не завершив рукостискання випадково. Над HTTP/2 (RFC 8441) і HTTP/3 (RFC 9220) апгрейд натомість використовує метод **Extended CONNECT** із псевдо-заголовком `:protocol`, тож WebSocket стає одним мультиплексованим стрімом поряд зі звичайним трафіком — але підтримка нерівна (RFC 9220 вийшов 2022 з малим впровадженням до 2026), тож HTTP/1.1 Upgrade вище досі основний шлях.',
          },
        },
      ],
    },
    // ── T2 · Frames & opcodes (figure) ────────────────────────────────────────
    {
      id: 'frames-opcodes',
      title: { en: 'On the wire: frames & opcodes', uk: 'На дроті: фрейми й opcodes' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Once open, data moves in **frames**, not requests. A frame’s first byte is a **FIN** bit + 3 reserved bits + a **4-bit opcode**; the second byte is the **MASK** bit + a 7-bit payload length (extended to 16 or 64 bits for bigger messages). Opcodes split into **data** frames — text `0x1` (UTF-8), binary `0x2` — and **control** frames — close `0x8`, ping `0x9`, pong `0xA`; opcode `0x0` is a **continuation** frame for a message fragmented across several frames. A close frame carries a 2-byte code (`1000` normal, `1001` going away; `1006` is synthesised locally when the socket drops with no close frame).',
            uk: 'Щойно відкрито, дані рухаються **фреймами**, не запитами. Перший байт фрейму — біт **FIN** + 3 reserved-біти + **4-бітний opcode**; другий байт — біт **MASK** + 7-бітна довжина payload (розширювана до 16 чи 64 біт для більших повідомлень). Opcodes діляться на **data**-фрейми — text `0x1` (UTF-8), binary `0x2` — і **control**-фрейми — close `0x8`, ping `0x9`, pong `0xA`; opcode `0x0` — це **continuation**-фрейм для повідомлення, фрагментованого на кілька фреймів. Close-фрейм несе 2-байтний код (`1000` нормально, `1001` going away; `1006` синтезується локально, коли сокет обірвався без close-фрейму).',
          },
        },
        {
          kind: 'figure',
          fig: 'websocket-frame-anatomy',
          caption: {
            en: 'The RFC 6455 frame header: FIN + opcode in byte 0, MASK + length in byte 1, then the optional extended length, the masking-key (client→server only), and the payload.',
            uk: 'Заголовок фрейму RFC 6455: FIN + opcode у байті 0, MASK + довжина в байті 1, далі опційна розширена довжина, masking-key (лише client→server) і payload.',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Opcode', uk: 'Opcode' },
            { en: 'Value', uk: 'Значення' },
            { en: 'Type', uk: 'Тип' },
            { en: 'Use', uk: 'Використання' },
          ],
          rows: [
            [
              { en: 'text', uk: 'text' },
              { en: '0x1', uk: '0x1' },
              { en: 'data', uk: 'data' },
              { en: 'UTF-8 messages', uk: 'UTF-8 повідомлення' },
            ],
            [
              { en: 'binary', uk: 'binary' },
              { en: '0x2', uk: '0x2' },
              { en: 'data', uk: 'data' },
              { en: 'Blobs, protobuf, files', uk: 'Blob-и, protobuf, файли' },
            ],
            [
              { en: 'close', uk: 'close' },
              { en: '0x8', uk: '0x8' },
              { en: 'control', uk: 'control' },
              { en: 'Begin/confirm close (+ code)', uk: 'Почати/підтвердити close (+ код)' },
            ],
            [
              { en: 'ping', uk: 'ping' },
              { en: '0x9', uk: '0x9' },
              { en: 'control', uk: 'control' },
              { en: 'Keepalive probe', uk: 'Keepalive-проба' },
            ],
            [
              { en: 'pong', uk: 'pong' },
              { en: '0xA', uk: '0xA' },
              { en: 'control', uk: 'control' },
              { en: 'Keepalive reply', uk: 'Keepalive-відповідь' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'Client frames must be masked — but masking isn’t encryption', uk: 'Клієнтські фрейми мають бути масковані — але masking це не шифрування' },
          md: {
            en: 'Every **client→server** frame MUST be masked (XOR with a per-frame 32-bit key); a server MUST drop an unmasked client frame. Server→client frames are never masked. Masking exists to stop cache-poisoning attacks against intermediaries that might misread frames as HTTP — it provides **no confidentiality**. For that you use `wss://` (TLS). Mask even over TLS; it’s a protocol requirement, not a security substitute.',
            uk: 'Кожен **client→server** фрейм МАЄ бути маскованим (XOR із 32-бітним ключем на фрейм); сервер МУСИТЬ відкинути немаскований клієнтський фрейм. Server→client фрейми ніколи не маскуються. Masking існує, щоб спинити cache-poisoning атаки на проміжні вузли, які могли б прочитати фрейми як HTTP, — він не дає **жодної конфіденційності**. Для неї — `wss://` (TLS). Маскуй навіть над TLS; це вимога протоколу, а не заміна безпеки.',
          },
        },
      ],
    },
    // ── T3 · Full-duplex (the sim) ────────────────────────────────────────────
    {
      id: 'full-duplex',
      title: { en: 'Full-duplex: both sides, anytime', uk: 'Full-duplex: обидві сторони, будь-коли' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'This is the payoff. Unlike REST request/response (the client asks, the server answers) or SSE (server→client only, m13), a WebSocket is **symmetric**: after the handshake either peer sends frames whenever it likes, concurrently, over one long-lived connection. No polling, no per-message HTTP headers, low latency. The simulator below shows the handshake completing, then frames crossing in **both directions at the same tick** — a server push arriving while the client sends a ping.',
            uk: 'Це і є винагорода. На відміну від REST request/response (клієнт питає, сервер відповідає) чи SSE (лише server→client, m13), WebSocket **симетричний**: після рукостискання будь-який peer шле фрейми коли завгодно, паралельно, через одне довгоживуче зʼєднання. Без polling, без HTTP-заголовків на кожне повідомлення, low latency. Симулятор нижче показує завершення рукостискання, а потім фрейми, що йдуть в **обидва боки на тому самому тіку** — server push прибуває, поки клієнт шле ping.',
          },
        },
        {
          kind: 'sim',
          sim: 'websocket-frames',
          caption: {
            en: 'Step the clock: GET → 101 opens the socket, then data and a ping/pong keepalive flow both ways, a message arrives fragmented (FIN=0 → continuation), and a close handshake ends it. Toggle “show bytes” to see each frame’s FIN|opcode leading byte.',
            uk: 'Крокуй годинником: GET → 101 відкриває сокет, далі дані й ping/pong keepalive течуть в обидва боки, одне повідомлення приходить фрагментованим (FIN=0 → continuation), і close-рукостискання завершує. Увімкни «показати байти», щоб побачити провідний байт FIN|opcode кожного фрейму.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Only reach for WebSockets when both sides talk', uk: 'Бери WebSockets лише коли говорять обидві сторони' },
          md: {
            en: 'Full-duplex is the whole reason to choose WebSockets. If only the server needs to push, **SSE** (m13) is simpler and rides plain HTTP. If you need request/response, REST is simpler. Reach for WebSockets when both ends genuinely send: chat, collaborative editing, multiplayer, live trading, presence.',
            uk: 'Full-duplex — це вся причина обирати WebSockets. Якщо пушити треба лише серверу, **SSE** (m13) простіший і їде на звичайному HTTP. Якщо треба request/response, REST простіший. Бери WebSockets, коли обидва кінці справді шлють: чат, спільне редагування, multiplayer, live-трейдинг, presence.',
          },
        },
      ],
    },
    // ── T4 · Ping/pong & keepalive ────────────────────────────────────────────
    {
      id: 'ping-pong-keepalive',
      title: { en: 'Ping / pong & keepalive', uk: 'Ping / pong і keepalive' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Control frames **ping (0x9)** and **pong (0xA)** keep a connection healthy. Either side may send a ping at any time; the peer must reply with a **pong echoing the same payload** as soon as possible. Two jobs: detect a half-open or dead peer (no pong within a deadline → treat it as gone), and keep NATs and proxies from idling out an otherwise-quiet connection. An unsolicited pong (a one-way heartbeat) is legal — just ignore it.',
            uk: 'Control-фрейми **ping (0x9)** і **pong (0xA)** тримають зʼєднання здоровим. Будь-яка сторона може надіслати ping у будь-який час; peer має відповісти **pong, що повторює той самий payload**, якнайшвидше. Дві задачі: виявити напіввідкритого чи мертвого peer-а (немає pong у межах deadline → вважай, що зник), і не дати NAT-ам і proxy idle-аутнути інакше тихе зʼєднання. Непроханий pong (односторонній heartbeat) легальний — просто ігноруй його.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'A silent connection can be dead for minutes', uk: 'Тихе зʼєднання може бути мертвим хвилинами' },
          md: {
            en: 'Intermediaries drop long-idle TCP connections without telling either end, so a socket that looks “connected” can be dead until the next write fails — sometimes minutes later. Send a periodic ping heartbeat, treat a missing pong within a deadline as a dead connection, and reconnect (with backoff). The browser’s `WebSocket` handles protocol-level pongs for you, but application-level liveness and reconnect are on you.',
            uk: 'Проміжні вузли скидають довго-idle TCP-зʼєднання, не сповіщаючи жоден кінець, тож сокет, що виглядає «підключеним», може бути мертвим до наступного невдалого запису — інколи через хвилини. Шли періодичний ping-heartbeat, вважай відсутній pong у межах deadline мертвим зʼєднанням і перепідключайся (з backoff). Браузерний `WebSocket` обробляє pong на рівні протоколу за тебе, але liveness і reconnect на рівні застосунку — на тобі.',
          },
        },
      ],
    },
    // ── T5 · Subprotocols ─────────────────────────────────────────────────────
    {
      id: 'subprotocols',
      title: { en: 'Subprotocols: an app protocol on top', uk: 'Subprotocols: прикладний протокол зверху' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'A WebSocket is a raw bidirectional byte pipe — it says **nothing** about what your messages mean. The `Sec-WebSocket-Protocol` header negotiates an application **subprotocol** at handshake time: the client offers a list, the server picks **exactly one** (or none). Real examples: `graphql-transport-ws` (GraphQL subscriptions, m9), STOMP, WAMP, or your own JSON envelope. This is distinct from **extensions** like `permessage-deflate` (RFC 7692), which transform the *frame* (compression) rather than defining payload meaning.',
            uk: 'WebSocket — це сирий двонапрямний байтовий канал, він **нічого** не каже про сенс твоїх повідомлень. Заголовок `Sec-WebSocket-Protocol` домовляється про прикладний **subprotocol** під час рукостискання: клієнт пропонує список, сервер обирає **рівно один** (або жоден). Реальні приклади: `graphql-transport-ws` (GraphQL subscriptions, m9), STOMP, WAMP чи твій власний JSON-envelope. Це відрізняється від **extensions** на кшталт `permessage-deflate` (RFC 7692), які трансформують *фрейм* (стиснення), а не визначають сенс payload.',
          },
        },
        {
          kind: 'code',
          lang: 'http',
          code: `# client offers subprotocols, in preference order
Sec-WebSocket-Protocol: graphql-transport-ws, stomp

# server picks exactly one (or omits the header entirely)
Sec-WebSocket-Protocol: graphql-transport-ws`,
          note: {
            en: 'Design a message envelope (type · id · payload) so you can correlate replies, multiplex logical streams, and version — a raw pipe with no envelope gets unmaintainable fast.',
            uk: 'Спроєктуй envelope повідомлення (type · id · payload), щоб корелювати відповіді, мультиплексувати логічні стріми й версіонувати — сирий канал без envelope швидко стає некерованим.',
          },
        },
      ],
    },
    // ── T6 · Scaling: sticky sessions & fan-out ───────────────────────────────
    {
      id: 'scaling-sticky-fanout',
      title: { en: 'Scaling: sticky sessions & fan-out', uk: 'Масштабування: sticky sessions і fan-out' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'WebSockets are **stateful** and long-lived, which breaks the stateless-horizontal-scaling assumption REST enjoys. Two problems follow. First, a connection is pinned to **one server instance**, so your load balancer needs **sticky routing** (or L4 pass-through) and must support the HTTP Upgrade. Second, to broadcast an event to users spread across N instances, the instance that receives it must **fan it out** to the others — so you add a **pub/sub backplane** (Redis, NATS, Kafka): any node publishes, every node pushes to its local sockets. Capacity is now measured in **concurrent connections** (memory + a file descriptor each), not requests per second.',
            uk: 'WebSockets **stateful** і довгоживучі, що ламає припущення про stateless горизонтальне масштабування, яким тішиться REST. Звідси дві проблеми. Перша: зʼєднання приколоте до **одного інстансу сервера**, тож твій load balancer потребує **sticky routing** (чи L4 pass-through) і має підтримувати HTTP Upgrade. Друга: щоб розіслати подію користувачам, розкиданим по N інстансах, інстанс, що її отримав, має **розфанаутити** її іншим — тож додаєш **pub/sub backplane** (Redis, NATS, Kafka): будь-який вузол публікує, кожен вузол пушить своїм локальним сокетам. Місткість тепер міряється в **паралельних зʼєднаннях** (памʼять + файловий дескриптор на кожне), а не в запитах за секунду.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Plan the backplane before you need it', uk: 'Плануй backplane до того, як він знадобиться' },
          md: {
            en: 'Retrofitting fan-out onto a single-node design is painful. If broadcast or presence is on the roadmap, put the pub/sub backplane and connection-count limits in from the start, and load-test on concurrent connections, not request rate. This is the real cost of the persistent, stateful channel.',
            uk: 'Прикручувати fan-out до одновузлового дизайну боляче. Якщо broadcast чи presence у планах, закладай pub/sub backplane і ліміти кількості зʼєднань від початку й навантажуй тестами на паралельні зʼєднання, а не на rate запитів. Це і є справжня ціна постійного stateful-каналу.',
          },
        },
      ],
    },
    // ── T7 · Backpressure ─────────────────────────────────────────────────────
    {
      id: 'backpressure',
      title: { en: 'Backpressure & flow control', uk: 'Backpressure і flow control' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Unlike HTTP/2 streams (m3), the WebSocket API gives you **no automatic per-message flow control**. If one side sends faster than the other reads, frames pile up in the sender’s buffer and memory grows without bound — a slow consumer can OOM the producer. In the browser, `WebSocket.bufferedAmount` reports how many bytes are still queued to send; on the server, watch the socket’s write buffer. The fix is application-level: **pause or throttle** when the buffer is high, **coalesce or drop** stale updates (keep only the latest price/position), or apply credit-based flow control.',
            uk: 'На відміну від HTTP/2-стрімів (m3), WebSocket API не дає **жодного автоматичного flow control на повідомлення**. Якщо одна сторона шле швидше, ніж інша читає, фрейми накопичуються в буфері відправника, і памʼять росте безмежно — повільний consumer може OOM-нути producer-а. У браузері `WebSocket.bufferedAmount` показує, скільки байтів ще в черзі на відправку; на сервері — стеж за буфером запису сокета. Виправлення на рівні застосунку: **призупиняй чи throttle-и**, коли буфер великий, **коалесуй чи відкидай** застарілі оновлення (лишай лише останню ціну/позицію) або застосуй credit-based flow control.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'A fast producer + slow consumer is an outage waiting to happen', uk: 'Швидкий producer + повільний consumer — це outage, що чекає статися' },
          md: {
            en: 'With no backpressure, an unbounded send buffer grows until the process runs out of memory. Always bound it: check `bufferedAmount` before sending, and shed or coalesce rather than queue without limit. For high-rate streams, sending the latest snapshot beats delivering every stale delta.',
            uk: 'Без backpressure необмежений буфер відправки росте, доки процесу не забракне памʼяті. Завжди обмежуй його: перевіряй `bufferedAmount` перед відправкою і відкидай чи коалесуй замість необмеженої черги. Для high-rate стрімів надіслати останній snapshot краще, ніж доставити кожну застарілу дельту.',
          },
        },
      ],
    },
    // ── T8 · Security + the verdict ───────────────────────────────────────────
    {
      id: 'security-origin-wss',
      title: { en: 'Security & when to use WebSockets', uk: 'Безпека і коли брати WebSockets' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'WebSocket security has edges HTTP developers miss. Always use **`wss://`** (TLS) in production. The big one: the browser’s **same-origin policy and CORS do NOT apply to WebSockets**, so any site can open a WebSocket to your server carrying the victim’s cookies — **Cross-Site WebSocket Hijacking (CSWSH)**, effectively a CSRF on the handshake. Defenses: **validate the `Origin` header** against an allowlist (the browser sets it and page JavaScript cannot forge it), and **don’t authenticate with cookies alone** — use a short-lived token. Since the browser WebSocket API can’t set custom headers, pass that token via the subprotocol, a query parameter over `wss`, or a first message. And validate every inbound frame: a persistent pipe is a persistent injection surface.',
            uk: 'Безпека WebSocket має гострі кути, які HTTP-розробники пропускають. Завжди використовуй **`wss://`** (TLS) у проді. Головне: браузерна **same-origin policy і CORS НЕ діють на WebSockets**, тож будь-який сайт може відкрити WebSocket до твого сервера з cookie жертви — **Cross-Site WebSocket Hijacking (CSWSH)**, фактично CSRF на рукостисканні. Захист: **валідуй заголовок `Origin`** проти allowlist (браузер його ставить, а JavaScript сторінки не може підробити) і **не автентифікуй лише cookie** — використовуй короткоживучий токен. Оскільки браузерний WebSocket API не може ставити кастомні заголовки, передавай токен через subprotocol, query-параметр над `wss` чи перше повідомлення. І валідуй кожен вхідний фрейм: постійний канал — це постійна поверхня injection.',
          },
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'CSWSH: CORS does not protect WebSockets', uk: 'CSWSH: CORS не захищає WebSockets' },
          md: {
            en: 'Because CORS never gates the WebSocket handshake, a connection authenticated by ambient cookies alone can be opened from any origin — the attacker’s page reads your live data. Check `Origin` against an explicit allowlist AND authenticate with a per-connection token, never ambient cookies. Non-browser clients can forge Origin, so treat it as one layer, not the whole defense.',
            uk: 'Оскільки CORS ніколи не гейтить рукостискання WebSocket, зʼєднання, автентифіковане лише ambient-cookie, можна відкрити з будь-якого origin — сторінка атакувальника читає твої живі дані. Перевіряй `Origin` проти явного allowlist І автентифікуй per-connection токеном, ніколи не ambient-cookie. Не-браузерні клієнти можуть підробити Origin, тож вважай його одним шаром, а не всім захистом.',
          },
        },
        {
          kind: 'compare',
          a: { en: 'Reach for WebSockets', uk: 'Бери WebSockets' },
          b: { en: 'Prefer SSE / WebRTC / REST', uk: 'Обери SSE / WebRTC / REST' },
          rows: [
            [
              { en: 'Direction', uk: 'Напрямок' },
              { en: 'Full-duplex — both sides push', uk: 'Full-duplex — пушать обидві сторони' },
              { en: 'Server-only push → SSE; req/resp → REST', uk: 'Лише server push → SSE; req/resp → REST' },
            ],
            [
              { en: 'Topology', uk: 'Топологія' },
              { en: 'Client ↔ server over one socket', uk: 'Client ↔ server через один сокет' },
              { en: 'Peer-to-peer media/data → WebRTC', uk: 'Peer-to-peer медіа/дані → WebRTC' },
            ],
            [
              { en: 'Infra', uk: 'Інфра' },
              { en: 'One TCP connection, framed messages', uk: 'Одне TCP-зʼєднання, framed-повідомлення' },
              { en: 'SSE = plain HTTP stream, simpler', uk: 'SSE = звичайний HTTP-стрім, простіше' },
            ],
            [
              { en: 'Cost', uk: 'Вартість' },
              { en: 'Stateful: sticky routing + fan-out', uk: 'Stateful: sticky routing + fan-out' },
              { en: 'SSE/REST scale statelessly', uk: 'SSE/REST масштабуються stateless' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'The verdict', uk: 'Вердикт' },
          md: {
            en: 'Use WebSockets when both ends genuinely send over a live, low-latency channel — chat, collaborative editing, multiplayer, trading, presence. Avoid them when only the server pushes (SSE is simpler and stateless), when request/response fits (REST), or for peer-to-peer media (WebRTC, m14). The power is a persistent symmetric pipe; the price is state — sticky routing, a fan-out backplane, heartbeats, backpressure, and WS-specific security. Take it on only when full-duplex earns its keep.',
            uk: 'Бери WebSockets, коли обидва кінці справді шлють через живий low-latency канал — чат, спільне редагування, multiplayer, трейдинг, presence. Уникай, коли пушить лише сервер (SSE простіший і stateless), коли пасує request/response (REST) чи для peer-to-peer медіа (WebRTC, m14). Сила — постійна симетрична труба; ціна — стан: sticky routing, fan-out backplane, heartbeats, backpressure і WS-специфічна безпека. Бери це лише коли full-duplex справді виправдовує себе.',
          },
        },
      ],
    },
  ],
  keyPoints: [
    { en: 'A WebSocket starts as an HTTP Upgrade (GET → 101 Switching Protocols); after the 101 the socket carries WebSocket frames, not HTTP.', uk: 'WebSocket починається як HTTP Upgrade (GET → 101 Switching Protocols); після 101 сокет несе WebSocket-фрейми, не HTTP.' },
    { en: 'Data moves in frames: FIN + opcode (text 0x1, binary 0x2, close 0x8, ping 0x9, pong 0xA) + length; client→server frames MUST be masked, server→client never.', uk: 'Дані рухаються фреймами: FIN + opcode (text 0x1, binary 0x2, close 0x8, ping 0x9, pong 0xA) + довжина; client→server фрейми МАЮТЬ бути масковані, server→client — ніколи.' },
    { en: 'It’s full-duplex — either side sends anytime over one connection — which is the only real reason to pick it over SSE (server-only) or REST (request/response).', uk: 'Це full-duplex — будь-яка сторона шле будь-коли через одне зʼєднання — і це єдина справжня причина обрати його замість SSE (лише сервер) чи REST (request/response).' },
    { en: 'Ping/pong control frames keep the connection alive and detect dead peers through idle-dropping intermediaries; add an app-level heartbeat + reconnect.', uk: 'Ping/pong control-фрейми тримають зʼєднання живим і виявляють мертвих peer-ів крізь вузли, що скидають idle; додай heartbeat на рівні застосунку + reconnect.' },
    { en: 'WebSockets are stateful: connections pin to an instance (sticky routing), broadcast needs a pub/sub fan-out backplane, capacity is concurrent connections, and backpressure is yours to handle.', uk: 'WebSockets stateful: зʼєднання приколоті до інстансу (sticky routing), broadcast потребує pub/sub fan-out backplane, місткість — це паралельні зʼєднання, а backpressure — на тобі.' },
    { en: 'Secure deliberately: wss + Origin allowlist + a per-connection token — CORS does NOT protect WebSockets (CSWSH).', uk: 'Захищай свідомо: wss + Origin allowlist + per-connection токен — CORS НЕ захищає WebSockets (CSWSH).' },
  ],
  pitfalls: [
    {
      title: { en: 'Assuming CORS protects the handshake (CSWSH)', uk: 'Вважати, що CORS захищає рукостискання (CSWSH)' },
      body: {
        en: 'The same-origin policy doesn’t gate WebSockets, so a connection authenticated by cookies alone can be opened from any site — Cross-Site WebSocket Hijacking. Validate the Origin header against an allowlist and authenticate with a per-connection token, not ambient cookies.',
        uk: 'Same-origin policy не гейтить WebSockets, тож зʼєднання, автентифіковане лише cookie, можна відкрити з будь-якого сайту — Cross-Site WebSocket Hijacking. Валідуй заголовок Origin проти allowlist і автентифікуй per-connection токеном, а не ambient-cookie.',
      },
    },
    {
      title: { en: 'No heartbeat or reconnect → zombie connections', uk: 'Без heartbeat чи reconnect → zombie-зʼєднання' },
      body: {
        en: 'Intermediaries silently drop idle TCP connections, so a socket can look connected while being dead. Without a ping/pong heartbeat and automatic reconnect with backoff, the client believes it’s live and quietly misses messages.',
        uk: 'Проміжні вузли тихо скидають idle TCP-зʼєднання, тож сокет може виглядати підключеним, будучи мертвим. Без ping/pong-heartbeat і автоматичного reconnect із backoff клієнт вважає, що він живий, і тихо пропускає повідомлення.',
      },
    },
    {
      title: { en: 'Ignoring backpressure → out-of-memory', uk: 'Ігнорувати backpressure → out-of-memory' },
      body: {
        en: 'WebSockets have no automatic flow control. A fast producer and a slow consumer grow the send buffer without bound until the process crashes. Bound it: check bufferedAmount, throttle, and coalesce or drop stale updates instead of queueing forever.',
        uk: 'WebSockets не мають автоматичного flow control. Швидкий producer і повільний consumer нарощують буфер відправки безмежно, доки процес не впаде. Обмежуй: перевіряй bufferedAmount, throttle-и й коалесуй чи відкидай застарілі оновлення замість вічної черги.',
      },
    },
  ],
  interview: [
    {
      q: { en: 'Walk me through the WebSocket handshake, and how communication differs from HTTP afterward.', uk: 'Проведи мене через рукостискання WebSocket і чим спілкування відрізняється від HTTP після нього.' },
      a: {
        en: 'It begins as an HTTP/1.1 GET with Upgrade: websocket, Connection: Upgrade, a random Sec-WebSocket-Key, and Sec-WebSocket-Version: 13. The server confirms it speaks WebSocket by replying 101 Switching Protocols with Sec-WebSocket-Accept = base64(SHA-1(key + the fixed GUID 258EAFA5-…)); that derivation exists so an HTTP server or proxy that doesn’t understand WebSocket can’t accidentally complete the handshake. After the 101, the connection is no longer HTTP: both sides exchange WebSocket frames over the same TCP socket, full-duplex, whenever they like — no request/response pairing, no per-message headers. Each frame has a FIN bit, an opcode (text/binary/close/ping/pong), and a length; client→server frames must be masked, server→client must not. Over HTTP/2 (RFC 8441) and HTTP/3 (RFC 9220) the upgrade uses Extended CONNECT instead, but HTTP/1.1 Upgrade is still the common path.',
        uk: 'Він починається як HTTP/1.1 GET із Upgrade: websocket, Connection: Upgrade, випадковим Sec-WebSocket-Key і Sec-WebSocket-Version: 13. Сервер підтверджує, що говорить WebSocket, відповідаючи 101 Switching Protocols із Sec-WebSocket-Accept = base64(SHA-1(key + фіксований GUID 258EAFA5-…)); ця деривація існує, щоб HTTP-сервер чи proxy, який не розуміє WebSocket, не завершив рукостискання випадково. Після 101 зʼєднання вже не HTTP: обидві сторони обмінюються WebSocket-фреймами через той самий TCP-сокет, full-duplex, коли завгодно — без пари request/response, без заголовків на кожне повідомлення. Кожен фрейм має біт FIN, opcode (text/binary/close/ping/pong) і довжину; client→server фрейми мають бути масковані, server→client — ні. Над HTTP/2 (RFC 8441) і HTTP/3 (RFC 9220) апгрейд використовує Extended CONNECT, але HTTP/1.1 Upgrade досі основний шлях.',
      },
      level: 'senior',
    },
    {
      q: { en: 'How do you scale WebSockets across many servers, and what breaks compared to REST?', uk: 'Як масштабувати WebSockets на багато серверів і що ламається порівняно з REST?' },
      a: {
        en: 'REST is stateless, so any instance can serve any request and you scale by adding boxes behind a round-robin balancer. WebSockets are stateful and long-lived, which breaks two assumptions. First, each connection is pinned to one instance, so the load balancer needs sticky routing (or L4 pass-through) and must support the HTTP Upgrade. Second, to broadcast to users spread across instances, the node that receives an event must fan it out to the others — so you add a pub/sub backplane (Redis, NATS, Kafka): any node publishes, every node pushes to its local sockets. Capacity is measured in concurrent open connections (each costs memory and a file descriptor), not requests per second, and you also own connection liveness (ping/pong + reconnect) and backpressure. Plan the backplane and connection limits up front; retrofitting fan-out onto a single-node design is painful.',
        uk: 'REST stateless, тож будь-який інстанс обслуговує будь-який запит, і ти масштабуєш, додаючи машини за round-robin балансувальником. WebSockets stateful і довгоживучі, що ламає два припущення. Перше: кожне зʼєднання приколоте до одного інстансу, тож load balancer потребує sticky routing (чи L4 pass-through) і має підтримувати HTTP Upgrade. Друге: щоб розіслати користувачам по інстансах, вузол, що отримав подію, має розфанаутити її іншим — тож додаєш pub/sub backplane (Redis, NATS, Kafka): будь-який вузол публікує, кожен вузол пушить своїм локальним сокетам. Місткість міряється в паралельних відкритих зʼєднаннях (кожне коштує памʼять і файловий дескриптор), а не в запитах/сек, і ти також володієш liveness (ping/pong + reconnect) і backpressure. Плануй backplane і ліміти зʼєднань наперед; прикручувати fan-out до одновузлового дизайну боляче.',
      },
      level: 'senior',
    },
  ],
  seeAlso: ['m13-sse', 'm14-webrtc', 'm3-http-transport', 'm9-graphql', 'm5-rest', 'm15-webhooks'],
  sources: [
    { title: 'RFC 6455 — The WebSocket Protocol', url: 'https://datatracker.ietf.org/doc/html/rfc6455' },
    { title: 'MDN — Writing WebSocket servers (handshake, frames, opcodes, masking)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers' },
    { title: 'MDN — WebSocket (browser API; bufferedAmount)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSocket' },
    { title: 'RFC 8441 — Bootstrapping WebSockets with HTTP/2', url: 'https://datatracker.ietf.org/doc/html/rfc8441' },
    { title: 'RFC 9220 — Bootstrapping WebSockets with HTTP/3', url: 'https://datatracker.ietf.org/doc/html/rfc9220' },
    { title: 'RFC 7692 — Compression Extensions for WebSocket (permessage-deflate)', url: 'https://datatracker.ietf.org/doc/html/rfc7692' },
    { title: 'PortSwigger — Cross-site WebSocket hijacking (CSWSH)', url: 'https://portswigger.net/web-security/websockets/cross-site-websocket-hijacking' },
    { title: 'OWASP — WebSocket Security Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html' },
  ],
};
