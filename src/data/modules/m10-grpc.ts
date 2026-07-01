import type { Module } from '../types';

/*
 * m10-grpc — the contract-first binary RPC over HTTP/2 (s5). SIGNATURE: sim 'grpc-wire' (protobuf byte
 * encoder). Figure: 'grpc-call-types'. Eight topics follow the style arc: the .proto IDL → HTTP/2
 * transport → four call types → wire encoding → deadlines/cancellation → status codes → grpc-web at the
 * edge → streaming backpressure + the use/avoid verdict. Facts (4 call types, protobuf wire format,
 * status-in-trailers → grpc-web needs a proxy, HTTP/2 flow-control backpressure) web-verified S5.
 */
export const m10: Module = {
  id: 'm10-grpc',
  num: 10,
  section: 's2-contract-first',
  order: 2,
  level: 'senior',
  signature: true,
  title: { en: 'gRPC', uk: 'gRPC' },
  tagline: {
    en: 'A typed method call over HTTP/2: Protobuf on the wire, four streaming shapes, deadlines built in.',
    uk: 'Типізований виклик методу через HTTP/2: Protobuf на дроті, чотири форми streaming, deadlines вбудовані.',
  },
  readMins: 18,
  mentalModel: {
    en: 'gRPC is a function call across the network. You write a `.proto` contract, generate typed client and server stubs, and call a method as if it were local — Protobuf binary on the wire, HTTP/2 streams underneath, deadlines and status codes built in. You trade REST’s uniformity and reach for precision, speed, and end-to-end types.',
    uk: 'gRPC — це виклик функції через мережу. Пишеш контракт `.proto`, генеруєш типізовані client і server stubs і викликаєш метод, ніби він локальний — Protobuf binary на дроті, HTTP/2-стріми під низом, deadlines і status codes вбудовані. Міняєш уніформність і доступність REST на точність, швидкість і наскрізні типи.',
  },
  topics: [
    // ── T1 · The .proto IDL ──────────────────────────────────────────────────
    {
      id: 'protobuf-idl',
      title: { en: 'The .proto contract', uk: 'Контракт .proto' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'gRPC is **contract-first**: you describe services and messages in a `.proto` **IDL** (interface definition language), run the `protoc` compiler, and it generates typed client and server code in your language. The schema *is* the contract — both sides compile against it, so a mismatch is a build error, not a 3am production surprise. This is the opposite end of the coupling axis from REST: instead of a uniform, self-describing interface any client can call, you get a precise, shared definition that a known set of peers generate code from.',
            uk: 'gRPC — **contract-first**: описуєш сервіси й повідомлення в `.proto` **IDL** (interface definition language), запускаєш компілятор `protoc`, і він генерує типізований код client і server твоєю мовою. Schema *і є* контрактом — обидві сторони компілюються під неї, тож розбіжність — це помилка build-у, а не сюрприз о 3-й ночі в проді. Це протилежний кінець осі coupling від REST: замість уніформного self-describing інтерфейсу, який може викликати будь-який клієнт, ти маєш точне спільне визначення, з якого відомий набір peer-ів генерує код.',
          },
        },
        {
          kind: 'code',
          lang: 'proto',
          code: `syntax = "proto3";

service Articles {
  rpc Get  (GetArticle)   returns (Article);          // unary
  rpc List (ListArticles) returns (stream Article);   // server streaming
}

message GetArticle { int64 id = 1; }
message Article {
  int64  id    = 1;
  string title = 2;
  repeated string tags = 3;
}`,
          note: {
            en: 'One `.proto` defines the methods, their messages, and — via `stream` — their call type. `protoc` turns it into typed stubs; the client calls `articles.Get({id})` like a local function.',
            uk: 'Один `.proto` визначає методи, їхні повідомлення і — через `stream` — їхній тип виклику. `protoc` перетворює його на типізовані stubs; клієнт викликає `articles.Get({id})` як локальну функцію.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'The contract is the .proto, checked at build time', uk: 'Контракт — це .proto, перевірений на build-time' },
          md: {
            en: 'With REST, the “contract” is documentation and hope; drift surfaces at runtime. With gRPC, the `.proto` is the single source of truth both sides generate from, so an incompatible change fails to compile. That’s the core trade of the contract-first family (m9 GraphQL, m11 tRPC): more upfront coupling, far fewer integration surprises.',
            uk: 'У REST «контракт» — це документація й надія; drift спливає в рантаймі. У gRPC `.proto` — єдине джерело правди, з якого генерують обидві сторони, тож несумісна зміна не скомпілюється. Це ключовий обмін contract-first родини (m9 GraphQL, m11 tRPC): більше coupling наперед, набагато менше сюрпризів інтеграції.',
          },
        },
      ],
    },
    // ── T2 · HTTP/2 transport ────────────────────────────────────────────────
    {
      id: 'http2-transport',
      title: { en: 'Built on HTTP/2', uk: 'Збудовано на HTTP/2' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'gRPC is defined over **HTTP/2** (m3), and that choice is load-bearing. HTTP/2’s multiplexed streams let many calls share one connection concurrently, and its long-lived streams are exactly what the streaming call types need. Each gRPC call is one HTTP/2 stream: request metadata rides in headers, messages in `DATA` frames, and — crucially — the final **status travels in HTTP/2 trailers** (header frames sent *after* the body). That last detail is elegant server-side but is the reason browsers can’t speak gRPC directly (T7).',
            uk: 'gRPC визначено над **HTTP/2** (m3), і цей вибір несучий. Мультиплексовані стріми HTTP/2 дають багатьом викликам ділити одне зʼєднання паралельно, а його довгоживучі стріми — саме те, що потрібно streaming-типам викликів. Кожен gRPC-виклик — це один HTTP/2-стрім: метадані запиту їдуть у headers, повідомлення в `DATA`-фреймах, і — головне — фінальний **status їде в HTTP/2 trailers** (header-фрейми, надіслані *після* тіла). Ця остання деталь елегантна на сервері, але це причина, чому браузери не говорять gRPC напряму (T7).',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'gRPC needs HTTP/2 end to end', uk: 'gRPC потребує HTTP/2 наскрізно' },
          md: {
            en: 'Every hop — client, load balancer, proxy, server — must speak HTTP/2 and preserve trailers. An intermediary that downgrades to HTTP/1.1 or drops trailers breaks gRPC silently. This is why gRPC lives most happily between services you control, on infrastructure you’ve verified, rather than across the open web.',
            uk: 'Кожен стрибок — client, load balancer, proxy, server — має говорити HTTP/2 і зберігати trailers. Проміжний вузол, що даунгрейдить до HTTP/1.1 чи викидає trailers, тихо ламає gRPC. Тому gRPC найщасливіший між сервісами, які контролюєш, на інфраструктурі, яку перевірив, а не через відкритий веб.',
          },
        },
      ],
    },
    // ── T3 · Four call types (figure) ────────────────────────────────────────
    {
      id: 'four-call-types',
      title: { en: 'The four call types', uk: 'Чотири типи викликів' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Because it rides HTTP/2 streams, gRPC offers **four call shapes**, not just request/response. **Unary** is the familiar one-in, one-out call. **Server streaming** sends one request and reads a stream of responses — feeds, large result sets, progress. **Client streaming** sends a stream of requests and gets one response — uploads, metric batches, aggregation. **Bidirectional streaming** runs two independent streams at once, so both sides send whenever they like — chat, live sync, telemetry. The streams are independent: in bidi, the server can answer as it reads or wait for everything first.',
            uk: 'Оскільки gRPC їде на HTTP/2-стрімах, він пропонує **чотири форми викликів**, не лише request/response. **Unary** — знайомий виклик «одне туди, одне назад». **Server streaming** шле один запит і читає потік відповідей — feed-и, великі набори результатів, прогрес. **Client streaming** шле потік запитів і отримує одну відповідь — завантаження, батчі метрик, агрегація. **Bidirectional streaming** запускає два незалежні стріми водночас, тож обидві сторони шлють коли завгодно — чат, live sync, телеметрія. Стріми незалежні: у bidi сервер може відповідати по ходу читання чи чекати всього спочатку.',
          },
        },
        {
          kind: 'figure',
          fig: 'grpc-call-types',
          caption: {
            en: 'The four call types over HTTP/2 streams. Requests (violet) flow client→server, responses (cyan) server→client; streaming just means “many, over time”.',
            uk: 'Чотири типи викликів над HTTP/2-стрімами. Запити (фіолетовий) client→server, відповіді (cyan) server→client; streaming — це просто «багато, у часі».',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Call type', uk: 'Тип виклику' },
            { en: 'Shape', uk: 'Форма' },
            { en: 'Fits', uk: 'Пасує' },
          ],
          rows: [
            [
              { en: 'Unary', uk: 'Unary' },
              { en: '1 request → 1 response', uk: '1 запит → 1 відповідь' },
              { en: 'Ordinary RPC — reads, writes', uk: 'Звичайний RPC — читання, запис' },
            ],
            [
              { en: 'Server streaming', uk: 'Server streaming' },
              { en: '1 request → N responses', uk: '1 запит → N відповідей' },
              { en: 'Feeds, large lists, progress', uk: 'Feed-и, великі списки, прогрес' },
            ],
            [
              { en: 'Client streaming', uk: 'Client streaming' },
              { en: 'N requests → 1 response', uk: 'N запитів → 1 відповідь' },
              { en: 'Uploads, metric batches', uk: 'Завантаження, батчі метрик' },
            ],
            [
              { en: 'Bidirectional', uk: 'Bidirectional' },
              { en: 'N ↔ N, independent', uk: 'N ↔ N, незалежно' },
              { en: 'Chat, live sync, telemetry', uk: 'Чат, live sync, телеметрія' },
            ],
          ],
        },
      ],
    },
    // ── T4 · Wire encoding (the sim) ─────────────────────────────────────────
    {
      id: 'wire-encoding-varint-tag',
      title: { en: 'On the wire: tags & varints', uk: 'На дроті: tags і varints' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Protobuf’s compactness comes from what it *doesn’t* send. Each field is a **tag** — `(field_number << 3) | wire_type`, itself a varint — followed by the value: a **varint** for integers (small numbers take fewer bytes) or a **length-prefixed** run of bytes for strings and sub-messages. Field *names never travel*; the number identifies the field, which is why the schema is mandatory to read it back. And under proto3, a field equal to its default (`0`, `""`) is **omitted entirely**. The simulator below encodes a message live so you can watch the bytes form.',
            uk: 'Компактність Protobuf — у тому, чого він *не* шле. Кожне поле — це **tag** (`(field_number << 3) | wire_type`, сам varint), за яким значення: **varint** для цілих (менші числа — менше байтів) або **length-prefixed** послідовність байтів для рядків і під-повідомлень. Назви полів *не передаються*; поле ідентифікує номер, тому schema обовʼязкова, щоб прочитати назад. А в proto3 поле, рівне дефолту (`0`, `""`), **пропускається повністю**. Симулятор нижче кодує повідомлення наживо, щоб ти бачив, як формуються байти.',
          },
        },
        {
          kind: 'sim',
          sim: 'grpc-wire',
          caption: {
            en: 'Edit the Article and watch it serialise: tag, length prefix, value. Set a field to its default and proto3 drops it; compare the total against the same data as JSON.',
            uk: 'Редагуй Article і дивись, як він серіалізується: tag, префікс довжини, значення. Постав поле в дефолт — proto3 його викине; порівняй суму з тими ж даними у JSON.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Field numbers are the contract — never reuse one', uk: 'Номери полів — це контракт; ніколи не перевикористовуй' },
          md: {
            en: 'Because the wire carries numbers, not names, you can rename a field freely but must never change its number or reuse a retired one — an old peer would read the new field as the old one. A reader that meets an unknown number keeps the bytes (unknown-field preservation), which is what makes additive evolution safe. Same discipline as m4/m18: add fields, never renumber.',
            uk: 'Оскільки дріт несе номери, а не назви, поле можна вільно перейменовувати, але не можна міняти його номер чи перевикористовувати списаний — старий peer прочитав би нове поле як старе. Читач, що зустрів невідомий номер, зберігає байти (unknown-field preservation), і саме це робить additive-еволюцію безпечною. Та сама дисципліна, що й m4/m18: додавай поля, ніколи не перенумеровуй.',
          },
        },
      ],
    },
    // ── T5 · Deadlines & cancellation ────────────────────────────────────────
    {
      id: 'deadlines-cancellation',
      title: { en: 'Deadlines & cancellation', uk: 'Deadlines і cancellation' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'gRPC makes two things first-class that REST leaves ad hoc. A **deadline** is a per-call time budget the client sets; it **propagates** down the call chain, so if service A calls B calls C with a 2-second deadline, all three stop when it expires instead of doing work no one is waiting for. **Cancellation** is the other half: when the client goes away or cancels, the server is notified and can abandon the request. Together they turn “a hung request somewhere” into a bounded, observable failure (`DEADLINE_EXCEEDED`).',
            uk: 'gRPC робить дві речі first-class, які REST лишає ad hoc. **Deadline** — це бюджет часу на виклик, який ставить клієнт; він **propagate-иться** вниз ланцюгом викликів, тож якщо сервіс A кличе B кличе C з deadline 2 секунди, усі три спиняться, коли він вичерпається, замість роботи, на яку ніхто не чекає. **Cancellation** — друга половина: коли клієнт зникає чи скасовує, сервер сповіщений і може кинути запит. Разом вони перетворюють «десь завислий запит» на обмежену, спостережувану відмову (`DEADLINE_EXCEEDED`).',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'A call with no deadline is a resource leak waiting to happen', uk: 'Виклик без deadline — це витік ресурсів, що чекає статися' },
          md: {
            en: 'Always set a deadline on a gRPC call. Without one, a slow or stuck downstream holds a stream, a goroutine/thread, and a connection slot open indefinitely, and under load those pile up into an outage. Deadline propagation is the mechanism that stops a whole call tree from working on a request the user already abandoned.',
            uk: 'Завжди став deadline на gRPC-виклик. Без нього повільний чи застряглий downstream тримає стрім, goroutine/потік і слот зʼєднання відкритими нескінченно, і під навантаженням вони накопичуються в outage. Deadline propagation — механізм, що спиняє ціле дерево викликів працювати над запитом, який користувач уже кинув.',
          },
        },
      ],
    },
    // ── T6 · Status codes ────────────────────────────────────────────────────
    {
      id: 'status-codes',
      title: { en: 'Status codes', uk: 'Status codes' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'gRPC has its own **status model**: every call ends with a numeric **code** (`OK = 0`, plus a canonical set like `INVALID_ARGUMENT`, `NOT_FOUND`, `DEADLINE_EXCEEDED`, `UNAVAILABLE`) and an optional message, delivered in the **trailers**. It’s smaller and more uniform than HTTP’s status space and maps cleanly onto retry logic — `UNAVAILABLE` is the retryable “try again”, `INVALID_ARGUMENT` never is. Because the code lives in trailers, plain HTTP tooling and browsers can’t read it without help, which leads straight to gRPC-Web.',
            uk: 'gRPC має власну **модель статусів**: кожен виклик завершується числовим **code** (`OK = 0`, плюс канонічний набір на кшталт `INVALID_ARGUMENT`, `NOT_FOUND`, `DEADLINE_EXCEEDED`, `UNAVAILABLE`) і опційним повідомленням, доставленими в **trailers**. Це менший і уніформніший простір, ніж статуси HTTP, і чисто лягає на retry-логіку — `UNAVAILABLE` це retryable «спробуй ще», `INVALID_ARGUMENT` — ніколи. Оскільки code живе в trailers, звичайний HTTP-tooling і браузери не прочитають його без допомоги, що веде прямо до gRPC-Web.',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Code', uk: 'Code' },
            { en: '#', uk: '#' },
            { en: 'Meaning', uk: 'Значення' },
            { en: '≈ HTTP', uk: '≈ HTTP' },
          ],
          rows: [
            [
              { en: 'OK', uk: 'OK' },
              { en: '0', uk: '0' },
              { en: 'Success', uk: 'Успіх' },
              { en: '200', uk: '200' },
            ],
            [
              { en: 'INVALID_ARGUMENT', uk: 'INVALID_ARGUMENT' },
              { en: '3', uk: '3' },
              { en: 'Bad request data (never retry)', uk: 'Погані дані запиту (не retry)' },
              { en: '400', uk: '400' },
            ],
            [
              { en: 'NOT_FOUND', uk: 'NOT_FOUND' },
              { en: '5', uk: '5' },
              { en: 'No such entity', uk: 'Немає такої сутності' },
              { en: '404', uk: '404' },
            ],
            [
              { en: 'DEADLINE_EXCEEDED', uk: 'DEADLINE_EXCEEDED' },
              { en: '4', uk: '4' },
              { en: 'Ran past the deadline', uk: 'Вийшов за deadline' },
              { en: '504', uk: '504' },
            ],
            [
              { en: 'UNAVAILABLE', uk: 'UNAVAILABLE' },
              { en: '14', uk: '14' },
              { en: 'Transient — safe to retry', uk: 'Тимчасово — можна retry' },
              { en: '503', uk: '503' },
            ],
          ],
        },
      ],
    },
    // ── T7 · gRPC-Web ────────────────────────────────────────────────────────
    {
      id: 'grpc-web',
      title: { en: 'gRPC-Web & the browser', uk: 'gRPC-Web і браузер' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'A browser cannot speak native gRPC. JavaScript has no access to raw HTTP/2 frames, and — the sharper problem — it cannot read **HTTP/2 trailers**, which is exactly where gRPC puts the status. **gRPC-Web** is a modified protocol that fixes this by moving the trailers into the *response body*, but it needs a **proxy** in front of the real gRPC server to translate: the browser talks gRPC-Web, a proxy (Envoy’s `grpc_web` filter, or grpc-gateway) converts it to standard gRPC over HTTP/2, and the server never knows the difference. That extra hop and the reduced streaming support are the price of gRPC at the edge.',
            uk: 'Браузер не говорить native gRPC. JavaScript не має доступу до сирих HTTP/2-фреймів і — гостріша проблема — не може читати **HTTP/2 trailers**, а саме туди gRPC кладе status. **gRPC-Web** — це модифікований протокол, що це виправляє, переносячи trailers у *тіло відповіді*, але потребує **proxy** перед справжнім gRPC-сервером для трансляції: браузер говорить gRPC-Web, proxy (`grpc_web`-filter Envoy чи grpc-gateway) конвертує його в стандартний gRPC над HTTP/2, а сервер не помічає різниці. Цей зайвий стрибок і урізана підтримка streaming — ціна gRPC на межі.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'This is why gRPC stays internal and REST/GraphQL face the browser', uk: 'Тому gRPC лишається внутрішнім, а REST/GraphQL дивляться в браузер' },
          md: {
            en: 'The browser friction — a mandatory proxy, limited streaming, no easy `curl`-debugging — is the single biggest reason teams run gRPC service-to-service and expose REST or GraphQL at the public edge. It’s the polyglot pattern from m2: tight, fast gRPC inside; loose, reachable REST out front. If your only consumers are browsers, gRPC is usually the wrong tool.',
            uk: 'Браузерна тертя — обовʼязковий proxy, обмежений streaming, немає легкого `curl`-дебагу — це головна причина, чому команди тримають gRPC service-to-service і виставляють REST чи GraphQL на публічну межу. Це polyglot-патерн з m2: тісний швидкий gRPC всередині; loose доступний REST спереду. Якщо твої єдині споживачі — браузери, gRPC зазвичай не той інструмент.',
          },
        },
      ],
    },
    // ── T8 · Streaming, backpressure & the verdict ───────────────────────────
    {
      id: 'streaming-backpressure',
      title: { en: 'Backpressure & when to use gRPC', uk: 'Backpressure і коли брати gRPC' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Streaming isn’t free capacity — it needs flow control, and gRPC inherits HTTP/2’s. Each stream has a receive **window**: when a consumer reads slowly, its window fills, the sender is told to pause, and memory stays bounded. That’s **backpressure**, and it’s automatic — but only if you cooperate: process messages incrementally, don’t buffer a whole stream, and handle cancellation when a peer disconnects. Note too that HTTP/2 caps concurrent streams per connection (often ~100), so a very busy client opens more connections rather than starving calls.',
            uk: 'Streaming — це не безкоштовна місткість, йому потрібен flow control, і gRPC успадковує його з HTTP/2. Кожен стрім має **вікно** прийому: коли consumer читає повільно, його вікно заповнюється, sender-у кажуть призупинитись, і памʼять лишається обмеженою. Це **backpressure**, і він автоматичний — але лише якщо співпрацюєш: обробляй повідомлення інкрементально, не буферизуй увесь стрім, обробляй cancellation, коли peer відключається. Зауваж також, що HTTP/2 обмежує кількість паралельних стрімів на зʼєднання (часто ~100), тож дуже зайнятий клієнт відкриває більше зʼєднань, а не морить виклики голодом.',
          },
        },
        {
          kind: 'compare',
          a: { en: 'Reach for gRPC', uk: 'Бери gRPC' },
          b: { en: 'Prefer REST', uk: 'Обери REST' },
          rows: [
            [
              { en: 'Boundary', uk: 'Межа' },
              { en: 'Internal service-to-service', uk: 'Внутрішнє service-to-service' },
              { en: 'Public / browser edge', uk: 'Публічна / браузерна межа' },
            ],
            [
              { en: 'Workload', uk: 'Навантаження' },
              { en: 'High-throughput, low-latency, streaming', uk: 'High-throughput, low-latency, streaming' },
              { en: 'Simple CRUD, cacheable reads', uk: 'Простий CRUD, кешовані читання' },
            ],
            [
              { en: 'Contract', uk: 'Контракт' },
              { en: 'Shared .proto + codegen, polyglot', uk: 'Спільний .proto + codegen, polyglot' },
              { en: 'Loose, self-describing, any client', uk: 'Loose, self-describing, будь-який клієнт' },
            ],
            [
              { en: 'Debugging', uk: 'Дебаг' },
              { en: 'Needs tooling / reflection', uk: 'Треба tooling / reflection' },
              { en: 'curl + browser dev-tools', uk: 'curl + browser dev-tools' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'The verdict', uk: 'Вердикт' },
          md: {
            en: 'Use gRPC when both ends are yours, performance and streaming matter, and a shared schema across languages is a feature — microservice meshes, mobile-to-backend, real-time internal pipelines. Avoid it at the public browser edge (grpc-web friction), for plain CRUD where REST is simpler, and where human-debuggability or HTTP caching are worth more than raw speed. It’s the tight, binary, typed end of the spectrum — powerful exactly where you control both sides.',
            uk: 'Бери gRPC, коли обидва кінці твої, важать продуктивність і streaming, а спільна schema між мовами — це фіча: microservice-меші, mobile-to-backend, real-time внутрішні пайплайни. Уникай на публічній браузерній межі (тертя grpc-web), для простого CRUD, де REST простіший, і там, де людська дебажність чи HTTP-кешування вартують більше за сиру швидкість. Це tight, binary, типізований кінець спектра — потужний саме там, де контролюєш обидві сторони.',
          },
        },
      ],
    },
  ],
  keyPoints: [
    { en: 'gRPC is contract-first: a `.proto` IDL generates typed client/server stubs, so a mismatch fails at build time, not runtime.', uk: 'gRPC — contract-first: `.proto` IDL генерує типізовані client/server stubs, тож розбіжність падає на build-time, не в рантаймі.' },
    { en: 'It runs on HTTP/2 and carries final status in trailers — which is why it needs HTTP/2 end-to-end and can’t reach browsers directly.', uk: 'Працює на HTTP/2 і несе фінальний status у trailers — тому потребує HTTP/2 наскрізно й не дістає браузери напряму.' },
    { en: 'Four call types (unary, server-, client-, bidirectional-streaming) map onto HTTP/2 streams — far past REST’s request/response.', uk: 'Чотири типи викликів (unary, server-, client-, bidirectional-streaming) лягають на HTTP/2-стріми — далеко за request/response REST.' },
    { en: 'Protobuf sends tags + varints, not field names, so it’s compact and fast — but the schema is required to read it and field numbers are the contract.', uk: 'Protobuf шле tags + varints, не назви полів, тож компактний і швидкий — але schema обовʼязкова для читання, а номери полів — це контракт.' },
    { en: 'Deadlines propagate across the call chain and cancellation frees server work — always set a deadline or risk a hung-call resource leak.', uk: 'Deadlines propagate-яться ланцюгом викликів, а cancellation звільняє роботу сервера — завжди став deadline або ризикуй витоком на завислих викликах.' },
    { en: 'Use gRPC internally for typed, high-throughput, streaming service-to-service; keep REST/GraphQL at the public browser edge.', uk: 'Бери gRPC всередині для типізованого high-throughput streaming service-to-service; тримай REST/GraphQL на публічній браузерній межі.' },
  ],
  pitfalls: [
    {
      title: { en: 'Reaching for gRPC as a public browser API', uk: 'Брати gRPC як публічний браузерний API' },
      body: {
        en: 'Browsers can’t read HTTP/2 trailers, so gRPC needs a gRPC-Web proxy and loses easy debugging and full streaming. If your consumers are browsers or unknown third parties, REST or GraphQL is almost always the better edge.',
        uk: 'Браузери не читають HTTP/2 trailers, тож gRPC потребує gRPC-Web proxy й втрачає легкий дебаг і повний streaming. Якщо споживачі — браузери чи невідомі треті сторони, REST чи GraphQL майже завжди краща межа.',
      },
    },
    {
      title: { en: 'Calling without a deadline', uk: 'Виклик без deadline' },
      body: {
        en: 'A gRPC call with no deadline can hang forever, pinning a stream, a thread, and a connection slot. Under load these accumulate into an outage. Set a deadline on every call and let it propagate down the chain.',
        uk: 'gRPC-виклик без deadline може висіти вічно, займаючи стрім, потік і слот зʼєднання. Під навантаженням вони накопичуються в outage. Став deadline на кожен виклик і дай йому propagate-итись ланцюгом.',
      },
    },
    {
      title: { en: 'Renumbering or reusing protobuf field numbers', uk: 'Перенумерація чи перевикористання номерів полів protobuf' },
      body: {
        en: 'The wire carries field numbers, not names. Change a number or reuse a retired one and old and new peers silently misread each other. Rename freely, but only ever add new numbers — never repurpose an old one.',
        uk: 'Дріт несе номери полів, не назви. Зміни номер чи перевикористай списаний — і старі й нові peer-и тихо читають одне одного неправильно. Перейменовуй вільно, але лише додавай нові номери — ніколи не перепризначай старий.',
      },
    },
  ],
  interview: [
    {
      q: { en: 'Why can’t a browser call a gRPC service directly, and what do you do about it?', uk: 'Чому браузер не може викликати gRPC-сервіс напряму і що з цим робити?' },
      a: {
        en: 'gRPC puts the call’s final status in HTTP/2 trailers — header frames sent after the body — and browser JavaScript has no API to read trailers (nor raw HTTP/2 frames). So a browser literally can’t observe whether a gRPC call succeeded. The fix is gRPC-Web: a modified protocol that moves the trailers into the response body, plus a proxy (Envoy’s grpc_web filter or grpc-gateway) that translates between gRPC-Web and standard gRPC over HTTP/2. In practice that means an extra hop and reduced streaming support, which is why most teams run gRPC service-to-service and expose REST or GraphQL to browsers.',
        uk: 'gRPC кладе фінальний status виклику в HTTP/2 trailers — header-фрейми після тіла — а браузерний JavaScript не має API читати trailers (ні сирі HTTP/2-фрейми). Тож браузер буквально не може побачити, чи gRPC-виклик успішний. Виправлення — gRPC-Web: модифікований протокол, що переносить trailers у тіло відповіді, плюс proxy (grpc_web-filter Envoy чи grpc-gateway), що транслює між gRPC-Web і стандартним gRPC над HTTP/2. На практиці це зайвий стрибок і урізаний streaming, тому більшість команд тримає gRPC service-to-service і виставляє REST чи GraphQL браузерам.',
      },
      level: 'senior',
    },
    {
      q: { en: 'Protobuf is “smaller than JSON.” Where does the saving actually come from, and when does it shrink?', uk: '«Protobuf менший за JSON.» Звідки насправді економія і коли вона зникає?' },
      a: {
        en: 'Two places. First, field names don’t travel — a field is a one-byte tag (number + wire type) instead of a quoted key repeated on every message, which is a big win for records with many small fields or arrays of objects. Second, integers are varint-encoded, so small numbers take one byte instead of their text digits, and proto3 omits default values entirely. The saving is largest for numeric, repetitive, deeply-structured data. It shrinks toward zero when the payload is mostly large unique strings, because both formats must ship those same UTF-8 bytes — the schema and tags save nothing there. So the honest answer is “measure on your data”, and the bigger reasons to choose Protobuf are usually the typed contract and codegen, not just bytes.',
        uk: 'Два місця. Перше — назви полів не передаються: поле це однобайтовий tag (номер + wire type) замість лапкованого ключа, повтореного в кожному повідомленні, що великий виграш для записів з багатьма малими полями чи масивів обʼєктів. Друге — цілі кодуються varint, тож малі числа займають один байт замість своїх текстових цифр, а proto3 повністю пропускає дефолти. Економія найбільша для числових, повторюваних, глибоко структурованих даних. Вона зникає до нуля, коли payload переважно великі унікальні рядки, бо обидва формати мусять надіслати ті самі UTF-8-байти — schema й tags там нічого не заощаджують. Тож чесна відповідь — «виміряй на своїх даних», а більші причини брати Protobuf — це зазвичай типізований контракт і codegen, а не лише байти.',
      },
      level: 'senior',
    },
  ],
  seeAlso: ['m3-http-transport', 'm4-data-formats', 'm9-graphql', 'm11-trpc', 'm5-rest', 'm19-errors-status'],
  sources: [
    { title: 'gRPC — Core concepts, architecture and lifecycle (the four call types)', url: 'https://grpc.io/docs/what-is-grpc/core-concepts/' },
    { title: 'Protocol Buffers — Encoding (tag, varint, length-delimited)', url: 'https://protobuf.dev/programming-guides/encoding/' },
    { title: 'Protocol Buffers — Language Guide (proto3)', url: 'https://protobuf.dev/programming-guides/proto3/' },
    { title: 'gRPC — Deadlines', url: 'https://grpc.io/docs/guides/deadlines/' },
    { title: 'gRPC — Status codes and their use', url: 'https://grpc.io/docs/guides/status-codes/' },
    { title: 'gRPC-Web (GitHub) — browser gRPC via a proxy', url: 'https://github.com/grpc/grpc-web' },
    { title: 'Envoy — gRPC support (grpc_web filter, trailers)', url: 'https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/other_protocols/grpc' },
  ],
};
