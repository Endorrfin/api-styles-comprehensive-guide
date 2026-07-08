import type { Module } from '../types';

/*
 * m21-idempotency — Idempotency, reliability & delivery (s4-cross-cutting, order 5). The network
 * delivers twice or not at all; a timeout means UNKNOWN — so every reliability pattern in this module
 * is one move: make repeating safe, then repeat. Figure `outbox-saga` (dual-write bug → outbox relay;
 * saga chain with compensations). Six curriculum topics: idempotency-keys → at-least-once-vs-exactly-
 * once → retries-and-dedup → outbox-pattern (figure) → sagas-across-apis → timeouts-circuit-breakers
 * (verdict). Level: staff (the deepest cross-cutting concern).
 *
 * Facts web-verified S12a (2026-07):
 *  - Idempotency-Key header = draft-ietf-httpapi-idempotency-key-header (WG httpapi; -07 2025-10-15,
 *    Standards Track intent) — still an IETF DRAFT, not an RFC. The de facto contract is Stripe's:
 *    Idempotency-Key on POST, keys ≤255 chars (V4 UUID suggested), first outcome (status + body)
 *    saved and REPLAYED for retries with the same key; keys expire after 24 h.
 *  - Transactional outbox + saga (orchestration vs choreography) = microservices.io (Richardson) —
 *    canonical pattern pages; outbox relay = poller or CDC (e.g. Debezium).
 *  - Exponential backoff + FULL JITTER = AWS Architecture Blog / Builders' Library guidance.
 *  - Circuit breaker (closed/open/half-open) = Nygard "Release It!"; Fowler's bliki writeup.
 *  - Kafka EOS = idempotent producer + transactions WITHIN the Kafka boundary (verified S10b, m16);
 *    end-to-end exactly-once across arbitrary systems remains at-least-once + idempotent consumer.
 *  - gRPC deadline propagation (verified S5, m10); Retry-After semantics RFC 9110 (S11, m19).
 */
