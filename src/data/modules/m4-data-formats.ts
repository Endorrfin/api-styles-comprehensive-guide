import type { Module } from '../types';

/*
 * m4-data-formats — the encoding substrate every style serialises into (s4). Figure: 'encoding-size'.
 * Eight topics: the two text formats (JSON, XML), the schema binary (Protobuf) and the schemaless binaries
 * (MessagePack, CBOR), the two axes they trade on (text/binary, schema/schemaless), and the two HTTP
 * mechanisms that carry them (content negotiation, compression). Spec facts (JSON RFC 8259, CBOR 8949,
 * Brotli 7932, zstd 8878) web-verified S4 and cited below.
 */
export const m4: Module = {
  id: 'm4-data-formats',
  num: 4,
  section: 's0-foundations',
  order: 4,
  level: 'middle',
  title: { en: 'Data formats & serialization', uk: 'Формати даних і серіалізація' },
  tagline: {
    en: 'JSON, XML, Protobuf, MessagePack, CBOR — text vs binary, schema vs schemaless, and how HTTP carries them.',
    uk: 'JSON, XML, Protobuf, MessagePack, CBOR — text проти binary, schema проти schemaless, і як HTTP їх несе.',
  },
  readMins: 16,
  mentalModel: {
    en: 'A format trades human-readability against size, speed, and a machine-checked schema. Text (JSON/XML) is debuggable and universal but big; binary (Protobuf) is compact and fast but needs a schema; MessagePack/CBOR sit between — binary bytes, no schema. Two axes decide: text↔binary and schemaless↔schema.',
    uk: 'Формат міняє людиночитність на розмір, швидкість і машинно-перевірену schema. Text (JSON/XML) дебажний і універсальний, але великий; binary (Protobuf) компактний і швидкий, але потребує schema; MessagePack/CBOR посередині — binary-байти, без schema. Вирішують дві осі: text↔binary і schemaless↔schema.',
  },
  topics: [
    // ── T1 · JSON ────────────────────────────────────────────────────────────
    {
      id: 'json',
      title: { en: 'JSON — the default', uk: 'JSON — дефолт' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'JSON (RFC 8259) is the lingua franca of web APIs: text, self-describing, schemaless by default, and readable by every language and every human with `curl`. Its data model is deliberately tiny — objects, arrays, strings, numbers, booleans, `null` — which is its strength (universal) and its weakness (missing types you then encode by convention). There is no date type (ISO-8601 strings by convention), no integer/float distinction (every number is a double), and no binary (base64 strings). That simplicity is why JSON won the public web — and why you reach for something else only when size, speed, or a checked contract start to hurt.',
            uk: 'JSON (RFC 8259) — lingua franca web API: text, self-describing, schemaless за замовчуванням, читабельний кожною мовою й кожною людиною через `curl`. Його модель даних навмисно крихітна — objects, arrays, strings, numbers, booleans, `null` — це і сила (універсальність), і слабкість (бракує типів, які потім кодуєш за домовленістю). Немає типу дати (рядки ISO-8601 за домовленістю), немає різниці integer/float (кожне число — double), немає binary (рядки base64). Ця простота — причина, чому JSON виграв публічний веб, і чому по інше тягнешся, лише коли починають боліти розмір, швидкість чи перевірений контракт.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'JSON numbers are doubles — big ids lose precision', uk: 'Числа JSON — це double; великі id втрачають точність' },
          md: {
            en: 'Because every JSON number is an IEEE-754 double, integers above 2^53 silently lose precision — a 64-bit database id or a Twitter-style snowflake can come back *wrong* after a round-trip through JSON. Send large ids as **strings**. This is the most common JSON bug in production APIs, and it never shows up in small test data.',
            uk: 'Оскільки кожне число JSON — це IEEE-754 double, цілі понад 2^53 тихо втрачають точність — 64-бітний id з БД чи snowflake може повернутися *неправильним* після проходу через JSON. Надсилай великі id як **рядки**. Це найпоширеніший баг JSON у продакшн-API, і він ніколи не спливає на малих тестових даних.',
          },
        },
      ],
    },
    // ── T2 · XML ─────────────────────────────────────────────────────────────
    {
      id: 'xml',
      title: { en: 'XML — the elder', uk: 'XML — старійшина' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'XML predates JSON and trades brevity for structure: namespaces, attributes *and* elements, a rich schema language (XSD), and query/transform tooling (XPath, XSLT). It is more verbose and heavier to parse than JSON, but it carries a mature validation and document ecosystem that JSON never had. You still meet XML in SOAP web services (m7), finance and healthcare (HL7), office document formats, and legacy configuration. Choose it when a counterparty mandates it or when you genuinely need document-centric markup — not for a greenfield JSON-shaped API.',
            uk: 'XML старший за JSON і міняє стислість на структуру: namespaces, attributes *і* elements, багата мова schema (XSD) і tooling запитів/трансформацій (XPath, XSLT). Він багатослівніший і важчий у парсингу за JSON, але несе зрілу екосистему валідації й документів, якої в JSON не було. XML досі трапляється в SOAP web services (m7), фінансах і медицині (HL7), офісних форматах і легасі-конфігурації. Обирай його, коли контрагент вимагає, або коли справді потрібна document-centric розмітка — не для нового API у формі JSON.',
          },
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'XML parsers: disable external entities (XXE)', uk: 'XML-парсери: вимикай external entities (XXE)' },
          md: {
            en: 'XML supports external entities — references a document can pull in from a URL or file path. A parser that resolves them by default lets an attacker read local files or trigger SSRF via a crafted payload (XXE). If you must parse XML, disable DTDs / external entity resolution explicitly. It is one of the OWASP top server-side risks and a big reason XML feels dangerous next to JSON.',
            uk: 'XML підтримує external entities — посилання, які документ може підтягнути з URL чи шляху файлу. Парсер, що резолвить їх за замовчуванням, дозволяє атакувальнику читати локальні файли чи тригерити SSRF через crafted payload (XXE). Якщо мусиш парсити XML, явно вимикай DTD / резолвінг external entities. Це один із топових server-side ризиків OWASP і велика причина, чому XML почувається небезпечним поруч із JSON.',
          },
        },
      ],
    },
    // ── T3 · Protobuf ────────────────────────────────────────────────────────
    {
      id: 'protobuf',
      title: { en: 'Protobuf — the schema binary', uk: 'Protobuf — schema-binary' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Protocol Buffers (Protobuf) is a **compiled, schema-first** binary format: you define messages in a `.proto` file, generate code for each language, and both sides share that contract. On the wire a field is a small **tag** (its number + type) followed by a **varint**-encoded value — crucially, **no field names travel**, which is why Protobuf is the most compact common format and the fastest to (de)serialize. Fields are identified by number, so you evolve a schema by adding new numbered fields and never reusing an old number. It is the encoding under gRPC (m10); the price is codegen and payloads you cannot read without the schema.',
            uk: 'Protocol Buffers (Protobuf) — **компільований, schema-first** binary-формат: описуєш повідомлення у файлі `.proto`, генеруєш код для кожної мови, і обидві сторони ділять цей контракт. На дроті поле — це малий **tag** (номер + тип), за яким **varint**-значення — головне, що **назви полів не передаються**, тому Protobuf найкомпактніший серед поширених форматів і найшвидший на (де)серіалізації. Поля ідентифікуються номером, тож schema еволюціонує додаванням нових нумерованих полів і ніколи не перевикористовує старий номер. Це кодування під gRPC (m10); ціна — codegen і payload-и, які без schema не прочитати.',
          },
        },
        {
          kind: 'code',
          lang: 'proto',
          code: `syntax = "proto3";

message Article {
  int64  id    = 1;   // field NUMBERS are the contract, not names
  string title = 2;
  repeated string tags = 3;
}`,
          note: {
            en: 'The field numbers (1, 2, 3) are what the wire carries — rename `title` freely, but never change its number or reuse a retired one, or old and new peers will misread each other.',
            uk: 'Номери полів (1, 2, 3) — це те, що несе дріт — перейменовуй `title` вільно, але ніколи не міняй його номер і не перевикористовуй списаний, інакше старі й нові peer-и читатимуть одне одного неправильно.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Unknown fields are preserved — that’s forward compatibility', uk: 'Невідомі поля зберігаються — це forward compatibility' },
          md: {
            en: 'A Protobuf reader that meets a field number it doesn’t know keeps the bytes instead of discarding them, so an old service can receive, pass through, and re-emit a message a newer service extended — without losing the new fields. That single rule is what makes additive schema evolution safe, and it’s why “add fields, never renumber” is the whole versioning discipline (m18).',
            uk: 'Protobuf-читач, що зустрів невідомий номер поля, зберігає байти замість викидання, тож старий сервіс може отримати, пропустити крізь себе й перевидати повідомлення, яке новіший сервіс розширив — не втрачаючи нових полів. Це єдине правило робить additive-еволюцію schema безпечною, і саме тому «додавай поля, ніколи не перенумеровуй» — уся дисципліна версіонування (m18).',
          },
        },
      ],
    },
    // ── T4 · MessagePack & CBOR ──────────────────────────────────────────────
    {
      id: 'messagepack-cbor',
      title: { en: 'MessagePack & CBOR — binary JSON', uk: 'MessagePack і CBOR — binary JSON' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'MessagePack and CBOR are the middle ground: they keep JSON’s **self-describing** data model — the keys still travel — but encode it as compact bytes, so you get smaller, faster payloads **without a schema or codegen**. Because keys are still present they never get as small as Protobuf, but they drop in as a near-transparent swap for JSON. **CBOR** (RFC 8949) is the IETF-standardized one, extensible with tags for dates and big numbers, and is the encoding under COSE and WebAuthn and much of IoT. **MessagePack** is popular in caches, Redis, and RPC layers. Reach for these when you want JSON’s flexibility with fewer bytes and no build step.',
            uk: 'MessagePack і CBOR — середина: зберігають **self-describing** модель JSON — ключі досі передаються — але кодують її компактними байтами, тож маєш менші, швидші payload-и **без schema чи codegen**. Оскільки ключі присутні, вони ніколи не стають такими малими, як Protobuf, але заходять як майже прозора заміна JSON. **CBOR** (RFC 8949) — стандартизований IETF, розширюваний тегами для дат і великих чисел, це кодування під COSE і WebAuthn та значну частину IoT. **MessagePack** популярний у кешах, Redis і RPC-шарах. Тягнися по них, коли хочеш гнучкість JSON із меншою кількістю байтів і без build-кроку.',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Format', uk: 'Формат' },
            { en: 'Self-describing?', uk: 'Self-describing?' },
            { en: 'Schema?', uk: 'Schema?' },
            { en: 'Readable?', uk: 'Читабельний?' },
          ],
          rows: [
            [
              { en: 'JSON', uk: 'JSON' },
              { en: 'Yes (keys travel)', uk: 'Так (ключі йдуть)' },
              { en: 'Optional', uk: 'Опційна' },
              { en: 'Yes — text', uk: 'Так — текст' },
            ],
            [
              { en: 'MessagePack / CBOR', uk: 'MessagePack / CBOR' },
              { en: 'Yes (keys travel)', uk: 'Так (ключі йдуть)' },
              { en: 'Optional', uk: 'Опційна' },
              { en: 'No — binary', uk: 'Ні — binary' },
            ],
            [
              { en: 'Protobuf', uk: 'Protobuf' },
              { en: 'No (numbers only)', uk: 'Ні (лише номери)' },
              { en: 'Required', uk: 'Обовʼязкова' },
              { en: 'No — needs .proto', uk: 'Ні — треба .proto' },
            ],
          ],
        },
      ],
    },
    // ── T5 · Text vs binary trade-offs (figure) ──────────────────────────────
    {
      id: 'text-vs-binary-tradeoffs',
      title: { en: 'Text vs binary trade-offs', uk: 'Компроміси text проти binary' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'This is the encoding axis from the decision map, made concrete. **Text** buys debuggability and universal reach and costs bytes and parse time; **binary** buys size and speed and costs readability and (often) a schema. But the size gap is not fixed: binary’s lead is largest when payloads are numbers and repeated keys (which text spells out every time and binary compresses to tags), and smallest when the payload is mostly unique strings — because both formats must ship those same bytes. Measure on *your* data before you assume binary is worth the tooling.',
            uk: 'Це вісь encoding із карти рішень, зроблена конкретною. **Text** купує дебажність і універсальну доступність, коштує байтами й часом парсингу; **binary** купує розмір і швидкість, коштує читабельністю й (часто) schema. Але розрив у розмірі не фіксований: перевага binary найбільша, коли payload — це числа й повторювані ключі (які text виписує щоразу, а binary стискає в теги), і найменша, коли payload переважно унікальні рядки — бо обидва формати мусять надіслати ті самі байти. Виміряй на *своїх* даних, перш ніж припускати, що binary вартий tooling-у.',
          },
        },
        {
          kind: 'figure',
          fig: 'encoding-size',
          caption: {
            en: 'The same small record across five encodings. Text formats spell out field names on every message; binary drops (Protobuf) or shortens them. The gap widens with numeric, repetitive data.',
            uk: 'Той самий малий запис у пʼяти кодуваннях. Text виписує назви полів у кожному повідомленні; binary їх прибирає (Protobuf) або скорочує. Розрив ширшає на числових, повторюваних даних.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Default to text at the edge, consider binary inside', uk: 'Дефолти в text на межі, розглянь binary всередині' },
          md: {
            en: 'At a public boundary, JSON’s debuggability and reach usually beat the bytes you’d save — thousands of unknown clients, `curl`, and browser dev-tools matter more than payload size. Binary earns its keep *between your own services*, where you control both ends, traffic is heavy, and a schema is a feature, not a burden. Same lesson as the coupling axis: loose and readable at the edge, tight and compact inside.',
            uk: 'На публічній межі дебажність і доступність JSON зазвичай перемагають зекономлені байти — тисячі невідомих клієнтів, `curl` і browser dev-tools важливіші за розмір payload-а. Binary виправдовує себе *між власними сервісами*, де контролюєш обидва кінці, трафік важкий, а schema — це фіча, не тягар. Той самий урок, що й вісь coupling: loose і читабельно на межі, tight і компактно всередині.',
          },
        },
      ],
    },
    // ── T6 · Schema vs schemaless ────────────────────────────────────────────
    {
      id: 'schema-vs-schemaless',
      title: { en: 'Schema vs schemaless', uk: 'Schema проти schemaless' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The deeper axis is *who checks the shape, and when*. **Schemaless** formats (JSON, MessagePack, CBOR) keep the shape in your code and docs: flexible and forgiving, but the contract is unenforced, so drift and malformed payloads surface at runtime. **Schema-based** formats (Protobuf, Avro, XML+XSD) put the shape in a machine-checked definition: a mismatch is caught at build or registration time, codegen gives you typed clients, and additive evolution is safe — at the cost that every consumer needs the schema. Avro is the notable hybrid: the schema travels *with* the data (in files) or via a registry, so readers always have it.',
            uk: 'Глибша вісь — *хто перевіряє форму й коли*. **Schemaless**-формати (JSON, MessagePack, CBOR) тримають форму в коді й документації: гнучко й поблажливо, але контракт не forced, тож drift і malformed payload-и спливають у рантаймі. **Schema-based**-формати (Protobuf, Avro, XML+XSD) кладуть форму в машинно-перевірене визначення: розбіжність ловиться на build чи реєстрації, codegen дає типізованих клієнтів, а additive-еволюція безпечна — ціною того, що кожен consumer потребує schema. Avro — помітний гібрид: schema подорожує *разом* із даними (у файлах) чи через registry, тож у читачів вона завжди є.',
          },
        },
        {
          kind: 'compare',
          a: { en: 'Schemaless (JSON, CBOR)', uk: 'Schemaless (JSON, CBOR)' },
          b: { en: 'Schema-based (Protobuf, Avro)', uk: 'Schema-based (Protobuf, Avro)' },
          rows: [
            [
              { en: 'Contract lives in', uk: 'Контракт живе в' },
              { en: 'Code + docs (unenforced)', uk: 'Коді + документації (не forced)' },
              { en: 'A machine-checked schema', uk: 'Машинно-перевіреній schema' },
            ],
            [
              { en: 'Mismatch caught', uk: 'Розбіжність ловиться' },
              { en: 'At runtime', uk: 'У рантаймі' },
              { en: 'At build / registration', uk: 'На build / реєстрації' },
            ],
            [
              { en: 'Tooling', uk: 'Tooling' },
              { en: 'None needed; validate yourself (Zod, JSON Schema)', uk: 'Не треба; валідуй сам (Zod, JSON Schema)' },
              { en: 'Codegen, typed clients', uk: 'Codegen, типізовані клієнти' },
            ],
            [
              { en: 'Best at', uk: 'Найкраще для' },
              { en: 'Public edges, fast iteration', uk: 'Публічних меж, швидкої ітерації' },
              { en: 'Internal services, high volume', uk: 'Внутрішніх сервісів, великого обсягу' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Schemaless ≠ validation-free', uk: 'Schemaless ≠ без валідації' },
          md: {
            en: 'Choosing JSON doesn’t mean skipping the contract — it means *you* enforce it. Validate every inbound payload at the boundary with a runtime schema (Zod, JSON Schema, class-validator). The difference from Protobuf is only *where* the check lives: a library you call vs a compiler that generated your types. Never trust an unvalidated JSON body.',
            uk: 'Вибір JSON не означає пропустити контракт — означає, що *ти* його enforced-иш. Валідуй кожен вхідний payload на межі рантайм-schema (Zod, JSON Schema, class-validator). Різниця з Protobuf лише в тому, *де* живе перевірка: бібліотека, яку викликаєш, проти компілятора, що згенерував типи. Ніколи не довіряй невалідованому JSON-тілу.',
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
            en: 'HTTP lets one endpoint speak several formats through **content negotiation**. The client advertises what it can accept with `Accept` (and `Accept-Encoding`, `Accept-Language`); the server picks a representation and declares it with `Content-Type` (and `Content-Encoding`). If it can’t satisfy the request it returns `406 Not Acceptable`. The same mechanism carries API versioning when you put the version in the media type — `application/vnd.example.v2+json` — so a client asks for the shape it understands and the server serves it, all without a new URL.',
            uk: 'HTTP дозволяє одному endpoint говорити кількома форматами через **content negotiation**. Клієнт оголошує, що приймає, через `Accept` (і `Accept-Encoding`, `Accept-Language`); сервер обирає representation і оголошує його через `Content-Type` (і `Content-Encoding`). Якщо не може задовольнити запит — повертає `406 Not Acceptable`. Той самий механізм несе версіонування API, коли кладеш версію в media type — `application/vnd.example.v2+json` — тож клієнт просить форму, яку розуміє, а сервер її віддає, без нового URL.',
          },
        },
        {
          kind: 'code',
          lang: 'http',
          code: `GET /articles/42 HTTP/1.1
Accept: application/json
Accept-Encoding: br, gzip

HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Encoding: br
Vary: Accept, Accept-Encoding`,
          note: {
            en: 'The `Vary` header tells caches the response depends on `Accept`/`Accept-Encoding`, so a gzip client and a Brotli client don’t get served each other’s bytes from a shared cache.',
            uk: '`Vary` каже кешам, що відповідь залежить від `Accept`/`Accept-Encoding`, тож gzip-клієнт і Brotli-клієнт не отримають байти одне одного зі спільного кешу.',
          },
        },
      ],
    },
    // ── T8 · Compression ─────────────────────────────────────────────────────
    {
      id: 'compression',
      title: { en: 'Compression', uk: 'Compression' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Text formats repeat themselves — field names, tags, whitespace — so they compress beautifully, making compression the cheapest latency win for a JSON API. **gzip** (DEFLATE) is universal and the safe default. **Brotli** (RFC 7932) compresses text noticeably smaller and is supported in every modern browser, so it’s the usual pick for static and text responses. **zstd** (RFC 8878) trades a little ratio for much faster decompression and is now shipping in browsers too. All three are chosen through the same `Accept-Encoding` / `Content-Encoding` handshake, so you enable them at the server or CDN and clients negotiate automatically.',
            uk: 'Text-формати повторюються — назви полів, теги, пробіли — тож стискаються чудово, що робить compression найдешевшим виграшем latency для JSON-API. **gzip** (DEFLATE) універсальний і безпечний дефолт. **Brotli** (RFC 7932) стискає text помітно менше й підтримується кожним сучасним браузером, тож це звичний вибір для статичних і текстових відповідей. **zstd** (RFC 8878) міняє трохи коефіцієнта на значно швидшу декомпресію й тепер теж є в браузерах. Усі три обираються тим самим handshake `Accept-Encoding` / `Content-Encoding`, тож вмикаєш їх на сервері чи CDN, а клієнти домовляються самі.',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Encoding', uk: 'Кодування' },
            { en: 'Ratio', uk: 'Коефіцієнт' },
            { en: 'Speed', uk: 'Швидкість' },
            { en: 'Use for', uk: 'Для чого' },
          ],
          rows: [
            [
              { en: 'gzip', uk: 'gzip' },
              { en: 'Good', uk: 'Добрий' },
              { en: 'Fast', uk: 'Швидко' },
              { en: 'Universal safe default', uk: 'Універсальний безпечний дефолт' },
            ],
            [
              { en: 'Brotli (br)', uk: 'Brotli (br)' },
              { en: 'Best on text', uk: 'Найкращий на text' },
              { en: 'Slower to compress', uk: 'Повільніший на стисненні' },
              { en: 'Static & text responses', uk: 'Статичні й текстові відповіді' },
            ],
            [
              { en: 'zstd', uk: 'zstd' },
              { en: 'Near-Brotli', uk: 'Майже Brotli' },
              { en: 'Very fast decompress', uk: 'Дуже швидка декомпресія' },
              { en: 'Dynamic, latency-sensitive', uk: 'Динамічні, latency-чутливі' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'Don’t compress secrets mixed with attacker input (BREACH/CRIME)', uk: 'Не стискай секрети з вводом атакувальника (BREACH/CRIME)' },
          md: {
            en: 'Compression size is observable, and BREACH/CRIME-class attacks exploit it: if a response mixes a secret (a CSRF token) with attacker-influenced text and is then compressed over TLS, the response length leaks the secret byte by byte. Don’t compress responses that combine sensitive values with reflected input, and keep CSRF tokens out of compressed bodies. Also skip compressing tiny or already-compressed payloads (images, video) — you pay CPU for nothing.',
            uk: 'Розмір після стиснення спостережуваний, і атаки класу BREACH/CRIME це експлуатують: якщо відповідь змішує секрет (CSRF-токен) із текстом під впливом атакувальника й потім стискається над TLS, довжина відповіді зливає секрет побайтно. Не стискай відповіді, що поєднують чутливі значення з reflected-вводом, і тримай CSRF-токени поза стиснутими тілами. Також не стискай крихітні чи вже стиснуті payload-и (зображення, відео) — платиш CPU дарма.',
          },
        },
      ],
    },
  ],
  keyPoints: [
    { en: 'JSON (RFC 8259) is text, schemaless, and universal — but every number is a double, so ids above 2^53 must be strings.', uk: 'JSON (RFC 8259) — text, schemaless і універсальний — але кожне число це double, тож id понад 2^53 мають бути рядками.' },
    { en: 'Protobuf is schema-first binary: field numbers travel, not names, making it the most compact — at the cost of codegen and readability.', uk: 'Protobuf — schema-first binary: передаються номери полів, не назви, що робить його найкомпактнішим — ціною codegen і читабельності.' },
    { en: 'MessagePack and CBOR are “binary JSON”: schemaless, self-describing, smaller than JSON but larger than Protobuf.', uk: 'MessagePack і CBOR — «binary JSON»: schemaless, self-describing, менші за JSON, але більші за Protobuf.' },
    { en: 'Two axes decide a format: text↔binary (debuggability vs size/speed) and schemaless↔schema (flexibility vs a checked contract).', uk: 'Формат вирішують дві осі: text↔binary (дебажність проти розміру/швидкості) і schemaless↔schema (гнучкість проти перевіреного контракту).' },
    { en: 'Content negotiation (Accept/Content-Type) lets one endpoint serve many formats and versions; Vary keeps caches correct.', uk: 'Content negotiation (Accept/Content-Type) дозволяє одному endpoint віддавати багато форматів і версій; Vary тримає кеші коректними.' },
    { en: 'Compression (gzip/Brotli/zstd via Accept-Encoding) is the cheapest win for text APIs — but never compress secrets mixed with attacker input.', uk: 'Compression (gzip/Brotli/zstd через Accept-Encoding) — найдешевший виграш для text-API — але ніколи не стискай секрети з вводом атакувальника.' },
  ],
  pitfalls: [
    {
      title: { en: 'Sending 64-bit ids as JSON numbers', uk: 'Надсилати 64-бітні id як JSON-числа' },
      body: {
        en: 'A number above 2^53 silently loses precision through a JSON round-trip, so a big database id comes back altered. Serialize large ids and snowflakes as strings. It passes every small test and breaks in production.',
        uk: 'Число понад 2^53 тихо втрачає точність через JSON round-trip, тож великий id з БД повертається зміненим. Серіалізуй великі id і snowflake як рядки. Це проходить кожен малий тест і ламається в продакшні.',
      },
    },
    {
      title: { en: 'Reaching for binary at the public edge', uk: 'Хапати binary на публічній межі' },
      body: {
        en: 'Protobuf between thousands of unknown external clients trades away `curl`-debuggability and universal reach to save bytes most public APIs don’t need. Keep the edge JSON; put binary between services you control.',
        uk: 'Protobuf між тисячами невідомих зовнішніх клієнтів міняє `curl`-дебажність і універсальну доступність на байти, яких більшості публічних API не треба. Тримай межу на JSON; став binary між сервісами, які контролюєш.',
      },
    },
    {
      title: { en: 'Treating “schemaless” as “no validation”', uk: 'Сприймати «schemaless» як «без валідації»' },
      body: {
        en: 'JSON has no built-in contract, so an unvalidated body is untyped and hostile. Enforce a runtime schema (Zod, JSON Schema) at the boundary — schemaless moves the check into your code, it doesn’t remove it.',
        uk: 'JSON не має вбудованого контракту, тож невалідоване тіло — нетипізоване й вороже. Enforced-ь рантайм-schema (Zod, JSON Schema) на межі — schemaless переносить перевірку в твій код, а не прибирає її.',
      },
    },
  ],
  interview: [
    {
      q: { en: 'When would you pick Protobuf over JSON, and what do you give up?', uk: 'Коли обереш Protobuf замість JSON і що втрачаєш?' },
      a: {
        en: 'Protobuf pays off between services I control where traffic is heavy and latency matters: it’s the most compact common format (field numbers, not names, on the wire), fast to (de)serialize, and its schema gives typed clients via codegen plus safe additive evolution. I give up human-readability — you can’t `curl` and eyeball it — and universal reach, because every consumer needs the `.proto` and a generated client, and browsers need gRPC-web. So I’d default to JSON at public edges for debuggability and reach, and use Protobuf/gRPC internally. It’s the text-vs-binary and schemaless-vs-schema axes decided by who owns each end.',
        uk: 'Protobuf виправдовується між сервісами, які контролюю, де трафік важкий і latency важить: це найкомпактніший поширений формат (на дроті номери полів, не назви), швидкий на (де)серіалізації, а його schema дає типізованих клієнтів через codegen плюс безпечну additive-еволюцію. Втрачаю людиночитність — не `curl`-неш і не роздивишся — і універсальну доступність, бо кожному consumer потрібен `.proto` і згенерований клієнт, а браузерам — gRPC-web. Тож дефолтив би в JSON на публічних межах заради дебажності й доступності, а Protobuf/gRPC — усередині. Це осі text-проти-binary і schemaless-проти-schema, вирішені тим, хто володіє кожним кінцем.',
      },
      level: 'middle',
    },
    {
      q: { en: 'A partner says our API “corrupts” large account ids. No 500s, data looks fine in our DB. What’s happening?', uk: 'Партнер каже, що наш API «псує» великі account id. Жодних 500, у нашій БД дані ок. Що відбувається?' },
      a: {
        en: 'Almost certainly JSON number precision. Every JSON number is an IEEE-754 double, which can represent integers exactly only up to 2^53; a 64-bit account id above that gets rounded when the client’s JSON parser reads it, so the value they receive differs from what we stored — no error anywhere, just a wrong number. The fix is to serialize large ids as strings (or use a big-int-aware parser on both ends). It’s the canonical JSON gotcha and it only appears once ids grow past ~9 quadrillion.',
        uk: 'Майже напевно точність чисел JSON. Кожне число JSON — це IEEE-754 double, що точно представляє цілі лише до 2^53; 64-бітний account id понад це округлюється, коли JSON-парсер клієнта його читає, тож отримане значення відрізняється від збереженого — жодної помилки, просто неправильне число. Виправлення — серіалізувати великі id як рядки (або використати big-int-парсер з обох боків). Це канонічна пастка JSON, і вона зʼявляється, лише коли id переростають ~9 квадрильйонів.',
      },
      level: 'middle',
    },
  ],
  seeAlso: ['m2-decision-axes', 'm3-http-transport', 'm5-rest', 'm7-soap-xml', 'm10-grpc', 'm18-versioning'],
  sources: [
    { title: 'RFC 8259 — The JavaScript Object Notation (JSON) Data Interchange Format', url: 'https://www.rfc-editor.org/rfc/rfc8259.html' },
    { title: 'Protocol Buffers — Documentation (proto3, encoding)', url: 'https://protobuf.dev/' },
    { title: 'RFC 8949 — Concise Binary Object Representation (CBOR)', url: 'https://www.rfc-editor.org/rfc/rfc8949.html' },
    { title: 'MessagePack — specification', url: 'https://msgpack.org/' },
    { title: 'MDN — Content negotiation', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Content_negotiation' },
    { title: 'RFC 7932 — Brotli Compressed Data Format', url: 'https://www.rfc-editor.org/rfc/rfc7932.html' },
    { title: 'RFC 8878 — Zstandard Compression', url: 'https://www.rfc-editor.org/rfc/rfc8878.html' },
  ],
};
