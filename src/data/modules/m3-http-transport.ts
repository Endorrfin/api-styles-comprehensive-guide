import type { Module } from '../types';

/*
 * m3-http-transport — the wire underneath every HTTP-based style (s4). SIGNATURE: sim 'http-multiplexing'.
 * Figure: 'http-connection-models'. Seven topics = the transport substrate from TCP/TLS up through the
 * three HTTP versions, head-of-line blocking as the connecting thread, connection reuse, and how the
 * transport constrains each style. Version/spec facts (RFC 9110-9114, QUIC 9000/9001, HPACK 7541, QPACK
 * 9204, Extensible Priorities 9218, TLS 1.3 8446) web-verified S4 and cited below.
 */
export const m3: Module = {
  id: 'm3-http-transport',
  num: 3,
  section: 's0-foundations',
  order: 3,
  level: 'senior',
  signature: true,
  title: { en: 'The HTTP transport substrate', uk: 'Транспортний субстрат HTTP' },
  tagline: {
    en: 'HTTP/1.1 vs 2 vs 3 — one connection or many, and why head-of-line blocking decides your ceiling.',
    uk: 'HTTP/1.1 проти 2 проти 3 — одне зʼєднання чи багато, і чому head-of-line blocking визначає вашу стелю.',
  },
  readMins: 18,
  mentalModel: {
    en: 'The wire underneath sets your ceiling. HTTP/1.1 serialises one response per connection; HTTP/2 multiplexes many streams over one TCP connection but a lost packet stalls them all; HTTP/3 puts streams on QUIC so loss stalls only one. Multiplexing and head-of-line blocking are the whole story.',
    uk: 'Дріт під низом задає вашу стелю. HTTP/1.1 серіалізує одну відповідь на зʼєднання; HTTP/2 мультиплексує багато стрімів над одним TCP-зʼєднанням, але втрачений пакет зупиняє всі; HTTP/3 кладе стріми на QUIC, тож втрата зупиняє лише один. Multiplexing і head-of-line blocking — це вся суть.',
  },
  topics: [
    // ── T1 · TCP, UDP, TLS — the substrate ───────────────────────────────────
    {
      id: 'tcp-udp-tls',
      title: { en: 'TCP, UDP & TLS — the substrate', uk: 'TCP, UDP і TLS — субстрат' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Every HTTP-based style rides a **transport**, and the transport sets the latency floor no style can beat. **TCP** gives you a reliable, in-order byte-stream, opened with a three-way handshake (one round-trip) before any data flows. **UDP** is the opposite — connectionless datagrams with no ordering and no delivery guarantee; you build reliability yourself (which is exactly what QUIC does). **TLS** encrypts the transport: TLS 1.3 (RFC 8446) needs one round-trip to set up, or zero on resumption. So a classic HTTPS request pays *TCP handshake + TLS handshake* before the first byte — and QUIC exists largely to collapse those two into one.',
            uk: 'Кожен HTTP-стиль їде на **транспорті**, і транспорт задає підлогу latency, яку жоден стиль не переб’є. **TCP** дає надійний упорядкований потік байтів, відкритий three-way handshake (один round-trip) до будь-яких даних. **UDP** — протилежність: connectionless-датаграми без упорядкування й гарантії доставки; надійність будуєш сам (саме це робить QUIC). **TLS** шифрує транспорт: TLS 1.3 (RFC 8446) потребує один round-trip на встановлення, або нуль на resumption. Тож класичний HTTPS-запит платить *TCP handshake + TLS handshake* до першого байта — і QUIC існує здебільшого, щоб злити ці два в один.',
          },
        },
        {
          kind: 'figure',
          fig: 'http-connection-models',
          caption: {
            en: 'The three connection models, same client and server. HTTP/1.1 opens several TCP connections; HTTP/2 multiplexes streams over one; HTTP/3 puts independent streams on one QUIC/UDP connection.',
            uk: 'Три моделі зʼєднання, той самий клієнт і сервер. HTTP/1.1 відкриває кілька TCP-зʼєднань; HTTP/2 мультиплексує стріми над одним; HTTP/3 кладе незалежні стріми на одне QUIC/UDP-зʼєднання.',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Property', uk: 'Властивість' },
            { en: 'TCP', uk: 'TCP' },
            { en: 'UDP', uk: 'UDP' },
            { en: 'QUIC (over UDP)', uk: 'QUIC (над UDP)' },
          ],
          rows: [
            [
              { en: 'Delivery', uk: 'Доставка' },
              { en: 'Reliable, in-order', uk: 'Надійна, у порядку' },
              { en: 'Best-effort, unordered', uk: 'Best-effort, без порядку' },
              { en: 'Reliable per-stream', uk: 'Надійна per-stream' },
            ],
            [
              { en: 'Handshake', uk: 'Handshake' },
              { en: '1 RTT + TLS 1 RTT', uk: '1 RTT + TLS 1 RTT' },
              { en: 'None', uk: 'Немає' },
              { en: '1 RTT (0-RTT resume) — TLS built in', uk: '1 RTT (0-RTT resume) — TLS всередині' },
            ],
            [
              { en: 'Head-of-line blocking', uk: 'Head-of-line blocking' },
              { en: 'Yes, per connection', uk: 'Так, на зʼєднання' },
              { en: 'N/A (no ordering)', uk: 'N/A (без порядку)' },
              { en: 'No — streams independent', uk: 'Ні — стріми незалежні' },
            ],
            [
              { en: 'Carries', uk: 'Несе' },
              { en: 'HTTP/1.1, HTTP/2', uk: 'HTTP/1.1, HTTP/2' },
              { en: 'DNS, media, games', uk: 'DNS, медіа, ігри' },
              { en: 'HTTP/3', uk: 'HTTP/3' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Handshake round-trips are latency you pay before byte one', uk: 'Round-trip-и handshake — це latency до першого байта' },
          md: {
            en: 'On a fresh connection the handshakes dominate small-request latency. TLS 1.3 halved the TLS cost to 1-RTT; QUIC folds transport + crypto into a single 1-RTT setup (0-RTT on resumption). This is why **connection reuse** (later in this module) is the highest-leverage tuning you have — and why a serverless function that opens a new TLS connection per invocation feels slow even when the handler is fast.',
            uk: 'На свіжому зʼєднанні handshake-и домінують у latency малих запитів. TLS 1.3 урізав вартість TLS до 1-RTT; QUIC зливає транспорт + крипто в єдиний 1-RTT (0-RTT на resumption). Тому **повторне використання зʼєднання** (далі в модулі) — найважливіше налаштування, і тому serverless-функція, що відкриває нове TLS-зʼєднання на кожен виклик, здається повільною навіть за швидкого хендлера.',
          },
        },
      ],
    },
    // ── T2 · HTTP/1.1 — the baseline ─────────────────────────────────────────
    {
      id: 'http1-1',
      title: { en: 'HTTP/1.1 — the baseline', uk: 'HTTP/1.1 — базова лінія' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'HTTP/1.1 (RFC 9112) is a **text** protocol that carries **one response at a time per connection**. Persistent connections (keep-alive) let you reuse a socket across requests, but the responses still come back strictly in order. The spec allows **pipelining** — firing several requests without waiting — yet in practice it is unusable: one slow response blocks the rest (head-of-line blocking) and buggy intermediaries mishandle it, so browsers disabled it. Their workaround was to open about **six parallel connections per host** — and, when that wasn’t enough, to shard assets across multiple domains to open even more.',
            uk: 'HTTP/1.1 (RFC 9112) — **текстовий** протокол, що несе **одну відповідь за раз на зʼєднання**. Persistent connections (keep-alive) дають перевикористати сокет між запитами, але відповіді все одно повертаються строго в порядку. Специфікація дозволяє **pipelining** — надіслати кілька запитів без очікування — але на практиці це непридатне: одна повільна відповідь блокує решту (head-of-line blocking), а криві проміжні вузли ламають його, тож браузери його вимкнули. Їхній обхід — відкрити близько **шести паралельних зʼєднань на хост** — а коли й цього мало, шардити ассети по кількох доменах, щоб відкрити ще більше.',
          },
        },
        {
          kind: 'code',
          lang: 'http',
          code: `GET /articles/42 HTTP/1.1
Host: api.example.com
Accept: application/json

HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 51

{"id":42,"title":"Transport","tags":["http","tcp"]}`,
          note: {
            en: 'HTTP/1.1 is human-readable text: a request line, headers, a blank line, a body. HTTP/2 and /3 carry the same semantics in a binary framing you can’t eyeball.',
            uk: 'HTTP/1.1 — читабельний текст: рядок запиту, заголовки, порожній рядок, тіло. HTTP/2 і /3 несуть ту саму семантику в binary-фреймінгу, який оком не роздивишся.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'The “6 connections” cap is the constraint HTTP/2 was built to remove', uk: '«6 зʼєднань» — обмеження, яке HTTP/2 і прибирає' },
          md: {
            en: 'Everything HTTP/2 does — multiplexing, header compression, dropping domain sharding — is a direct answer to “one response per connection, six connections max”. When you see advice like *inline small assets* or *shard across CDNs*, it is HTTP/1.1-era advice that HTTP/2 makes obsolete (and can even make slower).',
            uk: 'Усе, що робить HTTP/2 — multiplexing, стиснення заголовків, відмова від domain sharding — це пряма відповідь на «одна відповідь на зʼєднання, максимум шість». Коли бачиш поради на кшталт *інлайнити малі ассети* чи *шардити по CDN*, це поради епохи HTTP/1.1, які HTTP/2 робить зайвими (і навіть повільнішими).',
          },
        },
      ],
    },
    // ── T3 · HTTP/2 & multiplexing (the sim) ─────────────────────────────────
    {
      id: 'http2-multiplexing',
      title: { en: 'HTTP/2 & multiplexing', uk: 'HTTP/2 і multiplexing' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'HTTP/2 (RFC 9113) keeps HTTP’s semantics but changes the wire: a **binary framing** in which one TCP connection carries many concurrent **streams**, each an independent, id-tagged sequence of frames. That single change removes the per-connection queue — one connection now serves all your requests at once, so the six-connection hack and domain sharding disappear. It adds **HPACK** (RFC 7541) header compression, which shrinks repeated headers (cookies, user-agent) to a few bytes. **Server push** shipped with HTTP/2 but proved a net negative and was removed from browsers (Chrome, 2022); resource **priorities** moved from HTTP/2’s brittle dependency tree to the simpler Extensible Priorities scheme (RFC 9218).',
            uk: 'HTTP/2 (RFC 9113) зберігає семантику HTTP, але змінює дріт: **binary-фреймінг**, де одне TCP-зʼєднання несе багато паралельних **стрімів**, кожен — незалежна послідовність фреймів зі своїм id. Ця єдина зміна прибирає чергу на зʼєднанні — одне зʼєднання тепер обслуговує всі запити одразу, тож хак із шістьма зʼєднаннями й domain sharding зникають. Додає **HPACK** (RFC 7541) — стиснення заголовків, що зменшує повторювані заголовки (cookies, user-agent) до кількох байтів. **Server push** був у HTTP/2, але виявився шкідливим і прибраний із браузерів (Chrome, 2022); **пріоритети** ресурсів перейшли з крихкого дерева залежностей HTTP/2 на простіший Extensible Priorities (RFC 9218).',
          },
        },
        {
          kind: 'sim',
          sim: 'http-multiplexing',
          caption: {
            en: 'Switch HTTP/1.1 → HTTP/2 and watch the per-connection queue collapse into concurrent streams. Then turn on “Lose a packet” to see the catch — the next topic.',
            uk: 'Перемкни HTTP/1.1 → HTTP/2 і дивись, як черга на зʼєднанні згортається в паралельні стріми. Потім увімкни «Втратити пакет», щоб побачити підступ — наступна тема.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'HTTP/2 fixed the app-level queue, not the transport one', uk: 'HTTP/2 полагодив чергу на рівні застосунку, не транспорту' },
          md: {
            en: 'Multiplexing removes head-of-line blocking *at the HTTP layer* — but all those streams still share one **TCP** byte-stream, and TCP knows nothing about streams. A single lost segment makes TCP hold back every byte behind it, stalling *all* streams until the retransmit lands. That residual transport-level HOL blocking is precisely what HTTP/3 was created to fix.',
            uk: 'Multiplexing прибирає head-of-line blocking *на рівні HTTP* — але всі ті стріми досі ділять один **TCP** байт-стрім, а TCP нічого не знає про стріми. Один втрачений сегмент змушує TCP тримати кожен байт за ним, зупиняючи *всі* стріми до retransmit. Саме цей залишковий HOL на рівні транспорту й покликаний полагодити HTTP/3.',
          },
        },
      ],
    },
    // ── T4 · HTTP/3 & QUIC ───────────────────────────────────────────────────
    {
      id: 'http3-quic',
      title: { en: 'HTTP/3 & QUIC', uk: 'HTTP/3 і QUIC' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'HTTP/3 (RFC 9114) keeps the same HTTP semantics again but swaps the transport: it runs over **QUIC** (RFC 9000), a protocol built on **UDP** that provides its own streams, reliability, and congestion control, with **TLS 1.3 built in** (RFC 9001). Because streams are now a *transport-layer* concept, each has **independent loss recovery** — a lost packet stalls only the one stream it belonged to, not the others. QUIC also sets up faster (1-RTT, 0-RTT on resumption) and supports **connection migration**: a connection id survives an IP change, so switching Wi-Fi→cellular doesn’t drop it. Header compression is **QPACK** (RFC 9204), a redesign of HPACK that tolerates QUIC’s out-of-order delivery.',
            uk: 'HTTP/3 (RFC 9114) знову зберігає ту саму семантику HTTP, але міняє транспорт: працює над **QUIC** (RFC 9000) — протоколом на **UDP**, що дає власні стріми, надійність і congestion control, зі **вбудованим TLS 1.3** (RFC 9001). Оскільки стріми тепер поняття *транспортного рівня*, кожен має **незалежне відновлення втрат** — втрачений пакет зупиняє лише свій стрім, а не інші. QUIC також швидше встановлюється (1-RTT, 0-RTT на resumption) і підтримує **connection migration**: connection id переживає зміну IP, тож перемикання Wi-Fi→cellular його не рве. Стиснення заголовків — **QPACK** (RFC 9204), переробка HPACK під out-of-order доставку QUIC.',
          },
        },
        {
          kind: 'compare',
          a: { en: 'HTTP/2 (over TCP)', uk: 'HTTP/2 (над TCP)' },
          b: { en: 'HTTP/3 (over QUIC)', uk: 'HTTP/3 (над QUIC)' },
          rows: [
            [
              { en: 'Streams live at', uk: 'Стріми живуть на' },
              { en: 'The HTTP layer, above one TCP stream', uk: 'Рівні HTTP, над одним TCP-стрімом' },
              { en: 'The transport layer, inside QUIC', uk: 'Транспортному рівні, всередині QUIC' },
            ],
            [
              { en: 'A lost packet', uk: 'Втрачений пакет' },
              { en: 'Stalls every stream (TCP HOL)', uk: 'Зупиняє всі стріми (TCP HOL)' },
              { en: 'Stalls only its own stream', uk: 'Зупиняє лише свій стрім' },
            ],
            [
              { en: 'Setup', uk: 'Встановлення' },
              { en: 'TCP + TLS handshakes', uk: 'TCP + TLS handshake-и' },
              { en: '1-RTT, 0-RTT resume', uk: '1-RTT, 0-RTT resume' },
            ],
            [
              { en: 'IP change', uk: 'Зміна IP' },
              { en: 'Connection drops', uk: 'Зʼєднання рветься' },
              { en: 'Migrates (connection id)', uk: 'Мігрує (connection id)' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'QUIC lives in user space, over UDP — power with caveats', uk: 'QUIC живе в user space, над UDP — сила з застереженнями' },
          md: {
            en: 'QUIC is implemented in the application/library, not the OS kernel, so it evolves without OS upgrades — but it costs more CPU per byte and some networks throttle or block UDP. Clients therefore keep HTTP/2 as a fallback. For most APIs you don’t choose HTTP/3 in code; you enable it at the edge (CDN/load balancer) and it upgrades transparently. The decision that reaches your code is usually *HTTP/1.1 vs HTTP/2* for things like gRPC.',
            uk: 'QUIC реалізовано в застосунку/бібліотеці, не в ядрі ОС, тож він розвивається без апгрейдів ОС — але коштує більше CPU на байт, а деякі мережі тротлять чи блокують UDP. Тому клієнти тримають HTTP/2 як fallback. Для більшості API ти не обираєш HTTP/3 у коді; вмикаєш його на межі (CDN/load balancer), і він апгрейдиться прозоро. Рішення, що доходить до коду — зазвичай *HTTP/1.1 проти HTTP/2* для речей на кшталт gRPC.',
          },
        },
      ],
    },
    // ── T5 · Head-of-line blocking (the thread) ──────────────────────────────
    {
      id: 'head-of-line-blocking',
      title: { en: 'Head-of-line blocking', uk: 'Head-of-line blocking' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: '**Head-of-line (HOL) blocking** is the single idea that explains why three HTTP versions exist: when messages must be processed in order, the one at the front holds up everyone behind it. What changes across versions is *at which layer* the queue lives. HTTP/1.1 blocks at the **application** layer — one response per connection, so a slow response blocks its connection. HTTP/2 moved the queue down: streams don’t block each other in HTTP, but they share one **TCP** byte-stream, so a lost segment blocks them all at the **transport** layer. HTTP/3/QUIC removes it — streams recover from loss independently, so nothing waits on a packet meant for someone else.',
            uk: '**Head-of-line (HOL) blocking** — єдина ідея, що пояснює, чому існує три версії HTTP: коли повідомлення мають оброблятися в порядку, переднє тримає всіх за собою. Що змінюється між версіями — *на якому рівні* живе черга. HTTP/1.1 блокує на рівні **застосунку** — одна відповідь на зʼєднання, тож повільна відповідь блокує своє зʼєднання. HTTP/2 зсунув чергу нижче: стріми не блокують одне одного в HTTP, але ділять один **TCP** байт-стрім, тож втрачений сегмент блокує всі на **транспортному** рівні. HTTP/3/QUIC це прибирає — стріми відновлюються після втрат незалежно, тож ніхто не чекає на пакет для когось іншого.',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Version', uk: 'Версія' },
            { en: 'HOL layer', uk: 'Рівень HOL' },
            { en: 'Trigger', uk: 'Тригер' },
            { en: 'Who waits', uk: 'Хто чекає' },
          ],
          rows: [
            [
              { en: 'HTTP/1.1', uk: 'HTTP/1.1' },
              { en: 'Application', uk: 'Застосунок' },
              { en: 'A slow response', uk: 'Повільна відповідь' },
              { en: 'Requests behind it on that connection', uk: 'Запити за нею на тому зʼєднанні' },
            ],
            [
              { en: 'HTTP/2', uk: 'HTTP/2' },
              { en: 'Transport (TCP)', uk: 'Транспорт (TCP)' },
              { en: 'A lost TCP segment', uk: 'Втрачений TCP-сегмент' },
              { en: 'Every stream on the connection', uk: 'Кожен стрім на зʼєднанні' },
            ],
            [
              { en: 'HTTP/3', uk: 'HTTP/3' },
              { en: 'None (per-stream)', uk: 'Немає (per-stream)' },
              { en: 'A lost packet', uk: 'Втрачений пакет' },
              { en: 'Only that one stream', uk: 'Лише той один стрім' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Feel it in the simulator', uk: 'Відчуй це в симуляторі' },
          md: {
            en: 'Scroll up to the multiplexing simulator, pick HTTP/2, and hit **Lose a packet**: every stream’s bar grows a red retransmit tail — all of them wait. Switch to HTTP/3 and lose a packet again: only one stream stalls; the rest finish on time. The average-completion number is the metric that moves; the last-byte time barely does — the win is *tail latency for everyone else*, not the worst case.',
            uk: 'Прокрути вгору до симулятора multiplexing, обери HTTP/2 і натисни **Втратити пакет**: у кожного стріма зʼявляється червоний хвіст retransmit — чекають усі. Перемкни на HTTP/3 і втрать пакет знову: застопорюється лише один стрім; решта завершуються вчасно. Рухається саме середнє завершення; час останнього байта майже ні — виграш у *tail latency для всіх інших*, а не в найгіршому випадку.',
          },
        },
      ],
    },
    // ── T6 · Keep-alive & connection pooling ─────────────────────────────────
    {
      id: 'keep-alive-pooling',
      title: { en: 'Keep-alive & connection pooling', uk: 'Keep-alive і connection pooling' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Because handshakes are the expensive part of a small request, **reusing connections** is the highest-leverage transport tuning there is. **Keep-alive** holds a connection open so the next request skips the TCP+TLS setup; a client-side **connection pool** (an HTTP agent) keeps a set of warm sockets and hands them out. The failure mode is subtle: if your server’s `keepAliveTimeout` is *shorter* than a load balancer’s idle timeout, the LB can send a request onto a socket the server is closing → an occasional, hard-to-reproduce **502**. Set the server’s keep-alive above the LB’s idle timeout.',
            uk: 'Оскільки handshake — найдорожча частина малого запиту, **повторне використання зʼєднань** — найважливіше налаштування транспорту. **Keep-alive** тримає зʼєднання відкритим, щоб наступний запит пропустив TCP+TLS setup; клієнтський **connection pool** (HTTP agent) тримає набір теплих сокетів і роздає їх. Режим відмови підступний: якщо `keepAliveTimeout` сервера *коротший* за idle timeout балансувальника, LB може надіслати запит у сокет, який сервер закриває → випадковий, важковідтворюваний **502**. Став keep-alive сервера вищим за idle timeout LB.',
          },
        },
        {
          kind: 'code',
          lang: 'ts',
          code: `import { Agent } from 'node:https';

// Reuse sockets across requests instead of paying TCP+TLS every call.
export const agent = new Agent({ keepAlive: true, maxSockets: 50 });

// Serverless: create the client OUTSIDE the handler so warm invocations reuse it.
const http = /* your client */ createClient({ agent });
export const handler = async (event) => http.get('/things');`,
          note: {
            en: 'On AWS Lambda, clients declared outside the handler survive across warm invocations; a client (or DB pool) created inside the handler re-handshakes every call and can exhaust the upstream — the CSD-Platform pattern is RDS Proxy + init-outside-handler.',
            uk: 'На AWS Lambda клієнти, оголошені поза хендлером, переживають теплі виклики; клієнт (чи DB pool), створений усередині хендлера, робить handshake щоразу й може вичерпати upstream — патерн CSD-Platform: RDS Proxy + ініціалізація поза хендлером.',
          },
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'Connection reuse is a shared-state boundary', uk: 'Повторне використання зʼєднання — межа спільного стану' },
          md: {
            en: 'A pooled connection carries whatever the transport negotiated — TLS session, HTTP/2 stream limits, sometimes auth context on the socket. Reuse across tenants or trust domains can leak that context; keep separate pools per credential/tenant. And cap `maxSockets`: an unbounded pool trades one problem (handshake cost) for another (exhausting the upstream’s connection limit).',
            uk: 'Пульований конект несе те, що узгодив транспорт — TLS-сесію, ліміти стрімів HTTP/2, іноді auth-контекст на сокеті. Перевикористання між тенантами чи доменами довіри може злити цей контекст; тримай окремі пули на credential/tenant. І обмеж `maxSockets`: безмежний пул міняє одну проблему (вартість handshake) на іншу (вичерпання ліміту зʼєднань upstream).',
          },
        },
      ],
    },
    // ── T7 · How transport shapes the style ──────────────────────────────────
    {
      id: 'how-transport-shapes-style',
      title: { en: 'How transport shapes the style', uk: 'Як транспорт формує стиль' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The transport is the floor your style’s ceiling sits on. **gRPC requires HTTP/2** — its four call types and streaming are built directly on HTTP/2 streams, which is also why browsers (no raw HTTP/2 frame access) need **gRPC-web** and a proxy. **SSE** rides plain HTTP but is capped by HTTP/1.1’s ~6 connections per host — open a seventh event stream and it queues; over HTTP/2 that limit disappears. **WebSockets** begin as an HTTP/1.1 `Upgrade` and then leave HTTP behind entirely. **REST** runs on anything and simply inherits HTTP/2 and HTTP/3’s latency wins for free. Choose your transport before you fall in love with a style: the wire decides what the style can actually deliver.',
            uk: 'Транспорт — це підлога, на якій стоїть стеля стилю. **gRPC вимагає HTTP/2** — його чотири типи викликів і streaming збудовані просто на стрімах HTTP/2, і саме тому браузерам (без доступу до сирих HTTP/2-фреймів) потрібен **gRPC-web** і проксі. **SSE** їде на звичайному HTTP, але обмежений ~6 зʼєднаннями на хост у HTTP/1.1 — відкрий сьомий event stream, і він у черзі; над HTTP/2 цей ліміт зникає. **WebSockets** починаються як HTTP/1.1 `Upgrade`, а далі повністю лишають HTTP. **REST** працює на чому завгодно й просто безкоштовно успадковує виграші latency HTTP/2 і HTTP/3. Обирай транспорт до того, як закохатися в стиль: дріт вирішує, що стиль насправді може дати.',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Style', uk: 'Стиль' },
            { en: 'Transport dependency', uk: 'Залежність від транспорту' },
          ],
          rows: [
            [
              { en: 'gRPC', uk: 'gRPC' },
              { en: 'Requires HTTP/2; browsers need gRPC-web + proxy', uk: 'Вимагає HTTP/2; браузерам потрібен gRPC-web + проксі' },
            ],
            [
              { en: 'SSE', uk: 'SSE' },
              { en: 'Any HTTP, but HTTP/1.1’s 6-connection cap bites', uk: 'Будь-який HTTP, але кусає ліміт 6 зʼєднань HTTP/1.1' },
            ],
            [
              { en: 'WebSockets', uk: 'WebSockets' },
              { en: 'HTTP/1.1 Upgrade, then its own framed protocol', uk: 'HTTP/1.1 Upgrade, далі власний фреймований протокол' },
            ],
            [
              { en: 'REST / GraphQL', uk: 'REST / GraphQL' },
              { en: 'Transport-agnostic; free wins from HTTP/2 & 3', uk: 'Transport-agnostic; безкоштовні виграші від HTTP/2 і 3' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'The classic SSE trap: six streams and no more', uk: 'Класична пастка SSE: шість стрімів і не більше' },
          md: {
            en: 'A dashboard that opens one SSE stream per widget hits HTTP/1.1’s per-host connection cap and the seventh stream silently waits — the app looks “randomly frozen”. The fixes are exactly transport-shaped: serve over HTTP/2 (multiplexed, cap gone), or multiplex your events onto a single stream. It’s a perfect example of a transport limit masquerading as an application bug.',
            uk: 'Дашборд, що відкриває один SSE-стрім на віджет, впирається в ліміт зʼєднань на хост HTTP/1.1, і сьомий стрім тихо чекає — застосунок виглядає «випадково завислим». Виправлення саме транспортні: віддавай через HTTP/2 (мультиплексовано, ліміту нема) або мультиплексуй події в один стрім. Ідеальний приклад транспортного ліміту, що прикидається багом застосунку.',
          },
        },
      ],
    },
  ],
  keyPoints: [
    { en: 'HTTP/1.1 sends one response per connection, so browsers open ~6 connections per host — the constraint later versions remove.', uk: 'HTTP/1.1 шле одну відповідь на зʼєднання, тож браузери відкривають ~6 зʼєднань на хост — обмеження, яке прибирають наступні версії.' },
    { en: 'HTTP/2 multiplexes many streams over one TCP connection, killing the app-level queue — but all streams share one TCP byte-stream.', uk: 'HTTP/2 мультиплексує багато стрімів над одним TCP-зʼєднанням, прибираючи чергу на рівні застосунку — але всі стріми ділять один TCP байт-стрім.' },
    { en: 'A lost packet stalls every HTTP/2 stream (TCP head-of-line blocking); HTTP/3 over QUIC recovers streams independently, so only one stalls.', uk: 'Втрачений пакет зупиняє кожен стрім HTTP/2 (TCP head-of-line blocking); HTTP/3 над QUIC відновлює стріми незалежно, тож застопорюється лише один.' },
    { en: 'QUIC folds transport + TLS 1.3 into a 1-RTT (0-RTT resume) handshake over UDP and migrates across IP changes.', uk: 'QUIC зливає транспорт + TLS 1.3 в 1-RTT (0-RTT resume) handshake над UDP і мігрує через зміни IP.' },
    { en: 'Connection reuse (keep-alive + pooling) is the highest-leverage tuning; keepAliveTimeout below an LB idle timeout causes sporadic 502s.', uk: 'Повторне використання зʼєднань (keep-alive + pooling) — найважливіше налаштування; keepAliveTimeout нижчий за idle timeout LB дає випадкові 502.' },
    { en: 'The transport constrains the style: gRPC needs HTTP/2; SSE hits HTTP/1.1’s 6-connection cap; WebSockets start as an HTTP/1.1 upgrade.', uk: 'Транспорт обмежує стиль: gRPC потребує HTTP/2; SSE впирається в ліміт 6 зʼєднань HTTP/1.1; WebSockets стартують як HTTP/1.1 upgrade.' },
  ],
  pitfalls: [
    {
      title: { en: 'Carrying HTTP/1.1-era tricks into HTTP/2', uk: 'Тягнути трюки епохи HTTP/1.1 у HTTP/2' },
      body: {
        en: 'Domain sharding, sprite sheets, and inlining were workarounds for the 6-connection cap. Under HTTP/2 they *hurt*: sharding forces extra connections and defeats multiplexing and header compression. Measure before importing old advice.',
        uk: 'Domain sharding, спрайти й інлайнинг були обходами ліміту 6 зʼєднань. Під HTTP/2 вони *шкодять*: sharding змушує зайві зʼєднання й ламає multiplexing і стиснення заголовків. Виміряй, перш ніж тягнути старі поради.',
      },
    },
    {
      title: { en: 'Expecting HTTP/2 to end all head-of-line blocking', uk: 'Чекати, що HTTP/2 прибере весь head-of-line blocking' },
      body: {
        en: 'HTTP/2 ends the *application-level* queue but not the *transport-level* one — on a lossy network its single TCP connection can perform worse than HTTP/1.1’s several. That residual TCP HOL is the whole reason HTTP/3 moved to QUIC.',
        uk: 'HTTP/2 прибирає чергу на *рівні застосунку*, але не на *рівні транспорту* — на мережі з втратами його єдине TCP-зʼєднання може бути гіршим за кілька в HTTP/1.1. Цей залишковий TCP HOL — уся причина переходу HTTP/3 на QUIC.',
      },
    },
    {
      title: { en: 'Opening a new connection per request in serverless', uk: 'Відкривати нове зʼєднання на запит у serverless' },
      body: {
        en: 'A DB client or HTTP agent created inside a Lambda handler re-handshakes on every invocation and can exhaust the upstream’s connection limit under load. Initialise clients outside the handler and pool them (RDS Proxy for databases).',
        uk: 'DB-клієнт чи HTTP agent, створений усередині Lambda-хендлера, робить handshake на кожен виклик і може вичерпати ліміт зʼєднань upstream під навантаженням. Ініціалізуй клієнти поза хендлером і пуль їх (RDS Proxy для БД).',
      },
    },
  ],
  interview: [
    {
      q: { en: 'HTTP/2 multiplexes over one connection — so why can it be slower than HTTP/1.1 on a bad network?', uk: 'HTTP/2 мультиплексує над одним зʼєднанням — то чому він буває повільнішим за HTTP/1.1 на поганій мережі?' },
      a: {
        en: 'Because multiplexing solves head-of-line blocking at the HTTP layer, not the transport. All HTTP/2 streams ride one TCP connection, and TCP guarantees in-order delivery of the whole byte-stream. When a packet is lost, TCP holds back every byte behind it until the retransmit arrives, so *all* streams stall — one loss punishes everyone. HTTP/1.1 with six independent TCP connections isolates a loss to one connection, so on a lossy link it can beat HTTP/2. HTTP/3 fixes this by moving streams into QUIC, where each stream has independent loss recovery, so a lost packet stalls only its own stream.',
        uk: 'Бо multiplexing розвʼязує head-of-line blocking на рівні HTTP, а не транспорту. Усі стріми HTTP/2 їдуть на одному TCP-зʼєднанні, а TCP гарантує впорядковану доставку всього байт-стріму. Коли пакет втрачено, TCP тримає кожен байт за ним до retransmit, тож *усі* стріми стопоряться — одна втрата карає всіх. HTTP/1.1 із шістьма незалежними TCP-зʼєднаннями ізолює втрату до одного зʼєднання, тож на мережі з втратами може перемогти HTTP/2. HTTP/3 це виправляє, переносячи стріми в QUIC, де кожен має незалежне відновлення втрат, тож втрачений пакет стопорить лише свій стрім.',
      },
      level: 'senior',
    },
    {
      q: { en: 'You see sporadic 502s behind an ALB under steady traffic. Where do you look first?', uk: 'Ти бачиш випадкові 502 за ALB під рівним трафіком. Куди дивишся першим?' },
      a: {
        en: 'A classic cause is a keep-alive race: the app server’s `keepAliveTimeout` is shorter than the load balancer’s idle timeout, so the LB reuses a socket the server has just decided to close, and the request dies as a 502. The fix is to set the server’s keep-alive (and headers timeout) *above* the ALB idle timeout so the LB always closes first. I’d confirm by correlating the 502 rate with connection age, then check keep-alive settings on both sides before suspecting the app. It’s a transport-level misconfiguration that looks like an application error.',
        uk: 'Класична причина — гонка keep-alive: `keepAliveTimeout` app-сервера коротший за idle timeout балансувальника, тож LB перевикористовує сокет, який сервер щойно вирішив закрити, і запит помирає як 502. Виправлення — поставити keep-alive сервера (і headers timeout) *вище* за idle timeout ALB, щоб LB завжди закривав першим. Підтвердив би, скорелювавши частоту 502 із віком зʼєднання, потім перевірив keep-alive з обох боків, перш ніж підозрювати застосунок. Це misconfiguration рівня транспорту, що виглядає як помилка застосунку.',
      },
      level: 'senior',
    },
  ],
  seeAlso: ['m2-decision-axes', 'm4-data-formats', 'm5-rest', 'm10-grpc', 'm13-sse', 'm12-websockets', 'm23-observability'],
  sources: [
    { title: 'RFC 9110 — HTTP Semantics', url: 'https://www.rfc-editor.org/rfc/rfc9110.html' },
    { title: 'RFC 9112 — HTTP/1.1', url: 'https://www.rfc-editor.org/rfc/rfc9112.html' },
    { title: 'RFC 9113 — HTTP/2 (obsoletes RFC 7540)', url: 'https://www.rfc-editor.org/rfc/rfc9113.html' },
    { title: 'RFC 9114 — HTTP/3', url: 'https://www.rfc-editor.org/rfc/rfc9114.html' },
    { title: 'RFC 9000 — QUIC: A UDP-Based Multiplexed and Secure Transport', url: 'https://www.rfc-editor.org/rfc/rfc9000.html' },
    { title: 'MDN — Head-of-line blocking (glossary)', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Head_of_line_blocking' },
    { title: 'MDN — Connection management in HTTP/1.x', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Connection_management_in_HTTP_1.x' },
  ],
};