export const m21: Module = {
  id: 'm21-idempotency',
  num: 21,
  section: 's4-cross-cutting',
  order: 5,
  level: 'staff',
  title: { en: 'Idempotency, reliability & delivery', uk: 'Idempotency, надійність і доставка' },
  tagline: {
    en: 'At-least-once is the default; design for retries.',
    uk: 'At-least-once — це дефолт; проєктуй під retries.',
  },
  readMins: 16,
  mentalModel: {
    en: '**The network will deliver twice or not at all — and a timeout tells you nothing.** When a call times out, the request may have never arrived, arrived and failed, or *succeeded* with the reply lost on the way back: three worlds, one symptom, and the caller cannot tell them apart. Everything in this module is one move against that ambiguity: **make the operation safe to repeat, then repeat it.** An **idempotency key** makes a retry recognizable; **at-least-once delivery + a deduplicating consumer** is what "exactly-once" actually means in production; the **outbox** makes "write the database AND tell the world" atomic; a **saga** stretches the same discipline across several APIs; **timeouts and circuit breakers** decide when to stop repeating and fail fast. Retries without idempotency aren\'t reliability — they\'re a duplicate-effect generator with good intentions.',
    uk: '**Мережа доставить двічі або жодного разу — а timeout не каже нічого.** Коли виклик тайм-аутиться, запит міг не дійти, дійти і впасти, або *вдатися* з загубленою на зворотному шляху відповіддю: три світи, один симптом, і викликач їх не розрізнить. Усе в цьому модулі — один хід проти цієї неоднозначності: **зроби операцію безпечною для повтору, тоді повторюй.** **Idempotency key** робить retry впізнаваним; **at-least-once доставка + consumer, що дедуплікує** — ось що «exactly-once» означає в production насправді; **outbox** робить «запиши в базу І скажи світові» атомарним; **saga** розтягує ту саму дисципліну на кілька API; **timeout-и й circuit breaker-и** вирішують, коли перестати повторювати і впасти швидко. Retry без idempotency — це не надійність, це генератор подвійних ефектів із добрими намірами.',
  },
  topics: [
    // ── T1 · Idempotency keys ─────────────────────────────────────────────────
    {
      id: 'idempotency-keys',
      title: { en: 'Idempotency keys', uk: 'Idempotency keys' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'HTTP already sorts its methods by retry safety: `GET`/`PUT`/`DELETE` are **idempotent by contract** (m5) — send them twice, same end state. The dangerous one is **`POST`**: "create a payment", sent twice, is two payments. An **idempotency key** upgrades POST to retry-safe: the client generates a unique key per *logical operation* (not per attempt!) and sends it as a header; the server **records the outcome under that key and replays it** for any repeat. The de facto contract is Stripe\'s: an **`Idempotency-Key`** header on every POST, keys up to **255 chars** (a V4 UUID is the suggested shape), the **first outcome — status code and body — saved and returned verbatim** for retries with the same key, and keys **expiring after 24 h**. The IETF is standardizing exactly this shape as **`Idempotency-Key`** (draft-ietf-httpapi-idempotency-key-header — as of mid-2026 **still a working-group draft, not an RFC**), so designing to the Stripe semantics today is designing to the emerging standard. The subtle part is server-side atomicity: *reserve the key atomically first* — a unique-constraint INSERT — then execute the effect, or two concurrent retries can both find "no key" and both execute.',
            uk: 'HTTP уже сортує свої методи за безпекою повтору: `GET`/`PUT`/`DELETE` — **idempotent за контрактом** (m5): надішли двічі — той самий кінцевий стан. Небезпечний — **`POST`**: «створи платіж», надісланий двічі, — це два платежі. **Idempotency key** підвищує POST до retry-safe: клієнт генерує унікальний ключ на *логічну операцію* (не на спробу!) і шле його заголовком; сервер **записує результат під цим ключем і відтворює його** на будь-який повтор. Контракт de facto — Stripe-ів: заголовок **`Idempotency-Key`** на кожен POST, ключі до **255 символів** (V4 UUID — рекомендована форма), **перший результат — статус-код і тіло — збережений і повернутий дослівно** для повторів з тим самим ключем, і ключі, що **спливають за 24 год**. IETF стандартизує саме цю форму як **`Idempotency-Key`** (draft-ietf-httpapi-idempotency-key-header — станом на середину 2026 **досі working-group draft, не RFC**), тож проєктувати під семантику Stripe сьогодні — проєктувати під стандарт, що надходить. Тонке місце — атомарність на сервері: *спершу атомарно зарезервуй ключ* — INSERT з unique constraint, — тоді виконуй ефект, інакше два конкурентні retry обидва побачать «ключа нема» і обидва виконаються.',
          },
        },
        {
          kind: 'code',
          lang: 'sql',
          code: `-- the server half of an idempotency key, in one atomic move (PostgreSQL)
INSERT INTO idempotency_keys (key, request_hash, state)
VALUES (:key, :hash, 'running')
ON CONFLICT (key) DO NOTHING;          -- exactly ONE request wins the key

-- winner: execute the effect + save the outcome in the SAME transaction
UPDATE idempotency_keys
SET state = 'done', status = 201, body = :response
WHERE key = :key;

-- loser (the retry): read the saved outcome and replay it
SELECT status, body FROM idempotency_keys WHERE key = :key;
-- state = 'running'? 409/wait — the first attempt is still in flight.
-- request_hash mismatch? 422 — same key reused for a DIFFERENT operation.`,
          note: {
            en: 'The unique constraint is the mechanism: the reservation commits first, then the effect and its outcome share one transaction. A concurrent retry either loses the INSERT and replays the saved outcome, or sees `running` (409) while the first attempt is in flight. The `request_hash` guard catches the client bug of recycling one key across different payloads.',
            uk: 'Механізм — унікальний constraint: резервування commit-иться першим, а тоді ефект і його результат ділять одну транзакцію. Конкурентний retry або програє INSERT і відтворює збережений результат, або бачить `running` (409), поки перша спроба в польоті. Guard `request_hash` ловить клієнтський баг повторного використання одного ключа для різних payload-ів.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'One key per operation, not per attempt', uk: 'Один ключ на операцію, а не на спробу' },
          md: {
            en: 'The key must be minted where the *intent* is born — "charge order #4217" — and reused across every retry of that intent, including retries after your process restarts (persist it with the order, not in memory). A key generated fresh per HTTP attempt is a no-op: every duplicate looks new. And scope keys per endpoint + verify the payload hash — one key accidentally shared by two different operations must fail loudly, not silently return the wrong saved response.',
            uk: 'Ключ має народжуватися там, де народжується *намір* — «спиши за замовлення #4217» — і переживати кожен retry цього наміру, включно з retry після рестарту твого процесу (персистуй його з замовленням, не в пам\'яті). Ключ, згенерований наново на кожну HTTP-спробу, — це no-op: кожен дублікат виглядає новим. І скоуп ключів на endpoint + перевірка хешу payload-а: один ключ, випадково поділений двома різними операціями, мусить впасти голосно, а не тихо повернути чужу збережену відповідь.',
          },
        },
      ],
    },
    // ── T2 · At-least-once vs exactly-once ────────────────────────────────────
    {
      id: 'at-least-once-vs-exactly-once',
      title: { en: 'At-least-once vs exactly-once', uk: 'At-least-once проти exactly-once' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Delivery guarantees are a two-way fork forced by the timeout\'s ambiguity. If the sender **gives up after a timeout**, a message that actually arrived may never be retried elsewhere but one that didn\'t is lost: **at-most-once** — no duplicates, possible loss. If the sender **retries until acknowledged**, nothing is lost but the retry of a delivered-yet-unacknowledged message is a duplicate: **at-least-once** — no loss, guaranteed occasional duplicates. What about **exactly-once**? As a *delivery* guarantee across an unreliable network it is **impossible** — this is the Two Generals problem: no finite number of acknowledgements lets both sides *know* the other knows. What production systems mean by "exactly-once" is **exactly-once *processing***: at-least-once delivery underneath, plus a consumer that recognizes duplicates and applies the effect once — an idempotency key by another name (webhooks run exactly this loop: m15\'s lost-ack redelivery). Even Kafka\'s celebrated EOS is this pattern *scoped to Kafka\'s own boundary* — idempotent producer + transactions within the log (m16); the moment your consumer touches an external system, you\'re back to at-least-once + dedup, and pretending otherwise is how double charges ship.',
            uk: 'Гарантії доставки — розвилка, нав\'язана неоднозначністю timeout-а. Якщо відправник **здається після timeout-а**, повідомлення, що насправді дійшло, вже ніде не повториться, а те, що не дійшло, — втрачене: **at-most-once** — без дублів, з можливою втратою. Якщо відправник **ретраїть до підтвердження**, ніщо не губиться, але retry доставленого-та-непідтвердженого повідомлення — дубль: **at-least-once** — без втрат, з гарантованими зрідка дублями. А **exactly-once**? Як гарантія *доставки* через ненадійну мережу — **неможлива**: це задача двох генералів, жодна скінченна кількість підтверджень не дає обом сторонам *знати*, що інша знає. Те, що production-системи називають «exactly-once», — це **exactly-once *обробка***: під сподом at-least-once, плюс consumer, що впізнає дублі й застосовує ефект один раз — idempotency key під іншим ім\'ям (webhook-и крутять рівно цей цикл: redelivery після загубленого ack у m15). Навіть оспіваний Kafka EOS — цей самий патерн, *обмежений власною межею Kafka*: idempotent producer + транзакції всередині логу (m16); щойно твій consumer торкається зовнішньої системи — ти знову в at-least-once + dedup, і вдавання іншого — це спосіб відвантажити подвійні списання.',
          },
        },
        {
          kind: 'compare',
          a: { en: 'At-most-once', uk: 'At-most-once' },
          b: { en: 'At-least-once', uk: 'At-least-once' },
          rows: [
            [
              { en: 'On timeout', uk: 'На timeout' },
              { en: 'Give up — never resend', uk: 'Здатися — не пересилати' },
              { en: 'Retry until acknowledged', uk: 'Ретраїти до підтвердження' },
            ],
            [
              { en: 'Failure mode', uk: 'Режим відмови' },
              { en: 'Silent loss', uk: 'Тиха втрата' },
              { en: 'Duplicates', uk: 'Дублікати' },
            ],
            [
              { en: 'Consumer burden', uk: 'Тягар consumer-а' },
              { en: 'None — but the data may be gone', uk: 'Жодного — але дані можуть зникнути' },
              { en: 'Must deduplicate (idempotency)', uk: 'Мусить дедуплікувати (idempotency)' },
            ],
            [
              { en: 'Fits', uk: 'Пасує' },
              { en: 'Telemetry, metrics ticks, cursors of a live stream', uk: 'Телеметрія, метрики, позиції живого стріму' },
              { en: 'Money, orders, anything with a ledger', uk: 'Гроші, замовлення, все з ledger-ом' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: '"Exactly-once" on a vendor page has a boundary — find it', uk: '«Exactly-once» на сторінці вендора має межу — знайди її' },
          md: {
            en: 'Every honest exactly-once claim is scoped: Kafka\'s holds *inside* the log (producer→partition→consumer offsets, m16); a database\'s holds inside its transactions. Ask "exactly-once *between what and what*?" — the answer marks precisely where you must add an idempotency key, because at the boundary the guarantee degrades to at-least-once. There is no configuration flag that repeals the Two Generals problem.',
            uk: 'Кожна чесна заява про exactly-once має скоуп: у Kafka вона діє *всередині* логу (producer→partition→offset-и consumer-а, m16); у бази — всередині її транзакцій. Спитай «exactly-once *між чим і чим*?» — відповідь позначає точно те місце, де треба додати idempotency key, бо на межі гарантія деградує до at-least-once. Не існує config-прапорця, що скасовує задачу двох генералів.',
          },
        },
      ],
    },
    // ── T3 · Retries & dedup ──────────────────────────────────────────────────
    {
      id: 'retries-and-dedup',
      title: { en: 'Retries & dedup', uk: 'Retries і dedup' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'A retry is a bet that the failure was *transient* — so the first rule is to only bet on transient-shaped failures: **timeouts, `5xx`, `429`-with-`Retry-After`, connection resets**. A plain `4xx` is a losing bet by definition — the request is wrong, and resending it unchanged just resends the mistake (m19\'s whose-fault taxonomy is the retry policy\'s input). The second rule is *pacing*: naive clients retry immediately and in sync, turning one hiccup into a coordinated wave that keeps the victim down — the **retry storm**. The cure is **exponential backoff with full jitter** (the AWS-canonized formula): double the *ceiling* each attempt, then sleep a *random* slice of it, so a thousand failed callers return as a whisper spread over seconds, not a second wave. Cap the attempts, honour `Retry-After` when the server names its price, and give the whole call chain a **retry budget** — if three layers each retry 3×, one downstream blip becomes 27 requests (multiply that through m23\'s gateway diagram). The receiving side completes the loop: at-least-once means the *server* deduplicates by key (T1) no matter how polite the clients are.',
            uk: 'Retry — це ставка, що збій був *транзієнтним*, тож перше правило: став лише на збої транзієнтної форми — **timeout-и, `5xx`, `429`-з-`Retry-After`, обриви з\'єднань**. Голий `4xx` — програшна ставка за визначенням: запит хибний, і пересилання без змін пересилає помилку (таксономія «чия провина» з m19 — вхід retry-політики). Друге правило — *темп*: наївні клієнти ретраять негайно і синхронно, перетворюючи один збій на скоординовану хвилю, що тримає жертву на підлозі, — **retry storm**. Ліки — **exponential backoff з full jitter** (канонізована AWS формула): подвоюй *стелю* кожної спроби і спи *випадковий* шматок її, щоб тисяча збитих викликачів поверталася шепотом, розмазаним по секундах, а не другою хвилею. Обмеж кількість спроб, шануй `Retry-After`, коли сервер називає ціну, і дай усьому ланцюжку **retry budget** — якщо три шари ретраять по 3×, один downstream-збій стає 27 запитами (перемнож це через gateway-діаграму m23). Приймальна сторона замикає цикл: at-least-once означає, що *сервер* дедуплікує за ключем (T1), хоч якими ввічливими є клієнти.',
          },
        },
        {
          kind: 'code',
          lang: 'ts',
          code: `// exponential backoff + FULL jitter (the AWS formula): retry transient failures only
const BASE_MS = 200, CAP_MS = 20_000, MAX_ATTEMPTS = 5;

const transient = (e: HttpError) =>
  e.status === undefined ||            // timeout / connection reset — outcome UNKNOWN
  e.status >= 500 || e.status === 429; // server fault or shed load — retry may help

async function withRetries<T>(call: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await call();             // the call carries its Idempotency-Key (T1)!
    } catch (e) {
      if (!transient(e as HttpError) || attempt >= MAX_ATTEMPTS) throw e;
      const retryAfter = (e as HttpError).retryAfterMs; // server-named price wins
      const ceiling = Math.min(CAP_MS, BASE_MS * 2 ** attempt);
      await sleep(retryAfter ?? Math.random() * ceiling); // full jitter: random slice of the ceiling
    }
  }
}`,
          note: {
            en: 'Full jitter beats "equal steps for everyone": the randomness is what de-synchronizes the herd. Note the two inputs from elsewhere in the guide — the key from T1 makes the retry safe; the `Retry-After` from m20 makes it polite.',
            uk: 'Full jitter б\'є «однакові кроки для всіх»: саме випадковість розсинхронізовує натовп. Зверни увагу на два входи з інших місць гайду — ключ з T1 робить retry безпечним; `Retry-After` з m20 робить його ввічливим.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'Retries amplify — budget them like money', uk: 'Retry підсилюють — бюджетуй їх як гроші' },
          md: {
            en: 'Retries multiply *through layers*: client × gateway × service × client-library defaults you forgot you enabled. During a real outage that multiplication is load you aim at yourself precisely when capacity is lowest. Set retries at ONE layer (usually the outermost that owns the user experience), give inner layers deadlines instead (T6), and alert on retry *rate* — a climbing retry ratio is an outage announcing itself.',
            uk: 'Retry множаться *через шари*: клієнт × gateway × сервіс × дефолти клієнтської бібліотеки, які ти забув, що ввімкнув. Під час справжньої аварії це множення — навантаження, яке ти націлюєш на себе саме тоді, коли потужності найменше. Признач retry ОДНОМУ шару (зазвичай найзовнішньому, що володіє user experience), внутрішнім дай deadline-и замість цього (T6), і алерть на *частку* retry — зростання retry ratio — це аварія, що оголошує себе.',
          },
        },
      ],
    },
    // ── T4 · The outbox pattern (figure) ──────────────────────────────────────
    {
      id: 'outbox-pattern',
      title: { en: 'The outbox pattern', uk: 'Патерн outbox' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The **dual-write problem** is the reliability bug hiding in the most natural code you\'ll ever write: `db.save(order)` then `broker.publish(orderCreated)` — two systems, two failures. Crash between the lines and the order exists but the world never hears; publish first and crash before commit, and the world hears about an order that doesn\'t exist. There is no try/catch that fixes this, because the two writes are not — and cannot be — one transaction. The **transactional outbox** (Richardson\'s canonical pattern) restores atomicity by refusing to write to two systems: the service writes the order **and an event row into an `outbox` table in the same local transaction** — one system, one commit, atomic by construction. A separate **relay** then reads the outbox and publishes: either a poller, or — the production-grade shape — **change data capture** tailing the database\'s own commit log (Debezium being the standard tooling). The relay is allowed to crash and resume freely because its failure mode is *re-publishing* — at-least-once — which lands us exactly where T2 said we\'d be: **the consumer deduplicates by the event\'s id**, and the pipeline as a whole achieves exactly-once *processing* out of parts that individually promise less.',
            uk: '**Проблема dual-write** — баг надійності, що ховається в найприроднішому коді, який ти колись напишеш: `db.save(order)`, потім `broker.publish(orderCreated)` — дві системи, дві відмови. Впади між рядками — і замовлення існує, а світ не почує; опублікуй першим і впади до commit-у — і світ чує про замовлення, якого нема. Жоден try/catch це не лагодить, бо два записи не є — і не можуть бути — однією транзакцією. **Transactional outbox** (канонічний патерн Richardson-а) повертає атомарність, відмовляючись писати у дві системи: сервіс пише замовлення **і рядок події в таблицю `outbox` в одній локальній транзакції** — одна система, один commit, атомарно за конструкцією. Окремий **relay** читає outbox і публікує: або poller, або — production-форма — **change data capture** по commit-логу самої бази (Debezium — стандартний тулінг). Relay може вільно падати й відновлюватись, бо його режим відмови — *повторна публікація* — at-least-once, — що приводить рівно туди, куди обіцяв T2: **consumer дедуплікує за id події**, і pipeline в цілому досягає exactly-once *обробки* з частин, які поодинці обіцяють менше.',
          },
        },
        {
          kind: 'figure',
          fig: 'outbox-saga',
          caption: {
            en: 'Left: the dual-write bug (commit lands, publish is lost) vs the outbox (business row + event row in ONE transaction; the relay publishes at-least-once from the table). Right: a saga — local transactions chained by events, each with a compensating action that runs backwards on failure.',
            uk: 'Ліворуч: баг dual-write (commit є, publish загублено) проти outbox (бізнес-рядок + рядок події в ОДНІЙ транзакції; relay публікує at-least-once з таблиці). Праворуч: saga — локальні транзакції, зчеплені подіями, кожна з компенсувальною дією, що біжить назад при відмові.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Order within an aggregate, ids for everything', uk: 'Порядок всередині агрегата, id для всього' },
          md: {
            en: 'Give every outbox row a unique event id (the consumer\'s dedup key) and publish per-aggregate in commit order — `order-4217`\'s events must replay in sequence, while unrelated orders can interleave freely (the same per-key ordering Kafka partitions give you, m16). Global ordering is a cost you almost never need; per-aggregate ordering is one you almost always do.',
            uk: 'Дай кожному рядку outbox унікальний id події (dedup-ключ consumer-а) і публікуй per-aggregate у порядку commit-ів — події `order-4217` мусять відтворюватися послідовно, а непов\'язані замовлення можуть вільно перемішуватися (той самий per-key порядок, що дають партиції Kafka, m16). Глобальний порядок — ціна, яка майже ніколи не потрібна; per-aggregate — та, що потрібна майже завжди.',
          },
        },
      ],
    },
    // ── T5 · Sagas across APIs ────────────────────────────────────────────────
    {
      id: 'sagas-across-apis',
      title: { en: 'Sagas across APIs', uk: 'Saga через API' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Sometimes one *business* operation spans several services\' databases — place the order, charge the card, reserve the stock — and no distributed transaction is coming to save you (two-phase commit across independently owned HTTP APIs is organizationally and operationally off the table). A **saga** is the honest alternative: a **sequence of local transactions**, each atomic in its own service, chained by events or calls — with a **compensating action** defined for every step, so when step 3 fails, steps 2 and 1 are *semantically undone* (refund the charge, release the stock) rather than rolled back. Two coordination shapes exist. **Choreography**: each service reacts to the previous event — no coordinator, minimal coupling, but the workflow exists only as an emergent property of subscriptions, and nobody can point at it. **Orchestration**: an explicit coordinator tells each participant what to do and tracks state — one more component, but the workflow is *inspectable*: you can query where order #4217 is stuck. The engineering keel under both: every step and every compensation **must be idempotent** (steps get retried — T3), state must be explicit (`PENDING` → `CONFIRMED`/`COMPENSATED`, the "semantic lock" that stops a half-done order from shipping), and each step\'s "do X then announce it" is itself a dual write — **each saga participant needs the outbox** (T4). A saga is not free consistency; it is *eventual* consistency with a designed apology path.',
            uk: 'Інколи одна *бізнес*-операція охоплює бази кількох сервісів — оформи замовлення, спиши з картки, зарезервуй товар — і жодна розподілена транзакція тебе не врятує (two-phase commit через незалежно керовані HTTP API організаційно й операційно не розглядається). **Saga** — чесна альтернатива: **послідовність локальних транзакцій**, кожна атомарна у своєму сервісі, зчеплених подіями чи викликами, — з **компенсувальною дією** для кожного кроку, щоб коли крок 3 падає, кроки 2 і 1 були *семантично скасовані* (поверни списання, звільни резерв), а не відкочені. Форм координації дві. **Choreography**: кожен сервіс реагує на попередню подію — без координатора, мінімальна зв\'язність, але workflow існує лише як емерджентна властивість підписок, і ніхто не може на нього вказати. **Orchestration**: явний координатор каже кожному учаснику, що робити, і веде стан — один компонент більше, зате workflow *інспектується*: можна спитати, де застрягло замовлення #4217. Інженерний кіль під обома: кожен крок і кожна компенсація **мусять бути idempotent** (кроки ретраяться — T3), стан має бути явним (`PENDING` → `CONFIRMED`/`COMPENSATED` — «semantic lock», що не дає напівготовому замовленню відвантажитись), і «зроби X і оголоси» кожного кроку — сам по собі dual write: **кожному учаснику saga потрібен outbox** (T4). Saga — це не безкоштовна консистентність; це *eventual* консистентність зі спроєктованим шляхом вибачення.',
          },
        },
        {
          kind: 'table',
          head: [
            { en: '', uk: '' },
            { en: 'Choreography', uk: 'Choreography' },
            { en: 'Orchestration', uk: 'Orchestration' },
          ],
          rows: [
            [
              { en: 'Coordination', uk: 'Координація' },
              { en: 'Each service reacts to events', uk: 'Кожен сервіс реагує на події' },
              { en: 'A coordinator drives participants', uk: 'Координатор веде учасників' },
            ],
            [
              { en: 'Coupling', uk: 'Зв\'язність' },
              { en: 'Lowest — publish/subscribe only', uk: 'Найнижча — лише publish/subscribe' },
              { en: 'Participants know the orchestrator', uk: 'Учасники знають оркестратора' },
            ],
            [
              { en: 'Where the workflow lives', uk: 'Де живе workflow' },
              { en: 'Nowhere — emergent from subscriptions', uk: 'Ніде — емерджентний із підписок' },
              { en: 'In one place — queryable state', uk: 'В одному місці — стан можна запитати' },
            ],
            [
              { en: 'Debugging a stuck order', uk: 'Дебаг застряглого замовлення' },
              { en: 'Trace-archaeology across services (m23)', uk: 'Трейс-археологія по сервісах (m23)' },
              { en: 'Ask the orchestrator', uk: 'Спитай оркестратора' },
            ],
            [
              { en: 'Fits', uk: 'Пасує' },
              { en: '2–3 steps, stable flow', uk: '2–3 кроки, стабільний потік' },
              { en: 'Long/branching flows you must operate', uk: 'Довгі/розгалужені потоки, які треба оперувати' },
            ],
          ],
          caption: {
            en: 'Richardson\'s two saga shapes. The working rule: choreography for short, stable chains; orchestration for anything you\'ll have to debug at 3 a.m.',
            uk: 'Дві форми saga за Richardson-ом. Робоче правило: choreography для коротких стабільних ланцюжків; orchestration для всього, що доведеться дебажити о 3-й ночі.',
          },
        },
      ],
    },
    // ── T6 · Timeouts, circuit breakers & the verdict ─────────────────────────
    {
      id: 'timeouts-circuit-breakers',
      title: { en: 'Timeouts, circuit breakers & the verdict', uk: 'Timeout-и, circuit breaker-и і вердикт' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Retrying is half the discipline; the other half is **knowing when to stop**. Every call needs a **timeout** — an unbounded wait is a resource leak wearing a patience costume — and in a chain the timeouts must **nest**: if the edge promises 2 s, the service behind it gets a *budget within* that (gRPC ships this as **deadline propagation**, m10 — the surviving budget travels with the request; HTTP chains re-derive it by convention). Inverted timeouts — an inner layer waiting longer than its caller — do work whose recipient has already hung up. When a dependency fails *persistently*, retrying it is cruelty with a schedule; the **circuit breaker** (Nygard\'s pattern from *Release It!*) formalizes giving up: **closed** = normal traffic while failures are counted; **open** = threshold crossed, calls fail *immediately* — no thread pools drained, no queues built, the failing dependency gets air to recover; **half-open** = after a cool-off, a few probes pass, and their fate re-closes or re-opens the circuit. Pair it with **bulkheads** — partitioned pools per dependency, so the slow one can only sink its own compartment — and with an honest **fallback** decided by product, not by exception handler: cached data, a degraded answer, or a clean fast `503` + `Retry-After` (m19).',
            uk: 'Retry — половина дисципліни; друга половина — **знати, коли зупинитись**. Кожному виклику потрібен **timeout** — необмежене очікування це витік ресурсів у костюмі терплячості, — а в ланцюжку timeout-и мусять **вкладатися**: якщо край обіцяє 2 с, сервіс за ним отримує *бюджет всередині* цього (gRPC відвантажує це як **deadline propagation**, m10 — вцілілий бюджет їде з запитом; HTTP-ланцюжки виводять його заново за конвенцією). Перевернуті timeout-и — внутрішній шар чекає довше за свого викликача — роблять роботу, чий адресат уже поклав слухавку. Коли залежність відмовляє *стійко*, ретраїти її — жорстокість за розкладом; **circuit breaker** (патерн Nygard-а з *Release It!*) формалізує здачу: **closed** = нормальний трафік із підрахунком збоїв; **open** = поріг перейдено, виклики падають *негайно* — без осушених thread pool-ів, без черг, залежність-невдаха отримує повітря на відновлення; **half-open** = після паузи проходять кілька проб, і їхня доля знову закриває або відкриває коло. Поєднуй із **bulkhead-ами** — партиційовані пули на залежність, щоб повільна топила лише свій відсік, — і з чесним **fallback-ом**, вирішеним продуктом, а не exception handler-ом: кеш, деградована відповідь або чистий швидкий `503` + `Retry-After` (m19).',
          },
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'Top threat: the replay — accidental or hostile', uk: 'Головна загроза: replay — випадковий чи ворожий' },
          md: {
            en: 'This module\'s machinery exists because *legitimate* duplicates are guaranteed — but the same door admits **hostile replays**: a captured webhook or request re-sent to trigger the effect again, or an attacker "retrying" with a victim\'s idempotency key to read the cached response of someone else\'s operation. Defences: signatures with **timestamp windows** on webhooks (m15), **scope idempotency keys to the authenticated caller** (a key + a different principal = a fresh operation, never a replayed response), TLS everywhere against capture (m17), and dedup stores whose retention (Stripe\'s 24 h) outlives your retry horizon. The full replay taxonomy lands in m22.',
            uk: 'Машинерія цього модуля існує, бо *легітимні* дублікати гарантовані — але ті самі двері впускають **ворожі replay**: перехоплений webhook чи запит, пересланий, щоб зіграти ефект ще раз, або атакер, що «ретраїть» із чужим idempotency key, аби прочитати кешовану відповідь чужої операції. Захист: підписи з **вікнами timestamp-ів** на webhook-ах (m15), **скоуп idempotency keys на автентифікованого викликача** (ключ + інший principal = нова операція, ніколи не відтворена відповідь), TLS всюди проти перехоплення (m17) і dedup-сховища, чия ретенція (24 год у Stripe) переживає твій retry-горизонт. Повна таксономія replay — у m22.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: '**Use / avoid.** Put an **idempotency key on every POST that moves value** — payments, orders, provisioning — and persist it with the intent. Assume **at-least-once** everywhere a queue, webhook, or retry exists, and put the dedup on the consumer. Reach for the **outbox** the moment one handler writes a database *and* publishes an event — which is most handlers in an event-driven system. Use a **saga with orchestration** for multi-service flows you\'ll operate under pressure; prefer redesigning the boundary (one service owning the whole transaction) over a saga when you can — the best distributed transaction is the one you deleted. Avoid: retries without keys (the double-charge generator), "exactly-once" taken at brochure value across system boundaries, sagas without compensations or pending states (a stuck order with no undo), fallbacks invented inside a catch block at 3 a.m., and dedup windows shorter than your longest retry schedule.',
            uk: '**Використовуй / уникай.** Став **idempotency key на кожен POST, що рухає цінність** — платежі, замовлення, provisioning — і персистуй його разом із наміром. Припускай **at-least-once** всюди, де є черга, webhook чи retry, і клади dedup на consumer-а. Бери **outbox**, щойно один handler пише в базу *і* публікує подію — а це більшість handler-ів у event-driven системі. Бери **saga з orchestration** для мультисервісних потоків, які оперуватимеш під тиском; але де можеш — віддай перевагу перепроєктуванню межі (один сервіс володіє всією транзакцією) замість saga: найкраща розподілена транзакція — видалена. Уникай: retry без ключів (генератор подвійних списань), «exactly-once» за брошурною вартістю через межі систем, saga без компенсацій чи pending-станів (застрягле замовлення без undo), fallback-ів, вигаданих у catch-блоці о 3-й ночі, і dedup-вікон, коротших за твій найдовший retry-розклад.',
          },
        },
      ],
    },
  ],
  keyPoints: [
    {
      en: 'A timeout means **unknown** — the request may have succeeded. Retrying without idempotency turns that ambiguity into duplicate effects.',
      uk: 'Timeout означає **невідомо** — запит міг вдатися. Retry без idempotency перетворює цю неоднозначність на подвійні ефекти.',
    },
    {
      en: 'An **idempotency key** (Stripe semantics; IETF `Idempotency-Key` still a draft) is minted per logical operation, reserved atomically server-side, and replays the first outcome — status and body — for every retry.',
      uk: '**Idempotency key** (семантика Stripe; IETF `Idempotency-Key` — досі draft) народжується на логічну операцію, атомарно резервується сервером і відтворює перший результат — статус і тіло — на кожен retry.',
    },
    {
      en: 'Exactly-once **delivery** is impossible (Two Generals); production "exactly-once" = at-least-once delivery + a deduplicating consumer. Every vendor claim has a boundary.',
      uk: 'Exactly-once **доставка** неможлива (два генерали); production-«exactly-once» = at-least-once доставка + consumer, що дедуплікує. Кожна заява вендора має межу.',
    },
    {
      en: 'Retry only transient failures (timeouts, 5xx, 429), with **exponential backoff + full jitter**, capped attempts, and a chain-wide budget — retries multiply through layers.',
      uk: 'Ретрай лише транзієнтні збої (timeout-и, 5xx, 429), з **exponential backoff + full jitter**, обмеженими спробами і бюджетом на весь ланцюжок — retry множаться через шари.',
    },
    {
      en: 'The **outbox** fixes the dual-write bug: business row + event row in one local transaction; a relay (poller/CDC) publishes at-least-once; consumers dedup by event id.',
      uk: '**Outbox** лагодить баг dual-write: бізнес-рядок + рядок події в одній локальній транзакції; relay (poller/CDC) публікує at-least-once; consumer-и дедуплікують за id події.',
    },
    {
      en: 'A **saga** = local transactions + compensations (choreography for short chains, orchestration for operable ones); **timeouts nest**, and a **circuit breaker** (closed→open→half-open) decides when to stop retrying and fail fast.',
      uk: '**Saga** = локальні транзакції + компенсації (choreography для коротких ланцюжків, orchestration для оперованих); **timeout-и вкладаються**, а **circuit breaker** (closed→open→half-open) вирішує, коли перестати ретраїти і впасти швидко.',
    },
  ],
  pitfalls: [
    {
      title: { en: 'Retries on a keyless POST', uk: 'Retry на POST без ключа' },
      body: {
        en: 'The SDK\'s "resilience" feature plus a payment endpoint without idempotency keys is a double-charge machine on a timer: the first outage that produces timeouts after successful writes will mint duplicates. If a POST moves value, the key is not optional hardening — it is the operation\'s identity.',
        uk: 'Фіча «resilience» у SDK плюс платіжний endpoint без idempotency keys — це машина подвійних списань на таймері: перша ж аварія з timeout-ами після успішних записів накарбує дублікати. Якщо POST рухає цінність, ключ — не опційне зміцнення, а ідентичність операції.',
      },
    },
    {
      title: { en: 'An outbox with no dedup on the far side', uk: 'Outbox без dedup на тому боці' },
      body: {
        en: 'Teams install the outbox, watch events flow, and skip the consumer-side idempotency "for now" — but the relay\'s whole failure model is re-publishing. The pattern is a pair: outbox at the producer, dedup-by-event-id at the consumer. Half of it is just a queue with extra steps.',
        uk: 'Команди ставлять outbox, бачать потік подій і пропускають consumer-side idempotency «поки що» — але вся модель відмов relay — це повторна публікація. Патерн — пара: outbox у producer-а, dedup за id події у consumer-а. Половина його — просто черга із зайвими кроками.',
      },
    },
    {
      title: { en: 'A saga that can\'t apologize', uk: 'Saga, що не вміє вибачатися' },
      body: {
        en: 'A saga without compensating actions or explicit pending states isn\'t a saga — it\'s a chain of hopes. The first mid-chain failure leaves a charged card and an unreserved item, with no machine-readable way to know or undo it. Design the compensation and the `PENDING` state machine *before* the happy path; that\'s where the actual difficulty lives.',
        uk: 'Saga без компенсувальних дій чи явних pending-станів — не saga, а ланцюжок сподівань. Перший збій посеред ланцюга лишає списану картку і незарезервований товар без машиночитного способу це знати чи скасувати. Проєктуй компенсацію і машину станів `PENDING` *до* щасливого шляху — саме там живе справжня складність.',
      },
    },
  ],
  interview: [
    {
      q: {
        en: 'A client calls your payments API, the request times out, and the client retries. Walk me through everything that must be true for the customer to be charged exactly once.',
        uk: 'Клієнт викликає твій платіжний API, запит тайм-аутиться, клієнт ретраїть. Проведи мене через усе, що має бути істинним, щоб клієнта списали рівно раз.',
      },
      a: {
        en: 'Client side: the idempotency key is minted with the *intent* (persisted with the order, not regenerated per attempt), the retry sends the identical payload with the same key, backoff+jitter paces it, and only transient failures are retried. Server side: the key is reserved atomically (unique constraint) *before* the effect; the effect and the outcome record commit in one transaction; a concurrent retry either replays the saved status+body, or waits out a `running` state — and a payload-hash mismatch under the same key is rejected. Boundary side: the key store\'s retention outlives the client\'s longest retry horizon (Stripe: 24 h), and the key is scoped to the authenticated principal so a third party can\'t replay it. Under all of that sits the honest model: the timeout meant *unknown*, at-least-once was chosen, and idempotency is what converts it to exactly-once *effect*.',
        uk: 'Бік клієнта: idempotency key народжується з *наміром* (персистується з замовленням, не регенерується на спробу), retry шле ідентичний payload з тим самим ключем, backoff+jitter задає темп, ретраяться лише транзієнтні збої. Бік сервера: ключ резервується атомарно (unique constraint) *до* ефекту; ефект і запис результату commit-яться в одній транзакції; конкурентний retry або відтворює збережені статус+тіло, або пережидає стан `running`, — а розбіжність хешу payload-а під тим самим ключем відхиляється. Бік межі: ретенція сховища ключів переживає найдовший retry-горизонт клієнта (Stripe: 24 год), і ключ скоупиться на автентифікованого principal-а, щоб третя сторона не могла його відтворити. Під усім цим — чесна модель: timeout означав *невідомо*, обрано at-least-once, і саме idempotency конвертує його в exactly-once *ефект*.',
      },
      level: 'staff',
    },
    {
      q: {
        en: 'Your checkout flow spans three services: orders, payments, inventory. Product wants "all or nothing". You don\'t get distributed transactions. Design it — and tell me where it can still go wrong.',
        uk: 'Твій checkout охоплює три сервіси: orders, payments, inventory. Продакт хоче «все або нічого». Розподілених транзакцій нема. Спроєктуй — і скажи, де все ще може піти не так.',
      },
      a: {
        en: 'An orchestrated saga: the orchestrator (or the order service) drives create-order → charge → reserve, each step a local transaction publishing through its own outbox, each step idempotent (keys derived from order id + step), compensations defined per step (refund, release), and the order living in explicit states — `PENDING` until the chain confirms, so a half-done order can\'t ship (semantic lock). Failures mid-chain trigger compensations in reverse; the orchestrator\'s own state is also outbox-published so it can crash and resume. Where it still goes wrong, honestly: compensation itself can fail (needs retries + a dead-letter escalation to humans); "all or nothing" is only *eventual* — there\'s a window where the card is charged and inventory isn\'t reserved, which product must accept as a `PENDING` UX, not a bug; a compensation can race a concurrent read (someone sees the reservation before it\'s released); and if any step\'s effect leaves the saga\'s boundary (an email sent), no compensation truly un-sends it. The staff-level answer includes the alternative: if the invariant is truly atomic, merge the ownership — one service, one database, no saga.',
        uk: 'Оркестрована saga: оркестратор (чи order-сервіс) веде create-order → charge → reserve, кожен крок — локальна транзакція, що публікує через власний outbox, кожен крок idempotent (ключі з order id + кроку), компенсації визначені на крок (refund, release), а замовлення живе в явних станах — `PENDING`, доки ланцюг не підтвердився, щоб напівготове замовлення не відвантажилось (semantic lock). Збій посеред ланцюга запускає компенсації у зворотному порядку; стан самого оркестратора теж публікується через outbox, щоб він міг впасти і відновитись. Де все ще ламається, чесно: сама компенсація може впасти (потрібні retry + dead-letter ескалація до людей); «все або нічого» — лише *eventual*: є вікно, де картка списана, а резерву нема, і продакт мусить прийняти це як `PENDING`-UX, а не баг; компенсація може гнатися з конкурентним читанням (хтось бачить резерв до звільнення); і якщо ефект кроку виходить за межу saga (надісланий email) — жодна компенсація його справді не відішле назад. Staff-відповідь містить альтернативу: якщо інваріант справді атомарний — обʼєднай ownership: один сервіс, одна база, без saga.',
      },
      level: 'staff',
    },
  ],
  seeAlso: ['m10-grpc', 'm15-webhooks', 'm16-async-messaging', 'm19-errors-status', 'm20-pagination-limits'],
  sources: [
    { title: 'IETF draft — The Idempotency-Key HTTP Header Field', url: 'https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/' },
    { title: 'Stripe API — Idempotent requests', url: 'https://docs.stripe.com/api/idempotent_requests' },
    { title: 'Stripe blog — Designing robust and predictable APIs with idempotency', url: 'https://stripe.com/blog/idempotency' },
    { title: 'microservices.io — Pattern: Transactional outbox', url: 'https://microservices.io/patterns/data/transactional-outbox.html' },
    { title: 'microservices.io — Pattern: Saga', url: 'https://microservices.io/patterns/data/saga.html' },
    { title: 'AWS Architecture Blog — Exponential Backoff and Jitter', url: 'https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/' },
    { title: 'AWS Builders\' Library — Timeouts, retries, and backoff with jitter', url: 'https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/' },
    { title: 'Martin Fowler — CircuitBreaker (after Nygard, "Release It!")', url: 'https://martinfowler.com/bliki/CircuitBreaker.html' },
    { title: 'Brandur Leach — Implementing Stripe-like Idempotency Keys in Postgres', url: 'https://brandur.org/idempotency-keys' },
  ],
};
