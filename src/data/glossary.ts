import type { Localized } from './types';

/*
 * Glossary — core cross-style terms, bilingual. Technical terms stay English (the `term`); only the
 * `def` explanation follows the language toggle. Grows as modules are authored.
 */
export type GlossaryEntry = { term: string; def: Localized; seeAlso?: string[] };

export const glossary: GlossaryEntry[] = [
  {
    term: 'REST',
    def: {
      en: 'An architectural style: named resources, a uniform interface over HTTP methods, stateless requests, and cacheable responses.',
      uk: 'Архітектурний стиль: іменовані ресурси, uniform interface над HTTP-методами, stateless-запити й кешовані відповіді.',
    },
    seeAlso: ['HATEOAS', 'Idempotent'],
  },
  {
    term: 'Idempotent',
    def: {
      en: 'A request that has the same effect whether sent once or many times (GET, PUT, DELETE). Makes retries safe.',
      uk: 'Запит, що має однаковий ефект, надісланий раз чи багато разів (GET, PUT, DELETE). Робить retries безпечними.',
    },
    seeAlso: ['Safe method', 'Idempotency key'],
  },
  {
    term: 'Safe method',
    def: {
      en: 'A method that does not change server state (GET, HEAD, OPTIONS). Safe methods are also idempotent.',
      uk: 'Метод, що не змінює стан сервера (GET, HEAD, OPTIONS). Safe-методи також idempotent.',
    },
  },
  {
    term: 'HATEOAS',
    def: {
      en: 'Hypermedia As The Engine Of Application State — responses embed links telling the client what it can do next. Level 3 of the Richardson Maturity Model.',
      uk: 'Hypermedia As The Engine Of Application State — відповіді містять лінки, що кажуть клієнту, що робити далі. Рівень 3 Richardson Maturity Model.',
    },
  },
  {
    term: 'ETag',
    def: {
      en: 'An opaque validator for a resource version. Enables conditional requests (If-None-Match → 304 Not Modified) and optimistic concurrency (If-Match).',
      uk: 'Непрозорий валідатор версії ресурсу. Вмикає conditional requests (If-None-Match → 304 Not Modified) і оптимістичну конкурентність (If-Match).',
    },
    seeAlso: ['Conditional request'],
  },
  {
    term: 'Conditional request',
    def: {
      en: 'A request with a precondition header (If-None-Match, If-Modified-Since) so the server can answer 304 or reject a stale write.',
      uk: 'Запит із precondition-заголовком (If-None-Match, If-Modified-Since), щоб сервер міг відповісти 304 або відхилити застарілий запис.',
    },
  },
  {
    term: 'Content negotiation',
    def: {
      en: 'The client states preferences (Accept, Accept-Language) and the server picks a representation, echoing the choice in Content-Type + Vary.',
      uk: 'Клієнт зазначає вподобання (Accept, Accept-Language), а сервер обирає представлення, повертаючи вибір у Content-Type + Vary.',
    },
  },
  {
    term: 'Richardson Maturity Model',
    def: {
      en: 'A four-level ladder (0–3) grading how "RESTful" an HTTP API is: from a single RPC endpoint, to resources, to HTTP verbs, to hypermedia (HATEOAS).',
      uk: 'Чотирирівнева драбина (0–3), що оцінює, наскільки HTTP API «RESTful»: від єдиного RPC-endpoint до ресурсів, до HTTP-дієслів, до hypermedia (HATEOAS).',
    },
  },
  {
    term: 'gRPC',
    def: {
      en: 'A contract-first RPC framework: Protocol Buffers as the IDL/wire format over HTTP/2, with unary and streaming call types and built-in deadlines.',
      uk: 'Contract-first RPC-фреймворк: Protocol Buffers як IDL/wire-формат над HTTP/2, з unary та streaming викликами і вбудованими deadlines.',
    },
    seeAlso: ['Protocol Buffers'],
  },
  {
    term: 'Protocol Buffers',
    def: {
      en: 'A compact, schema-driven binary serialization format (protobuf). Fields are tag-numbered so the schema can evolve without breaking the wire.',
      uk: 'Компактний, schema-driven бінарний формат серіалізації (protobuf). Поля мають tag-номери, тож schema еволюціонує без поломки wire.',
    },
  },
  {
    term: 'GraphQL',
    def: {
      en: 'A query language and runtime over a typed schema: the client requests exactly the fields it needs from a single endpoint; resolvers fetch them.',
      uk: 'Мова запитів і runtime над типізованою schema: клієнт бере саме потрібні поля з єдиного endpoint; resolvers їх дістають.',
    },
    seeAlso: ['N+1 problem'],
  },
  {
    term: 'N+1 problem',
    def: {
      en: 'One query for a list plus one query per item — an accidental fan-out of database calls. Batched with a DataLoader that coalesces per-item lookups.',
      uk: 'Один запит на список плюс по одному на елемент — випадковий fan-out викликів до БД. Батчиться через DataLoader, що склеює per-item звернення.',
    },
    seeAlso: ['DataLoader', 'Resolver'],
  },
  {
    term: 'Resolver',
    def: {
      en: 'The function behind a GraphQL field — (obj, args, context, info) → value. Execution walks the query tree calling a resolver per field, which is what makes the N+1 problem easy to introduce.',
      uk: 'Функція за GraphQL-полем — (obj, args, context, info) → значення. Виконання йде деревом query, кличучи resolver на кожне поле, — саме тому легко отримати проблему N+1.',
    },
    seeAlso: ['N+1 problem', 'DataLoader'],
  },
  {
    term: 'DataLoader',
    def: {
      en: 'A per-request utility that batches every key loaded within one event-loop tick into a single query and caches them, collapsing GraphQL’s N+1 fan-out to 1 + 1.',
      uk: 'Per-request утиліта, що батчить кожен ключ, завантажений у межах одного tick event loop, в один запит і кешує їх, згортаючи N+1 fan-out GraphQL до 1 + 1.',
    },
    seeAlso: ['N+1 problem'],
  },
  {
    term: 'Federation',
    def: {
      en: 'Composing several independently owned GraphQL subgraphs into one supergraph that a router plans queries across — one graph to the client, many services behind it.',
      uk: 'Композиція кількох незалежних GraphQL-subgraph-ів в один supergraph, по якому router планує запити — один граф для клієнта, багато сервісів за ним.',
    },
  },
  {
    term: 'WebSocket',
    def: {
      en: 'A persistent, full-duplex TCP connection established by upgrading an HTTP request; both peers send framed messages until either closes.',
      uk: 'Постійне, full-duplex TCP-зʼєднання, створене апгрейдом HTTP-запиту; обидва peers шлють framed-повідомлення, доки хтось не закриє.',
    },
    seeAlso: ['Full-duplex', 'CSWSH', 'Subprotocol'],
  },
  {
    term: 'Full-duplex',
    def: {
      en: 'A channel where both ends can send at the same time. WebSockets are full-duplex; SSE is one-way (server→client) and REST is request/response.',
      uk: 'Канал, де обидва кінці можуть слати водночас. WebSockets full-duplex; SSE односторонній (server→client), а REST — request/response.',
    },
    seeAlso: ['WebSocket'],
  },
  {
    term: 'Subprotocol',
    def: {
      en: 'An application protocol negotiated via the Sec-WebSocket-Protocol header on top of the raw WebSocket pipe — e.g. graphql-transport-ws or STOMP. The server picks exactly one.',
      uk: 'Прикладний протокол, узгоджений через заголовок Sec-WebSocket-Protocol поверх сирого WebSocket-каналу — напр. graphql-transport-ws чи STOMP. Сервер обирає рівно один.',
    },
    seeAlso: ['WebSocket'],
  },
  {
    term: 'CSWSH',
    def: {
      en: 'Cross-Site WebSocket Hijacking — a CSRF on the WebSocket handshake: because CORS does not gate WebSockets, cookie-only auth lets any origin open an authenticated socket. Defend with an Origin allowlist + a per-connection token.',
      uk: 'Cross-Site WebSocket Hijacking — CSRF на рукостисканні WebSocket: оскільки CORS не гейтить WebSockets, автентифікація лише через cookie дозволяє будь-якому origin відкрити автентифікований сокет. Захист — Origin allowlist + per-connection токен.',
    },
    seeAlso: ['WebSocket'],
  },
  {
    term: 'SSE',
    def: {
      en: 'Server-Sent Events — a one-way text/event-stream from server to browser over HTTP, with automatic reconnect and Last-Event-ID resume.',
      uk: 'Server-Sent Events — односторонній text/event-stream від сервера до браузера через HTTP, з автоперепідключенням і resume через Last-Event-ID.',
    },
    // CHANGED (s9): cross-link the new Last-Event-ID entry.
    seeAlso: ['Last-Event-ID', 'WebSocket'],
  },
  // CHANGED (s9): SSE + webhook-reliability terms authored with m13/m15.
  {
    term: 'Last-Event-ID',
    def: {
      en: 'The request header EventSource sends on reconnect, carrying the last id: it processed — the server’s cue to resume the stream from that point instead of restarting.',
      uk: 'Заголовок запиту, який EventSource шле при reconnect, несучи останній оброблений id:, — сигнал серверу відновити потік з того місця, а не почати заново.',
    },
    seeAlso: ['SSE'],
  },
  {
    term: 'HMAC',
    def: {
      en: 'Hash-based Message Authentication Code (RFC 2104) — a keyed hash over a message proving it came from a holder of the shared secret. Webhook signatures are typically HMAC-SHA256 over the raw body (plus id/timestamp).',
      uk: 'Hash-based Message Authentication Code (RFC 2104) — хеш із ключем над повідомленням, що доводить походження від власника спільного секрету. Підписи webhook — зазвичай HMAC-SHA256 над сирим тілом (плюс id/timestamp).',
    },
    seeAlso: ['Webhook'],
  },
  {
    term: 'At-least-once delivery',
    def: {
      en: 'The delivery promise where nothing is lost but retries may duplicate: a lost ack means re-delivery. The consumer converts it to an exactly-once EFFECT by deduplicating on an idempotency key.',
      uk: 'Обіцянка доставки, де ніщо не губиться, але retries можуть дублювати: загублений ack означає передоставку. Consumer перетворює її на exactly-once ЕФЕКТ дедуплікацією за idempotency key.',
    },
    seeAlso: ['Webhook', 'Idempotency key'],
  },
  {
    term: 'Dead-letter queue',
    def: {
      en: 'Where deliveries land after the retry budget is exhausted — inspectable, alertable, and redeliverable once the endpoint is fixed, instead of silently dropped.',
      uk: 'Куди потрапляють доставки після вичерпання бюджету retries — їх видно, на них алертять і їх можна передоставити після ремонту endpoint-а, замість тихого відкидання.',
    },
    seeAlso: ['Webhook', 'At-least-once delivery'],
  },
  {
    term: 'WebRTC',
    def: {
      en: 'A browser API for peer-to-peer media and data. Signaling exchanges SDP offers/answers; ICE with STUN/TURN traverses NAT; DTLS/SRTP secure it.',
      uk: 'Браузерний API для peer-to-peer медіа й даних. Signaling обмінює SDP offer/answer; ICE зі STUN/TURN проходить NAT; DTLS/SRTP захищають.',
    },
    seeAlso: ['ICE', 'Signaling'],
  },
  {
    term: 'ICE',
    def: {
      en: 'Interactive Connectivity Establishment — the procedure that gathers candidate addresses (via STUN/TURN) and picks a working path between two peers.',
      uk: 'Interactive Connectivity Establishment — процедура, що збирає candidate-адреси (через STUN/TURN) і обирає робочий шлях між двома peers.',
    },
    // CHANGED (s8): cross-link the new STUN/TURN entries.
    seeAlso: ['STUN', 'TURN'],
  },
  {
    term: 'Signaling',
    def: {
      en: 'The out-of-band channel (often WebSocket) two WebRTC peers use to exchange session descriptions and candidates before the direct connection forms.',
      uk: 'Позасмуговий канал (часто WebSocket), яким два WebRTC-peers обмінюються session descriptions і candidates до утворення прямого зʼєднання.',
    },
    // CHANGED (s8): cross-link SDP now that m14 is authored.
    seeAlso: ['SDP', 'WebRTC'],
  },
  // CHANGED (s8): WebRTC terms authored with m14.
  {
    term: 'SDP',
    def: {
      en: 'Session Description Protocol — the text blob an offer/answer exchanges: media sections, codecs, ICE credentials, and the DTLS fingerprint. Move it opaquely; don’t edit it.',
      uk: 'Session Description Protocol — текстовий blob, яким обмінюється offer/answer: медіа-секції, кодеки, ICE-креденшели та DTLS-fingerprint. Переноси його непрозоро; не редагуй.',
    },
    seeAlso: ['Signaling', 'WebRTC'],
  },
  {
    term: 'STUN',
    def: {
      en: 'Session Traversal Utilities for NAT — a tiny “what address do you see me as?” service that yields server-reflexive (srflx) candidates and powers ICE connectivity checks.',
      uk: 'Session Traversal Utilities for NAT — крихітний сервіс «якою адресою ти мене бачиш?», що дає server-reflexive (srflx) candidates і живить ICE-перевірки звʼязності.',
    },
    seeAlso: ['ICE', 'TURN'],
  },
  {
    term: 'TURN',
    def: {
      en: 'Traversal Using Relays around NAT — a relay peers fall back to when no direct pair works (symmetric NAT, blocked UDP). It forwards DTLS ciphertext it cannot read — costing bandwidth, not confidentiality.',
      uk: 'Traversal Using Relays around NAT — relay, на який peers відкочуються, коли жодна пряма пара не працює (симетричний NAT, заблокований UDP). Він пересилає DTLS-шифротекст, який не може прочитати, — коштує трафік, не конфіденційність.',
    },
    seeAlso: ['ICE', 'STUN'],
  },
  {
    term: 'Data channel',
    def: {
      en: 'WebRTC’s byte pipe: SCTP over DTLS between peers, with per-channel delivery knobs (ordered/unordered, reliable/lossy) — from TCP-like to UDP-like on one connection.',
      uk: 'Байтовий канал WebRTC: SCTP через DTLS між peers, із ручками доставки на канал (ordered/unordered, reliable/lossy) — від TCP-подібного до UDP-подібного на одному зʼєднанні.',
    },
    seeAlso: ['WebRTC', 'Full-duplex'],
  },
  {
    term: 'Webhook',
    def: {
      en: 'A user-registered callback URL the provider POSTs to when an event occurs — a "reverse API". Delivery is typically at-least-once with retries.',
      uk: 'Зареєстрований користувачем callback-URL, на який провайдер POST-ить при події — «зворотний API». Доставка зазвичай at-least-once із retries.',
    },
    seeAlso: ['Idempotency key'],
  },
  {
    term: 'Idempotency key',
    def: {
      en: 'A client-supplied unique id on a mutating request so the server can detect and collapse duplicate retries into one effect.',
      uk: 'Наданий клієнтом унікальний id на мутуючому запиті, щоб сервер розпізнав і згорнув дублікати retries в один ефект.',
    },
  },
  {
    term: 'Problem Details',
    def: {
      en: 'RFC 9457 — a standard JSON error shape (type, title, status, detail, instance) so HTTP APIs need not invent a new error format each time.',
      uk: 'RFC 9457 — стандартна JSON-форма помилки (type, title, status, detail, instance), щоб HTTP API не вигадували новий формат щоразу.',
    },
  },
  {
    term: 'HTTP/2',
    def: {
      en: 'A binary, multiplexed HTTP version: many concurrent streams share one TCP connection, removing HTTP/1.1 head-of-line blocking at the application layer.',
      uk: 'Бінарна, мультиплексована версія HTTP: багато паралельних streams на одному TCP-зʼєднанні, прибирає HTTP/1.1 head-of-line blocking на рівні застосунку.',
    },
    seeAlso: ['HTTP/3'],
  },
  {
    term: 'HTTP/3',
    def: {
      en: 'HTTP over QUIC (UDP): per-stream flow control removes transport-level head-of-line blocking and connection setup is faster (0-RTT).',
      uk: 'HTTP над QUIC (UDP): per-stream flow control прибирає head-of-line blocking на рівні транспорту, а встановлення зʼєднання швидше (0-RTT).',
    },
  },
  // CHANGED (s10a): Section-I right-sized terms authored with m6/m7/m8.
  {
    term: 'CSDL',
    def: {
      en: 'Common Schema Definition Language — the machine-readable schema an OData service returns at $metadata (XML, or JSON since 4.01): entity types, keys, relationships. It is what lets Excel/Power BI query an API they have never seen.',
      uk: 'Common Schema Definition Language — машиночитна схема, яку OData-сервіс повертає на $metadata (XML або JSON з 4.01): entity types, ключі, звʼязки. Саме вона дозволяє Excel/Power BI запитувати API, якого вони ніколи не бачили.',
    },
    seeAlso: ['WSDL'],
  },
  {
    term: 'WSDL',
    def: {
      en: 'Web Services Description Language — SOAP’s contract document (types via XML Schema, operations, binding, endpoint), precise enough to generate typed clients. WSDL 1.1 remains the de-facto format; 2.0 never displaced it.',
      uk: 'Web Services Description Language — контрактний документ SOAP (types через XML Schema, операції, binding, endpoint), достатньо точний для генерації типізованих клієнтів. WSDL 1.1 — досі де-факто формат; 2.0 його не витіснив.',
    },
    seeAlso: ['WS-Security', 'CSDL'],
  },
  {
    term: 'WS-Security',
    def: {
      en: 'The OASIS standard for message-level security in SOAP: XML Signature/Encryption over parts of the envelope plus token profiles (X.509, SAML) in the Header — proof that survives intermediaries and storage, unlike TLS.',
      uk: 'Стандарт OASIS для безпеки рівня повідомлення в SOAP: XML Signature/Encryption над частинами конверта плюс профілі токенів (X.509, SAML) у Header — доказ, що переживає проміжні вузли та зберігання, на відміну від TLS.',
    },
    seeAlso: ['WSDL', 'HMAC'],
  },
  {
    term: 'Notification (JSON-RPC)',
    def: {
      en: 'A JSON-RPC request without an id: the server must never reply, even on error — true fire-and-forget for telemetry-grade traffic. Anything that mutates state should carry an id instead.',
      uk: 'JSON-RPC request без id: сервер ніколи не відповідає, навіть при помилці — справжній fire-and-forget для трафіку телеметрійного класу. Все, що мутує стан, має натомість нести id.',
    },
  },
  // CHANGED (s10b): tRPC + async-messaging terms authored with m11/m16.
  {
    term: 'tRPC',
    def: {
      en: 'TypeScript-native RPC with no IDL and no codegen: the server exports its router’s type (`type AppRouter = typeof appRouter`) and the client `import type`s it, so TypeScript inference — not a build step — carries the contract. Plain HTTP+JSON; TypeScript-only and internal by design.',
      uk: 'TypeScript-native RPC без IDL і без codegen: сервер експортує тип свого router-а (`type AppRouter = typeof appRouter`), а клієнт робить `import type`, тож inference TypeScript — а не build-крок — переносить контракт. Звичайний HTTP+JSON; за задумом лише TypeScript і внутрішній.',
    },
    seeAlso: ['gRPC', 'GraphQL'],
  },
  {
    term: 'Message broker',
    def: {
      en: 'A middleman that decouples producers from consumers in time: the producer publishes a message and moves on; consumers read at their own pace. Buys temporal decoupling, buffering/load-leveling, and fan-out — at the cost of the synchronous answer.',
      uk: 'Посередник, що розчіплює producer-ів і consumer-ів у часі: producer публікує повідомлення й іде далі; consumers читають у своєму темпі. Купує темпоральне розчеплення, буферизацію/load-leveling і fan-out — ціною синхронної відповіді.',
    },
    seeAlso: ['AMQP', 'Kafka'],
  },
  {
    term: 'MQTT',
    def: {
      en: 'A lightweight pub/sub protocol for IoT (fixed header from just 2 bytes) over lossy networks: clients publish/subscribe to hierarchical topics via a broker, with retained messages and a Last-Will. Three QoS levels; 3.1.1 and 5.0 are both current OASIS Standards.',
      uk: 'Легкий pub/sub-протокол для IoT (фіксований header від 2 байтів) над втратними мережами: клієнти публікують/підписуються на ієрархічні topics через брокер, із retained messages і Last-Will. Три рівні QoS; 3.1.1 і 5.0 — обидва чинні OASIS Standards.',
    },
    seeAlso: ['QoS (MQTT)', 'Message broker'],
  },
  {
    term: 'QoS (MQTT)',
    def: {
      en: 'MQTT’s per-hop delivery levels: 0 = at most once (fire-and-forget, may be lost), 1 = at least once (PUBACK, may duplicate), 2 = exactly once (a four-packet handshake). QoS is negotiated per hop, not end-to-end across the broker.',
      uk: 'Per-hop рівні доставки MQTT: 0 = at most once (fire-and-forget, може загубитися), 1 = at least once (PUBACK, може дублюватися), 2 = exactly once (чотирипакетне рукостискання). QoS узгоджується на хоп, а не наскрізь через брокер.',
    },
    seeAlso: ['MQTT', 'At-least-once delivery'],
  },
  {
    term: 'AMQP',
    def: {
      en: 'Two different protocols share the name. AMQP 0-9-1 (RabbitMQ’s model) bakes exchanges → bindings → queues into the wire with per-message acks. AMQP 1.0 (ISO/IEC 19464) defines only the peer-to-peer wire — no exchanges or queues in the spec.',
      uk: 'Дві різні протоколи ділять назву. AMQP 0-9-1 (модель RabbitMQ) вбудовує exchanges → bindings → queues у wire з per-message acks. AMQP 1.0 (ISO/IEC 19464) визначає лише peer-to-peer wire — без exchanges і queues у специфікації.',
    },
    seeAlso: ['Message broker'],
  },
  {
    term: 'Kafka',
    def: {
      en: 'A distributed, append-only log you can replay: topics split into partitions (order only within a partition), consumers track their own offset and pull, and messages are retained by time/size rather than deleted on read. Kafka 4.0 (2025) is KRaft-only.',
      uk: 'Розподілений append-only лог, який можна реплеїти: topics діляться на partitions (порядок лише в межах partition), consumers самі відстежують offset і тягнуть, а повідомлення зберігаються за часом/розміром, а не видаляються при читанні. Kafka 4.0 (2025) — лише KRaft.',
    },
    seeAlso: ['Consumer group', 'Message broker'],
  },
  {
    term: 'Consumer group',
    def: {
      en: 'A set of Kafka consumers sharing a topic’s partitions so each partition is read by exactly one member — horizontal scaling with per-group offsets. Two groups read the same log independently, each at its own position.',
      uk: 'Набір Kafka-consumer-ів, що ділять partitions topic-а так, що кожну partition читає рівно один член — горизонтальне масштабування з per-group offset-ами. Дві групи читають той самий лог незалежно, кожна на своїй позиції.',
    },
    seeAlso: ['Kafka'],
  },
  {
    term: 'Event-driven architecture',
    def: {
      en: 'A style where services communicate by emitting and reacting to events (facts about the past) via a broker, rather than calling each other — coordinated by choreography or orchestration. Buys decoupling and scale; costs eventual consistency and harder tracing (use the outbox pattern for state-changing events).',
      uk: 'Стиль, де сервіси спілкуються, випускаючи й реагуючи на події (факти про минуле) через брокер, а не кличучи одне одного — координація через choreography чи orchestration. Купує розчеплення й масштаб; коштує eventual consistency й важче трасування (для подій, що змінюють стан, — outbox pattern).',
    },
    seeAlso: ['Message broker', 'Webhook'],
  },
  // CHANGED (s12a): pagination/rate-limiting + reliability terms (m20, m21).
  {
    term: 'Cursor pagination',
    def: {
      en: 'Paging where the boundary is a VALUE — an opaque token naming the last row the client saw (Stripe starting_after) — instead of a position. Exact under concurrent writes; no random access.',
      uk: 'Пагінація, де межа — ЗНАЧЕННЯ: opaque-токен, що називає останній побачений клієнтом рядок (starting_after у Stripe), а не позиція. Точна під паралельними записами; без довільного доступу.',
    },
    seeAlso: ['Keyset pagination'],
  },
  {
    term: 'Keyset pagination',
    def: {
      en: 'The database half of a cursor: WHERE (created_at, id) < boundary ORDER BY … LIMIT n — an index seek at any depth (the "seek method"), unlike OFFSET which scans and discards.',
      uk: 'Базова половина cursor-а: WHERE (created_at, id) < межа ORDER BY … LIMIT n — index seek на будь-якій глибині («seek method»), на відміну від OFFSET, що сканує і викидає.',
    },
    seeAlso: ['Cursor pagination'],
  },
  {
    term: 'Rate limiting',
    def: {
      en: 'Bounding each caller\'s request budget and shedding the excess cheaply with 429 + Retry-After. Enforced at the edge with a shared counter; advertised via rate-limit headers.',
      uk: 'Обмеження бюджету запитів кожного викликача і дешеве скидання надлишку через 429 + Retry-After. Застосовується на краю зі спільним лічильником; рекламується rate-limit заголовками.',
    },
    seeAlso: ['Token bucket'],
  },
  {
    term: 'Token bucket',
    def: {
      en: 'The default rate-limiting algorithm: tokens refill at a steady rate up to a capacity, so short bursts pass while the average rate holds. Leaky bucket is its smoothing sibling.',
      uk: 'Алгоритм rate limiting за замовчуванням: токени поповнюються зі сталою швидкістю до ємності, тож короткі burst-и проходять, а середня швидкість тримається. Leaky bucket — його згладжувальний родич.',
    },
    seeAlso: ['Rate limiting'],
  },
  {
    term: 'Outbox pattern',
    def: {
      en: 'Fix for the dual-write bug: write the business row AND the event row in one local transaction; a relay (poller/CDC) publishes from the outbox table at-least-once; consumers dedup by event id.',
      uk: 'Ліки від багу dual-write: бізнес-рядок І рядок події пишуться в одній локальній транзакції; relay (poller/CDC) публікує з таблиці outbox at-least-once; consumer-и дедуплікують за id події.',
    },
    seeAlso: ['At-least-once delivery', 'Saga'],
  },
  {
    term: 'Saga',
    def: {
      en: 'A distributed business operation as a chain of LOCAL transactions, each with a compensating action that runs backwards on failure. Coordinated by choreography (events) or orchestration (a coordinator).',
      uk: 'Розподілена бізнес-операція як ланцюжок ЛОКАЛЬНИХ транзакцій, кожна з компенсувальною дією, що біжить назад при відмові. Координується через choreography (події) або orchestration (координатор).',
    },
    seeAlso: ['Outbox pattern', 'Idempotency key'],
  },
  {
    term: 'Circuit breaker',
    def: {
      en: 'A guard that stops calling a persistently failing dependency: closed (normal) → open (fail fast, let it recover) → half-open (probe). Pairs with nested timeouts and bulkheads.',
      uk: 'Запобіжник, що припиняє кликати стійко відмовляючу залежність: closed (норма) → open (падай швидко, дай відновитись) → half-open (проба). У парі з вкладеними timeout-ами та bulkhead-ами.',
    },
    seeAlso: ['Idempotent'],
  },
];
