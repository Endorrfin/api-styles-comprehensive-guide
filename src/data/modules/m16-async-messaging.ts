import type { Module } from '../types';

/*
 * m16-async-messaging — the broker landscape (s3, Real-time/push/event-driven). Right-sized: no hero
 * sim; figure 'broker-topologies' (point-to-point vs queue/competing-consumers vs pub-sub log). Seven
 * curriculum topics: broker-vs-point-to-point (figure) → mqtt-iot-qos → amqp-exchanges-queues →
 * kafka-log-partitions-consumer-groups → delivery-guarantees → when-an-api-should-be-a-message →
 * event-driven-arch (verdict). Balanced weight: one topic each per broker + the concept spine.
 * Facts web-verified S10b (2026-07): MQTT 3.1.1 (2014) & 5.0 (2019) both current OASIS Standards; QoS
 * 0/1/2 = at-most/at-least/exactly-once, QoS 2 = 4-packet handshake (PUBLISH→PUBREC→PUBREL→PUBCOMP).
 * AMQP 0-9-1 (RabbitMQ: exchange→binding→queue, ack/redeliver) and AMQP 1.0 (ISO/IEC 19464, OASIS —
 * wire-only, NO exchange model) are DIFFERENT protocols, not versions; RabbitMQ keeps 0-9-1 indefinitely
 * and speaks 1.0 natively (4.x). Kafka = append-only log, partitions (order only within one), consumer
 * groups (1 consumer per partition), consumer-tracked offsets, retention (not delete-on-read); Kafka 4.0
 * (2025-03-18) is KRaft-only, ZooKeeper removed. EOS = idempotent producer (PID + per-partition seq) +
 * transactions + read_committed, within the Kafka boundary; end-to-end exactly-once is at-least-once +
 * idempotent consumer (ties to m15/m21).
 */
export const m16: Module = {
  id: 'm16-async-messaging',
  num: 16,
  section: 's3-realtime-events',
  order: 5,
  level: 'senior',
  title: { en: 'Async messaging landscape', uk: 'Ландшафт async messaging' },
  tagline: {
    en: 'MQTT, AMQP, Kafka — when an API is a message.',
    uk: 'MQTT, AMQP, Kafka — коли API — це повідомлення.',
  },
  readMins: 14,
  mentalModel: {
    en: 'A **broker** decouples sender from receiver **in time**: the producer drops a message and moves on; consumers read at their own pace. The API stops being a call you *wait on* and becomes a fact you *drop in a buffer* — buying temporal decoupling, load-leveling, and fan-out, at the price of the immediate answer. The three brokers you meet — MQTT, AMQP/RabbitMQ, Kafka — differ mainly in one axis: does the *broker* hold the bookkeeping (route + ack + forget), or does the *log* keep everything and let the *consumer* track its own position?',
    uk: '**Брокер** розчіплює відправника й отримувача **в часі**: producer кидає повідомлення й іде далі; consumers читають у своєму темпі. API перестає бути викликом, на який ти *чекаєш*, і стає фактом, який ти *кидаєш у буфер* — купуючи темпоральне розчеплення, load-leveling і fan-out ціною негайної відповіді. Три брокери, які ти зустрінеш — MQTT, AMQP/RabbitMQ, Kafka — різняться головно однією віссю: чи *брокер* тримає облік (маршрут + ack + забути), чи *лог* зберігає все й дає *consumer*-у самому відстежувати свою позицію?',
  },
  topics: [
    // ── T1 · Broker vs point-to-point (figure) ────────────────────────────────
    {
      id: 'broker-vs-point-to-point',
      title: { en: 'Broker vs point-to-point', uk: 'Брокер проти point-to-point' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Every style so far has been **point-to-point** and synchronous in shape: a client calls a server, waits, and gets an answer (REST m5, gRPC m10, GraphQL m9) — or holds a live connection open (WebSockets m12, SSE m13). **Async messaging inserts a broker in the middle.** The sender (**producer**) hands a message to the broker and moves on; the receiver (**consumer**) reads it when *it* is ready. That indirection buys three things a direct call cannot: **temporal decoupling** (producer and consumer need not be up at the same time), **buffering / load-leveling** (a traffic spike is absorbed by the queue instead of knocking a slow consumer over), and **fan-out** (one event delivered to many independent consumers). The price is the immediate answer: synchronously, the producer learns nothing about the outcome. This module surveys the three brokers you will actually meet — **MQTT** (IoT), **AMQP/RabbitMQ** (routed work queues), **Kafka** (replayable log) — and the delivery guarantees that separate them.',
            uk: 'Кожен стиль досі був **point-to-point** і синхронним за формою: клієнт кличе сервер, чекає й отримує відповідь (REST m5, gRPC m10, GraphQL m9) — або тримає живе зʼєднання відкритим (WebSockets m12, SSE m13). **Async messaging вставляє брокер посередині.** Відправник (**producer**) віддає повідомлення брокеру й іде далі; отримувач (**consumer**) читає його, коли готовий *він*. Ця непрямість купує три речі, яких прямий виклик не може: **темпоральне розчеплення** (producer і consumer не мусять бути піднятими одночасно), **буферизацію / load-leveling** (сплеск трафіку поглинається чергою, а не валить повільного consumer-а) і **fan-out** (одна подія доставлена багатьом незалежним consumer-ам). Ціна — негайна відповідь: синхронно producer не дізнається про результат. Цей модуль оглядає три брокери, які ти реально зустрінеш — **MQTT** (IoT), **AMQP/RabbitMQ** (маршрутизовані work-черги), **Kafka** (реплейований лог) — і гарантії доставки, що їх розділяють.',
          },
        },
        {
          kind: 'figure',
          fig: 'broker-topologies',
          caption: {
            en: 'Three shapes: a synchronous point-to-point call (REST/gRPC); a queue whose messages are shared across competing consumers (AMQP/RabbitMQ); and a retained, replayable log read independently by many consumer groups (Kafka).',
            uk: 'Три форми: синхронний point-to-point виклик (REST/gRPC); черга, чиї повідомлення діляться між конкуруючими consumer-ами (AMQP/RabbitMQ); і збережений, реплейований лог, який незалежно читає багато consumer-груп (Kafka).',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'A message is a fact, not a request', uk: 'Повідомлення — це факт, а не запит' },
          md: {
            en: 'A request says “do this and tell me what happened.” A message (an **event**) says “this happened” and is thrown over the wall. The mental flip: instead of the caller choosing who does the work and waiting, the producer states a fact and any number of consumers react — the producer does not know or care who. That inversion is the whole value (decoupling, fan-out) and the whole difficulty (no synchronous answer, eventual consistency, harder debugging — T7).',
            uk: 'Запит каже «зроби це й скажи, що сталося». Повідомлення (**подія**) каже «це сталося» і летить через стіну. Ментальний переворот: замість того щоб викликач обирав, хто робить роботу, і чекав, producer констатує факт, а будь-яка кількість consumer-ів реагує — producer не знає й не переймається ким. Ця інверсія — і вся цінність (розчеплення, fan-out), і вся складність (немає синхронної відповіді, eventual consistency, важчий дебаг — T7).',
          },
        },
      ],
    },
    // ── T2 · MQTT & QoS ───────────────────────────────────────────────────────
    {
      id: 'mqtt-iot-qos',
      title: { en: 'MQTT: pub/sub for IoT & QoS levels', uk: 'MQTT: pub/sub для IoT і рівні QoS' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: '**MQTT** (MQ Telemetry Transport) is the lightweight pub/sub protocol of IoT: a tiny **fixed header as small as 2 bytes**, built for constrained devices over lossy, low-bandwidth networks. Clients publish and subscribe to hierarchical **topics** (`sensors/floor2/+/temp`, with `+` single-level and `#` multi-level wildcards) through a central broker. Handy extras: **retained messages** (the broker keeps the last value per topic so a new subscriber gets current state immediately) and a **Last Will & Testament** (a message the broker publishes if a client drops unexpectedly). Its headline is three **QoS** levels trading reliability for cost: **QoS 0 — at most once** (fire-and-forget, may be lost), **QoS 1 — at least once** (PUBACK-confirmed, may duplicate), **QoS 2 — exactly once** (a four-packet handshake `PUBLISH → PUBREC → PUBREL → PUBCOMP`, no loss and no duplicate — the most expensive). Two versions are current **OASIS Standards**: **3.1.1** (2014) and **5.0** (2019, adding reason codes, session expiry, shared subscriptions, topic aliases); a 5.0 broker still accepts 3.1.1 clients.',
            uk: '**MQTT** (MQ Telemetry Transport) — легкий pub/sub-протокол IoT: крихітний **фіксований header від 2 байтів**, зроблений для обмежених пристроїв над втратними, вузькосмуговими мережами. Клієнти публікують і підписуються на ієрархічні **topics** (`sensors/floor2/+/temp`, з `+` — один рівень і `#` — багато рівнів wildcard) через центральний брокер. Зручні додатки: **retained messages** (брокер тримає останнє значення на topic, тож новий підписник одразу отримує поточний стан) і **Last Will & Testament** (повідомлення, яке брокер публікує, якщо клієнт несподівано відпав). Головне — три рівні **QoS**, що міняють надійність на ціну: **QoS 0 — at most once** (fire-and-forget, може загубитися), **QoS 1 — at least once** (підтверджено PUBACK, може дублюватися), **QoS 2 — exactly once** (чотирипакетне рукостискання `PUBLISH → PUBREC → PUBREL → PUBCOMP`, без втрат і без дублікатів — найдорожче). Дві версії — чинні **OASIS Standards**: **3.1.1** (2014) і **5.0** (2019, додає reason codes, session expiry, shared subscriptions, topic aliases); брокер 5.0 усе ще приймає клієнтів 3.1.1.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'QoS is per hop, not end-to-end', uk: 'QoS — на хоп, а не наскрізь' },
          md: {
            en: 'A QoS level is negotiated **independently on each hop** — publisher→broker and broker→subscriber — not as one end-to-end contract across the broker. A publisher can send at QoS 2 while a subscriber receives at QoS 1. So even MQTT’s “exactly once” is a hop guarantee, not a promise that the far end processes the message exactly once — that is still the consumer’s job (T5).',
            uk: 'Рівень QoS узгоджується **незалежно на кожному хопі** — publisher→broker і broker→subscriber — а не як один наскрізний контракт через брокер. Publisher може слати на QoS 2, тоді як subscriber отримує на QoS 1. Тож навіть «exactly once» у MQTT — це гарантія хопа, а не обіцянка, що дальній кінець обробить повідомлення рівно раз — це досі робота consumer-а (T5).',
          },
        },
      ],
    },
    // ── T3 · AMQP: exchanges & queues ─────────────────────────────────────────
    {
      id: 'amqp-exchanges-queues',
      title: { en: 'AMQP / RabbitMQ: exchanges & queues', uk: 'AMQP / RabbitMQ: exchanges і queues' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: '**AMQP 0-9-1** — the protocol RabbitMQ made famous — is the opposite philosophy from Kafka: a **smart broker** with a rich routing model baked into the wire. Producers publish to an **exchange**, never directly to a queue; **bindings** (rules, usually a routing key) connect exchanges to **queues**; consumers read from queues, and the broker tracks per-message **acknowledgements**, redelivering anything un-acked. Four exchange types cover most routing: **direct** (exact routing-key match), **fanout** (copy to every bound queue — pub/sub), **topic** (wildcard key patterns like `order.*.eu`), and **headers** (match on message attributes). This is what you reach for when you need **flexible per-message routing and reliable work distribution**: a task queue with competing consumers, priorities, per-message TTLs, and dead-lettering (m15).',
            uk: '**AMQP 0-9-1** — протокол, який прославив RabbitMQ — це протилежна Kafka філософія: **розумний брокер** із багатою моделлю маршрутизації, вбудованою у wire. Producers публікують в **exchange**, ніколи прямо в чергу; **bindings** (правила, зазвичай routing key) зʼєднують exchanges із **queues**; consumers читають із черг, а брокер відстежує per-message **acknowledgements**, передоставляючи все не-ack-нуте. Чотири типи exchange покривають більшість маршрутизації: **direct** (точний збіг routing key), **fanout** (копія в кожну звʼязану чергу — pub/sub), **topic** (wildcard-патерни ключа як `order.*.eu`) і **headers** (збіг за атрибутами повідомлення). Це те, до чого тягнешся, коли треба **гнучка per-message маршрутизація й надійний розподіл роботи**: task-черга з конкуруючими consumer-ами, пріоритети, per-message TTL і dead-lettering (m15).',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'AMQP 1.0 is a different protocol, not a version bump', uk: 'AMQP 1.0 — це інший протокол, а не апгрейд версії' },
          md: {
            en: 'Despite the name, **AMQP 0-9-1 and AMQP 1.0 are not revisions of one idea — they are different protocols.** 0-9-1 bakes the exchange/queue/binding model into the wire (the RabbitMQ classic model). **AMQP 1.0** (ISO/IEC 19464, an OASIS Standard) defines *only* the peer-to-peer wire protocol between nodes — there are **no exchanges or queues in the spec**; the broker’s topology is out of scope, which is what makes it a vendor-neutral wire between different brokers (Azure Service Bus, ActiveMQ). When someone says “AMQP,” they almost always mean 0-9-1. RabbitMQ supports 0-9-1 indefinitely and speaks 1.0 natively as of its 4.x line.',
            uk: 'Попри назву, **AMQP 0-9-1 і AMQP 1.0 — не редакції однієї ідеї, це різні протоколи.** 0-9-1 вбудовує модель exchange/queue/binding у wire (класична модель RabbitMQ). **AMQP 1.0** (ISO/IEC 19464, OASIS Standard) визначає *лише* peer-to-peer wire-протокол між вузлами — у специфікації **немає ні exchanges, ні queues**; топологія брокера поза межами, і саме це робить його vendor-нейтральним wire між різними брокерами (Azure Service Bus, ActiveMQ). Коли хтось каже «AMQP», майже завжди мають на увазі 0-9-1. RabbitMQ підтримує 0-9-1 безстроково й говорить 1.0 нативно з лінії 4.x.',
          },
        },
      ],
    },
    // ── T4 · Kafka: the log ───────────────────────────────────────────────────
    {
      id: 'kafka-log-partitions-consumer-groups',
      title: { en: 'Kafka: the partitioned log', uk: 'Kafka: партиціонований лог' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Kafka is **not a queue that deletes on read — it is a distributed, append-only log you can replay.** A **topic** is split into **partitions**; each partition is an ordered, immutable sequence, and **ordering is guaranteed only within a partition**, not across the topic (the partition key decides where a message lands — same key, same partition, so per-key order holds). Consumers join a **consumer group**; the group’s partitions are divided among its members so **each partition is read by exactly one consumer in the group** — that is how Kafka scales a topic horizontally (and why parallelism is capped at the partition count). Crucially, consumers track their own **offset** (position in the log) and **pull** at their own pace; messages are retained by **time or size, not deleted when consumed**, so a fresh consumer group can replay from offset 0 and a bug fix can reprocess last week. Since **Kafka 4.0 (March 2025) the cluster is KRaft-only** — the old ZooKeeper metadata dependency is removed. Reach for Kafka when you need **high-throughput event streaming, replay, and many independent consumers** off one durable log.',
            uk: 'Kafka — це **не черга, що видаляє при читанні, а розподілений append-only лог, який можна реплеїти.** **Topic** розбитий на **partitions**; кожна partition — впорядкована незмінна послідовність, і **порядок гарантований лише в межах partition**, а не по topic (partition key вирішує, куди сяде повідомлення — той самий ключ → та сама partition, тож порядок на ключ тримається). Consumers приєднуються до **consumer group**; partitions групи діляться між її членами, тож **кожну partition читає рівно один consumer у групі** — так Kafka масштабує topic горизонтально (і тому паралелізм обмежений кількістю partitions). Головне: consumers самі відстежують свій **offset** (позицію в лозі) і **тягнуть** у своєму темпі; повідомлення зберігаються за **часом або розміром, а не видаляються при споживанні**, тож свіжа consumer group може реплеїти з offset 0, а фікс бага — переобробити минулий тиждень. Оскільки **Kafka 4.0 (березень 2025) кластер лише на KRaft** — стару залежність метаданих від ZooKeeper прибрано. Бери Kafka, коли треба **високопропускний event-streaming, replay і багато незалежних consumer-ів** з одного надійного логу.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Smart broker vs smart consumer', uk: 'Розумний брокер проти розумного consumer-а' },
          md: {
            en: 'RabbitMQ is a **smart broker**: it routes, tracks per-message acks, and forgets a message once acked — the broker holds the bookkeeping. Kafka is a **dumb pipe with smart consumers**: it just appends to a log and keeps it; the *consumer* owns its offset and decides what has been processed. That single difference explains most of the “RabbitMQ vs Kafka” debate — choose the broker’s bookkeeping (per-message routing, work queues, acks) or the log’s durability (replay, high throughput, many readers).',
            uk: 'RabbitMQ — **розумний брокер**: маршрутизує, відстежує per-message acks і забуває повідомлення після ack — облік у брокера. Kafka — **дурна труба з розумними consumer-ами**: просто дописує в лог і зберігає його; *consumer* володіє своїм offset і вирішує, що оброблено. Ця єдина різниця пояснює більшість дебатів «RabbitMQ проти Kafka» — обери облік брокера (per-message маршрутизація, work-черги, acks) або довговічність логу (replay, висока пропускність, багато читачів).',
          },
        },
      ],
    },
    // ── T5 · Delivery guarantees ──────────────────────────────────────────────
    {
      id: 'delivery-guarantees',
      title: { en: 'Delivery guarantees: the exactly-once myth', uk: 'Гарантії доставки: міф exactly-once' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The spine that ties webhooks (m15) and every broker together. Three levels: **at-most-once** (send and forget — nothing duplicated, but messages can be lost — MQTT QoS 0); **at-least-once** (retry until acknowledged — nothing lost, but a lost ack means a duplicate — MQTT QoS 1, Kafka’s practical default, webhooks); and **exactly-once** (never lost, never duplicated). The senior truth: **exactly-once *delivery* end-to-end is effectively a myth** — the network can always drop the ack after the work is done, forcing a retry. What you actually engineer is **at-least-once delivery + an idempotent consumer** (dedup on a message id / idempotency key, m15/m21), which yields exactly-once *effect*. The brokers only *approximate* true exactly-once, and only inside a boundary: MQTT **QoS 2** does it **per hop** with its four-packet handshake; Kafka’s **exactly-once semantics** combine an **idempotent producer** (a producer id + per-partition sequence number that dedups retries) with **transactions** (atomic multi-partition writes) and `read_committed` consumers — powerful *within* Kafka’s read-process-write loop, but crossing to an external system still needs your own idempotency.',
            uk: 'Хребет, що звʼязує webhooks (m15) і кожен брокер. Три рівні: **at-most-once** (надіслав і забув — ніщо не дублюється, але повідомлення можуть губитися — MQTT QoS 0); **at-least-once** (retry до підтвердження — ніщо не губиться, але загублений ack = дублікат — MQTT QoS 1, практичний дефолт Kafka, webhooks); і **exactly-once** (ніколи не втрачено, ніколи не дубльовано). Senior-істина: **exactly-once *доставка* наскрізь — фактично міф** — мережа завжди може впустити ack після виконаної роботи, змусивши retry. Насправді ти інженериш **at-least-once доставку + ідемпотентний consumer** (dedup за message id / idempotency key, m15/m21), що дає exactly-once *ефект*. Брокери лише *наближають* справжній exactly-once, і лише всередині межі: MQTT **QoS 2** робить це **на хоп** своїм чотирипакетним рукостисканням; **exactly-once semantics** Kafka поєднують **idempotent producer** (producer id + per-partition sequence number, що дедупить retries) із **transactions** (атомарні мультипартиційні записи) і consumer-ами `read_committed` — потужно *в межах* циклу read-process-write Kafka, але перехід у зовнішню систему все одно потребує твоєї ідемпотентності.',
          },
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'Design every consumer to be idempotent', uk: 'Проєктуй кожен consumer ідемпотентним' },
          md: {
            en: 'Because the default you will live with is at-least-once, **assume every message can arrive twice.** Make handlers idempotent: dedup on a stable message id, use upserts, and guard real-world side effects (charging a card, sending an email) behind an idempotency key. This is the same lesson as the webhook module (m15) and the reliability module (m21): the network delivers twice or not at all, and the **consumer — not the broker — is where exactly-once becomes real**.',
            uk: 'Оскільки дефолт, з яким житимеш, — at-least-once, **вважай, що кожне повідомлення може прийти двічі.** Роби handler-и ідемпотентними: dedup за стабільним message id, upsert-и й захист реальних побічних ефектів (списання картки, лист) за idempotency key. Це той самий урок, що й у модулі webhook (m15) і надійності (m21): мережа доставляє двічі або жодного разу, і **consumer — а не брокер — це місце, де exactly-once стає реальним**.',
          },
        },
      ],
    },
    // ── T6 · When an API should be a message ──────────────────────────────────
    {
      id: 'when-an-api-should-be-a-message',
      title: { en: 'When an API should be a message', uk: 'Коли API має бути повідомленням' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The decision heuristic. Turn a synchronous API call into a message when any of these hold: the caller **does not need the answer now** (fire-and-forget — send the email, resize the image, reindex search); **many consumers** need the same event and you do not want the producer to know them (fan-out — “order placed” feeds billing, shipping, analytics, email); you need **load-leveling** to absorb spikes without overwhelming a slow downstream; or producer and consumer have **different availability** and should not be forced up together. Keep it a **synchronous request** (REST/gRPC/GraphQL) when the caller **needs an answer to proceed** (read a balance, validate a login, complete a checkout step the user is waiting on) or needs a **strong, immediate error** it can act on. A useful test: if the caller would just `await` the result and do nothing until it arrives, it wants request/response; if it would fire it and move on, it wants a message.',
            uk: 'Евристика рішення. Перетвори синхронний виклик API на повідомлення, коли справджується щось із цього: викликач **не потребує відповіді зараз** (fire-and-forget — надіслати лист, змінити розмір зображення, переіндексувати пошук); **багато consumer-ів** потребують ту саму подію, і ти не хочеш, щоб producer їх знав (fan-out — «замовлення створене» живить білінг, доставку, аналітику, лист); треба **load-leveling**, щоб поглинути сплески без перевантаження повільного downstream; або producer і consumer мають **різну доступність** і не мусять бути піднятими разом. Лиши це **синхронним запитом** (REST/gRPC/GraphQL), коли викликачу **потрібна відповідь, щоб продовжити** (прочитати баланс, валідувати логін, завершити крок checkout, на який чекає користувач) або потрібна **сильна, негайна помилка**, на яку він реагує. Корисний тест: якщо викликач просто `await`-ить результат і нічого не робить до його прибуття — йому треба request/response; якщо він випустив би це й пішов далі — йому треба повідомлення.',
          },
        },
        {
          kind: 'compare',
          a: { en: 'Make it a message', uk: 'Зроби повідомленням' },
          b: { en: 'Keep it a request', uk: 'Лиши запитом' },
          rows: [
            [
              { en: 'Caller needs the answer', uk: 'Викликачу потрібна відповідь' },
              { en: 'No — fire and move on', uk: 'Ні — випустив і далі' },
              { en: 'Yes — blocks until it returns', uk: 'Так — блокує до повернення' },
            ],
            [
              { en: 'Shape', uk: 'Форма' },
              { en: 'One event, many independent readers', uk: 'Одна подія, багато незалежних читачів' },
              { en: 'One caller, one responder', uk: 'Один викликач, один відповідач' },
            ],
            [
              { en: 'Load', uk: 'Навантаження' },
              { en: 'Spiky — buffer and level it', uk: 'Сплески — буферизуй і вирівнюй' },
              { en: 'Steady, latency-sensitive', uk: 'Стабільне, чутливе до latency' },
            ],
            [
              { en: 'Failure', uk: 'Збій' },
              { en: 'Retry / replay from the broker', uk: 'Retry / replay із брокера' },
              { en: 'Immediate error the caller handles', uk: 'Негайна помилка, яку обробляє викликач' },
            ],
            [
              { en: 'Coupling', uk: 'Звʼязаність' },
              { en: 'Decouple in time and identity', uk: 'Розчепити в часі й ідентичності' },
              { en: 'Direct, tightly timed', uk: 'Пряме, щільно синхронізоване' },
            ],
          ],
        },
      ],
    },
    // ── T7 · Event-driven architecture + verdict ──────────────────────────────
    {
      id: 'event-driven-arch',
      title: { en: 'Event-driven architecture & the verdict', uk: 'Event-driven архітектура і вердикт' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Zoom out: async messaging is the substrate of **event-driven architecture (EDA)**, where services communicate by emitting and reacting to **events** — facts about the past (“PaymentCaptured”) — rather than calling each other. Two coordination styles: **choreography** (each service reacts to events and emits its own — decentralized and loosely coupled, but the end-to-end flow is emergent and harder to trace) versus **orchestration** (a central coordinator drives the steps — explicit and traceable, but itself a coupling point). The classic reliability trap is the **dual write**: updating your database and publishing an event are two separate operations, so a crash between them either loses the event or announces one for a change that rolled back. The fix is the **outbox pattern** (m21): write the event into an outbox table in the *same* DB transaction as the state change, then a relay publishes it — one atomic write, at-least-once out. EDA buys scalability and decoupling; it costs eventual consistency, harder debugging, and the operational weight of running a broker.',
            uk: 'Віддалимося: async messaging — це субстрат **event-driven архітектури (EDA)**, де сервіси спілкуються, випускаючи й реагуючи на **події** — факти про минуле («PaymentCaptured») — а не кличучи одне одного. Два стилі координації: **choreography** (кожен сервіс реагує на події й випускає власні — децентралізовано й слабко звʼязано, але наскрізний потік емерджентний і його важче трасувати) проти **orchestration** (центральний координатор веде кроки — явно й трасовно, але сам є точкою звʼязності). Класична пастка надійності — **dual write**: оновлення БД і публікація події — дві окремі операції, тож збій між ними або губить подію, або оголошує її для зміни, що відкотилася. Фікс — **outbox pattern** (m21): запиши подію в outbox-таблицю в *тій самій* транзакції БД, що й зміну стану, а relay її публікує — один атомарний запис, at-least-once назовні. EDA купує масштабованість і розчеплення; коштує eventual consistency, важчий дебаг і операційну вагу утримання брокера.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'The verdict', uk: 'Вердикт' },
          md: {
            en: 'Use async messaging when work can be fire-and-forget, fanned out, buffered, or decoupled in time — and pick by shape: **MQTT** for edge/IoT telemetry over constrained networks; **AMQP/RabbitMQ** for rich per-message routing, work queues, and acked task distribution; **Kafka** for high-throughput, replayable event streams read by many consumer groups. Avoid a message when the caller genuinely needs a synchronous answer, when you need a simple strong-consistency read/write, or when the operational cost of a broker outweighs a direct REST/gRPC call. Whatever you choose, **assume at-least-once and make consumers idempotent**; if an event crosses a state change, use the **outbox pattern**.',
            uk: 'Бери async messaging, коли роботу можна зробити fire-and-forget, розкидати fan-out-ом, буферизувати чи розчепити в часі — і обирай за формою: **MQTT** для edge/IoT-телеметрії над обмеженими мережами; **AMQP/RabbitMQ** для багатої per-message маршрутизації, work-черг і ack-нутого розподілу задач; **Kafka** для високопропускних, реплейованих потоків подій, які читає багато consumer-груп. Уникай повідомлення, коли викликачу справді потрібна синхронна відповідь, коли треба проста strong-consistency операція читання/запису, або коли операційна ціна брокера переважує прямий REST/gRPC-виклик. Що б ти не обрав, **припускай at-least-once і роби consumer-ів ідемпотентними**; якщо подія перетинає зміну стану, застосуй **outbox pattern**.',
          },
        },
      ],
    },
  ],
  keyPoints: [
    { en: 'A broker decouples producer from consumer in time: it buys temporal decoupling, buffering/load-leveling, and fan-out — at the cost of the synchronous answer.', uk: 'Брокер розчіплює producer-а й consumer-а в часі: купує темпоральне розчеплення, буферизацію/load-leveling і fan-out — ціною синхронної відповіді.' },
    { en: 'MQTT is lightweight pub/sub for IoT with three QoS levels: 0 at-most-once, 1 at-least-once, 2 exactly-once (a four-packet handshake); 3.1.1 and 5.0 are both current OASIS Standards.', uk: 'MQTT — легкий pub/sub для IoT з трьома рівнями QoS: 0 at-most-once, 1 at-least-once, 2 exactly-once (чотирипакетне рукостискання); 3.1.1 і 5.0 — обидва чинні OASIS Standards.' },
    { en: 'AMQP 0-9-1 (RabbitMQ) is a smart broker: publish to an exchange → bindings route to queues → consumers ack. AMQP 1.0 is a different protocol (ISO 19464) — wire-only, no exchange model.', uk: 'AMQP 0-9-1 (RabbitMQ) — розумний брокер: публікуй в exchange → bindings маршрутизують у queues → consumers ack-ають. AMQP 1.0 — інший протокол (ISO 19464), лише wire, без моделі exchange.' },
    { en: 'Kafka is a replayable append-only log: partitions (order only within one), consumer groups (one consumer per partition), consumer-tracked offsets, retention not delete-on-read. Kafka 4.0 is KRaft-only.', uk: 'Kafka — реплейований append-only лог: partitions (порядок лише в межах однієї), consumer groups (один consumer на partition), offset-и відстежує consumer, retention замість delete-on-read. Kafka 4.0 — лише KRaft.' },
    { en: 'Delivery: at-most / at-least / exactly-once. Exactly-once end-to-end is a myth — engineer at-least-once + idempotent consumers for exactly-once effect (MQTT QoS 2 is per-hop; Kafka EOS is within its boundary).', uk: 'Доставка: at-most / at-least / exactly-once. Exactly-once наскрізь — міф; інженер at-least-once + ідемпотентні consumer-и заради exactly-once ефекту (MQTT QoS 2 — на хоп; Kafka EOS — у межах свого кордону).' },
    { en: 'Make an API a message for fire-and-forget, fan-out, buffering, or temporal decoupling; keep it a request when the caller needs an answer now. Messaging underpins EDA — use the outbox pattern for state-changing events.', uk: 'Зроби API повідомленням заради fire-and-forget, fan-out, буферизації чи темпорального розчеплення; лиши запитом, коли викликачу потрібна відповідь зараз. Messaging — основа EDA; для подій, що змінюють стан, застосовуй outbox pattern.' },
  ],
  pitfalls: [
    {
      title: { en: 'Assuming exactly-once delivery', uk: 'Припускати exactly-once доставку' },
      body: {
        en: 'Brokers advertise exactly-once only within a boundary — MQTT per hop, Kafka within its own read-process-write loop; across systems the ack can always be lost, forcing a retry. Build at-least-once + idempotent consumers (dedup on a message id) for an exactly-once effect instead of trusting a delivery flag.',
        uk: 'Брокери рекламують exactly-once лише в межах кордону — MQTT на хоп, Kafka у власному циклі read-process-write; між системами ack завжди може загубитися, змусивши retry. Будуй at-least-once + ідемпотентні consumer-и (dedup за message id) заради exactly-once ефекту замість довіри до прапорця доставки.',
      },
    },
    {
      title: { en: 'The dual-write trap', uk: 'Пастка dual-write' },
      body: {
        en: 'Updating the database and publishing an event as two separate operations loses the event if the process crashes between them — or emits an event for a change that rolled back. Use the outbox pattern: write the event in the same DB transaction as the state change, and let a relay publish it.',
        uk: 'Оновлення БД і публікація події як дві окремі операції губить подію, якщо процес падає між ними — або випускає подію для зміни, що відкотилася. Застосуй outbox pattern: запиши подію в тій самій транзакції БД, що й зміну стану, а relay її опублікує.',
      },
    },
    {
      title: { en: 'Reaching for a broker (or the wrong one) by default', uk: 'Тягнутися до брокера (чи не того) за замовчуванням' },
      body: {
        en: 'Messaging adds a broker to operate, eventual consistency, and harder debugging; if the caller needs an immediate answer or you need simple strong consistency, a direct REST/gRPC call is simpler. And match the broker to the job: Kafka for replayable high-throughput streams, RabbitMQ for routed acked work queues, MQTT for constrained IoT — a work queue forced onto Kafka or a firehose forced onto RabbitMQ fights the tool.',
        uk: 'Messaging додає брокер для експлуатації, eventual consistency й важчий дебаг; якщо викликачу потрібна негайна відповідь або потрібна проста strong consistency, прямий REST/gRPC-виклик простіший. І підбирай брокер під задачу: Kafka для реплейованих високопропускних потоків, RabbitMQ для маршрутизованих ack-нутих work-черг, MQTT для обмеженого IoT — work-черга, натягнута на Kafka, чи firehose, натягнутий на RabbitMQ, воюють з інструментом.',
      },
    },
  ],
  interview: [
    {
      q: {
        en: '“Order placed” must trigger billing, shipping, a confirmation email, and a search-index update. Walk from a synchronous design to an event-driven one — and name the reliability trap you must handle.',
        uk: '«Замовлення створене» має запустити білінг, доставку, лист-підтвердження та оновлення пошукового індексу. Пройди від синхронного дизайну до event-driven — і назви пастку надійності, яку треба обробити.',
      },
      a: {
        en: 'Synchronously, checkout would call billing, then shipping, then email, then search — four blocking calls in the user’s request path, coupled so that if email is down the order fails, and checkout must know all four downstreams. Event-driven, checkout does one thing: commit the order and emit an OrderPlaced event to a broker; billing, shipping, email, and search each subscribe independently and react at their own pace. That gives fan-out (the producer does not know its consumers), temporal decoupling (email being down drains the backlog later instead of failing checkout), and load-leveling for spikes. I would lean to Kafka here so the log is replayable — a new consumer like fraud analytics can start from the beginning, and a buggy consumer can reprocess after a fix. The reliability trap is the dual write: committing the order to the database and publishing the event are two operations, so a crash between them either loses the event or publishes one for an order that rolled back. The fix is the outbox pattern — write the event into an outbox table in the same DB transaction as the order, then a relay publishes it, giving one atomic state change and at-least-once delivery out. And because it is at-least-once, every consumer must be idempotent — dedup on the event id so a redelivered OrderPlaced does not double-bill.',
        uk: 'Синхронно checkout кликав би білінг, потім доставку, потім лист, потім пошук — чотири блокуючі виклики в шляху запиту користувача, звʼязані так, що якщо лист лежить — замовлення падає, і checkout має знати всі чотири downstream-и. Event-driven checkout робить одне: комітить замовлення й випускає подію OrderPlaced у брокер; білінг, доставка, лист і пошук підписуються незалежно й реагують у своєму темпі. Це дає fan-out (producer не знає своїх consumer-ів), темпоральне розчеплення (лежачий лист розбирає беклог пізніше, а не валить checkout) і load-leveling для сплесків. Я б схилявся до Kafka, щоб лог був реплейований — новий consumer на кшталт fraud-аналітики може стартувати з початку, а баговий consumer — переобробити після фіксу. Пастка надійності — dual write: коміт замовлення в БД і публікація події — дві операції, тож збій між ними або губить подію, або публікує її для замовлення, що відкотилося. Фікс — outbox pattern: запиши подію в outbox-таблицю в тій самій транзакції БД, що й замовлення, а relay її опублікує — один атомарний коміт стану й at-least-once назовні. І оскільки це at-least-once, кожен consumer мусить бути ідемпотентним — dedup за event id, щоб передоставлений OrderPlaced не списав двічі.',
      },
      level: 'senior',
    },
    {
      q: {
        en: 'A team defaults to Kafka for everything. When is that the wrong call, and what would you reach for instead?',
        uk: 'Команда за замовчуванням бере Kafka для всього. Коли це неправильний вибір і що б ти взяв натомість?',
      },
      a: {
        en: 'Kafka is a replayable log optimized for high-throughput streaming and many independent consumer groups reading the same events — brilliant when you need durability, replay, and horizontal fan-out. It is the wrong default for two common cases. First, a work queue with competing consumers where you need rich per-message routing, priorities, per-message acknowledgements, TTLs, and dead-lettering, and you will never replay — that is RabbitMQ’s (AMQP 0-9-1) sweet spot; forcing it onto Kafka means hand-rolling routing and re-processing the broker won’t give you, and Kafka caps parallelism at the partition count and orders only within a partition. Second, IoT / edge telemetry from many constrained devices over flaky networks — that is MQTT, with its tiny header, QoS levels, retained messages, and Last-Will; a full Kafka client is far too heavy for a sensor. And the meta-point: if the caller actually needs a synchronous answer, the right tool is not a broker at all — it is a REST or gRPC call. The decision axis is the workload’s shape — replayable stream vs routed work queue vs constrained telemetry vs synchronous request — not a house default; running all three brokers where each fits is normal.',
        uk: 'Kafka — реплейований лог, оптимізований під високопропускний streaming і багато незалежних consumer-груп, що читають ті самі події — блискучий, коли треба довговічність, replay і горизонтальний fan-out. Це неправильний дефолт для двох поширених випадків. Перше — work-черга з конкуруючими consumer-ами, де треба багата per-message маршрутизація, пріоритети, per-message acknowledgements, TTL і dead-lettering, а replay не буде ніколи — це солодка пляма RabbitMQ (AMQP 0-9-1); натягнути це на Kafka означає вручну ліпити маршрутизацію й переобробку, яких брокер не дасть, а Kafka обмежує паралелізм кількістю partitions і впорядковує лише в межах partition. Друге — IoT / edge-телеметрія з багатьох обмежених пристроїв над ненадійними мережами — це MQTT, з крихітним header, рівнями QoS, retained messages і Last-Will; повний клієнт Kafka надто важкий для сенсора. І мета-теза: якщо викликачу справді потрібна синхронна відповідь, правильний інструмент — не брокер узагалі, а REST чи gRPC-виклик. Вісь рішення — форма навантаження (реплейований потік vs маршрутизована work-черга vs обмежена телеметрія vs синхронний запит), а не домашній дефолт; тримати всі три брокери там, де кожен пасує, — нормально.',
      },
      level: 'senior',
    },
  ],
  seeAlso: ['m15-webhooks', 'm12-websockets', 'm5-rest', 'm21-idempotency', 'm2-decision-axes'],
  sources: [
    { title: 'OASIS — MQTT Version 5.0 (OASIS Standard)', url: 'https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html' },
    { title: 'MQTT.org — MQTT Specification (3.1.1 & 5.0)', url: 'https://mqtt.org/mqtt-specification/' },
    { title: 'RabbitMQ — AMQP 0-9-1 Model Explained (exchanges, queues, bindings)', url: 'https://www.rabbitmq.com/tutorials/amqp-concepts' },
    { title: 'RabbitMQ — AMQP 1.0 (a distinct protocol; native support)', url: 'https://www.rabbitmq.com/docs/amqp' },
    { title: 'Apache Kafka — 4.0.0 Release Announcement (KRaft-only, ZooKeeper removed)', url: 'https://kafka.apache.org/blog/2025/03/18/apache-kafka-4.0.0-release-announcement/' },
    { title: 'Confluent — Message Delivery Guarantees & Exactly-Once Semantics', url: 'https://docs.confluent.io/kafka/design/delivery-semantics.html' },
    { title: 'Apache Kafka — Design: consumer groups, partitions, offsets', url: 'https://kafka.apache.org/documentation/#design' },
  ],
};
