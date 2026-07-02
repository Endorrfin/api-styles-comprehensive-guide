import type { Module } from '../types';

/*
 * m15-webhooks — the reverse API (s3, Real-time/push/event-driven). SIGNATURE: sim 'webhook-delivery'
 * (sign → attempts → backoff → dedup/DLQ across healthy/flaky/down endpoints + an idempotency toggle).
 * Eight curriculum topics: reverse callbacks → at-least-once → retries/backoff (sim) → idempotency
 * keys → HMAC signature verification → replay & ordering → dead-letter → vs polling/WebSockets +
 * verdict. Facts web-verified S9: Standard Webhooks spec (webhook-id/-timestamp/-signature headers,
 * HMAC-SHA256 "v1,<base64>", key rotation via space-delimited signatures; adopted by OpenAI, Anthropic,
 * Google Gemini, Twilio, PagerDuty, Svix, Kong, Supabase…); Stripe-Signature `t=…,v1=…` = HMAC-SHA256
 * over `t.payload`, 5-min default tolerance, exponential retries up to 3 days then the endpoint is
 * disabled; GitHub X-Hub-Signature-256 = `sha256=<hex>` over the body only, NO automatic retries —
 * manual/API redelivery within 3 days.
 */
export const m15: Module = {
  id: 'm15-webhooks',
  num: 15,
  section: 's3-realtime-events',
  order: 4,
  level: 'senior',
  signature: true,
  title: { en: 'Webhooks', uk: 'Webhooks' },
  tagline: {
    en: 'A reverse API: they call you on an event.',
    uk: 'Зворотний API: вам телефонують на подію.',
  },
  readMins: 18,
  mentalModel: {
    en: 'A webhook flips the arrow: instead of you polling their API, **you register a URL and the provider POSTs events to it**. That makes you the server now — running a public endpoint on an unreliable network where delivery is **at-least-once** by design. Everything in this module follows from that: retries with backoff, duplicates you must de-duplicate, signatures you must verify, order you must not assume, and a dead-letter queue for what still fails.',
    uk: 'Webhook розвертає стрілку: замість того, щоб ти опитував їхній API, **ти реєструєш URL, і провайдер POST-ить події на нього**. Тепер сервер — це ти: тримаєш публічний endpoint у ненадійній мережі, де доставка за дизайном **at-least-once**. Усе в цьому модулі випливає звідси: retries з backoff, дублікати, які мусиш дедуплікувати, підписи, які мусиш перевіряти, порядок, на який не можна покладатися, і dead-letter черга для того, що все одно впало.',
  },
  topics: [
    // ── T1 · Reverse API callbacks ────────────────────────────────────────────
    {
      id: 'reverse-api-callbacks',
      title: { en: 'The reverse API: callbacks over HTTP', uk: 'Зворотний API: callbacks через HTTP' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Every style so far had the client ask. Webhooks answer the opposite question: *how does a provider tell you something happened* — a payment settled, a build finished, an issue closed — **without you polling**? You register a callback URL in their dashboard or API; when the event occurs, their system **POSTs a payload to your URL**. It’s just HTTP — but the roles flip: the API *consumer* now **operates a public HTTP endpoint**, with everything that implies — TLS, availability, input validation, and an attacker-reachable surface. Webhooks are server→server push for discrete events; that (not streams, not browsers) is their home turf.',
            uk: 'У всіх стилях дотепер питав клієнт. Webhooks відповідають на протилежне питання: *як провайдер скаже тобі, що щось сталося* — платіж пройшов, білд завершився, issue закрили — **без твого polling-у**? Ти реєструєш callback-URL у їхньому дашборді чи API; коли подія стається, їхня система **POST-ить payload на твій URL**. Це просто HTTP — але ролі міняються: *споживач* API тепер **тримає публічний HTTP endpoint** з усім, що з цього випливає, — TLS, доступність, валідація вводу й досяжна для атакувальника поверхня. Webhooks — це server→server push дискретних подій; саме там (не стріми, не браузери) їхня домівка.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Your webhook endpoint is a public attack surface', uk: 'Твій webhook endpoint — публічна поверхня атаки' },
          md: {
            en: 'Anyone on the internet can POST to that URL — the provider is merely the sender you *hope* for. Treat it like any public API: HTTPS only, verify the signature before touching the payload (T5), validate and bound the body, rate-limit, and never execute side effects for unverified requests. “Security through unguessable URL” is not a control; URLs leak into logs and configs.',
            uk: 'Будь-хто в інтернеті може POST-ити на той URL — провайдер лише відправник, на якого ти *сподіваєшся*. Стався до нього як до будь-якого публічного API: лише HTTPS, перевіряй підпис до того, як торкнешся payload (T5), валідуй і обмежуй тіло, rate-limit-и, і ніколи не виконуй side effects для неперевірених запитів. «Безпека через невгадуваний URL» — не контроль; URL-и течуть у логи й конфіги.',
          },
        },
      ],
    },
    // ── T2 · At-least-once delivery ───────────────────────────────────────────
    {
      id: 'delivery-at-least-once',
      title: { en: 'Delivery is at-least-once', uk: 'Доставка — at-least-once' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'A provider’s delivery pipeline is a queue plus workers: the event is stored, a worker POSTs it to your URL and waits (briefly) for a **2xx**. Anything else — 5xx, timeout, connection reset — and the delivery is considered failed and will be **retried**. Now the crucial case: your handler *succeeds* but the 2xx is **lost on the way back** (crashed pod, LB timeout). The provider can’t distinguish “processed, ack lost” from “never processed” — so it retries, and you receive the same event **twice**. Over an unreliable network the only honest promises are *at-most-once* (fire and forget, events silently lost) or **at-least-once** (retries, duplicates possible). Serious providers choose at-least-once — **exactly-once *delivery* is impossible; exactly-once *effect* is your job** (T4).',
            uk: 'Пайплайн доставки провайдера — це черга плюс воркери: подія зберігається, воркер POST-ить її на твій URL і (недовго) чекає **2xx**. Будь-що інше — 5xx, timeout, обрив зʼєднання — доставка вважається невдалою і буде **повторена**. Тепер ключовий випадок: твій handler *успішний*, але 2xx **губиться на зворотному шляху** (упалий pod, timeout LB). Провайдер не може відрізнити «оброблено, ack загублено» від «не оброблено взагалі» — тож повторює, і ти отримуєш ту саму подію **двічі**. У ненадійній мережі чесних обіцянок лише дві: *at-most-once* (вистрілив і забув, події тихо губляться) або **at-least-once** (retries, можливі дублікати). Серйозні провайдери обирають at-least-once — **exactly-once *доставка* неможлива; exactly-once *ефект* — твоя робота** (T4).',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'Ack fast, process async', uk: 'Ack-ай швидко, обробляй асинхронно' },
          md: {
            en: 'Providers time out slow handlers — and a timeout counts as a failure, triggering a retry of work you may have half-done. The robust shape: **verify the signature, persist the event to your own queue, return 2xx immediately**, and process from the queue at your own pace. Your webhook handler should be milliseconds of I/O, not seconds of business logic.',
            uk: 'Провайдери таймаутять повільні handler-и — а timeout рахується невдачею і тригерить retry роботи, яку ти, можливо, наполовину зробив. Надійна форма: **перевір підпис, збережи подію у власну чергу, поверни 2xx одразу** — і обробляй із черги у своєму темпі. Твій webhook handler має бути мілісекундами I/O, а не секундами бізнес-логіки.',
          },
        },
      ],
    },
    // ── T3 · Retries & backoff (the sim) ──────────────────────────────────────
    {
      id: 'retries-backoff',
      title: { en: 'Retries & exponential backoff', uk: 'Retries та exponential backoff' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'When a delivery fails, retrying immediately just hammers a struggling endpoint. Providers therefore space attempts with **exponential backoff** (each wait a multiple of the last, usually with jitter) across a bounded window. Policies differ more than people expect — the table below contrasts two you’ll actually meet. The simulator plays one event’s delivery through a healthy, a flaky, and a dead endpoint: watch the same `webhook-id` re-delivered after each failure, the waits growing, and — the module’s thesis — what the **“consumer dedups”** toggle does to the number of *business effects* when an ack goes missing.',
            uk: 'Коли доставка падає, миттєвий повтор лише добиває endpoint, якому й так зле. Тому провайдери розносять спроби **exponential backoff-ом** (кожне очікування — кратне попередньому, зазвичай із jitter) у обмеженому вікні. Політики різняться сильніше, ніж очікують, — таблиця нижче зіставляє дві, які ти реально зустрінеш. Симулятор програє доставку однієї події через здоровий, нестабільний і мертвий endpoint: дивись, як той самий `webhook-id` передоставляється після кожної невдачі, як ростуть паузи і — теза модуля — що робить перемикач **«consumer дедуплікує»** з кількістю *бізнес-ефектів*, коли губиться ack.',
          },
        },
        {
          kind: 'sim',
          sim: 'webhook-delivery',
          caption: {
            en: 'Step one event through delivery. Flaky endpoint: attempt 1 fails clean (500), attempt 2 processes but the ack is lost, attempt 3 re-delivers the same evt_42 — with dedup ON the duplicate is skipped (1 effect); turn it OFF and the invoice is paid twice. Endpoint down: the backoff run ends in the dead-letter queue.',
            uk: 'Прокрокуй доставку однієї події. Нестабільний endpoint: спроба 1 падає чисто (500), спроба 2 обробляє, але ack губиться, спроба 3 передоставляє той самий evt_42 — з увімкненою дедуплікацією дублікат пропускається (1 ефект); вимкни її — і рахунок оплатять двічі. Endpoint лежить: серія backoff завершується в dead-letter черзі.',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Provider', uk: 'Провайдер' },
            { en: 'Auto-retry', uk: 'Авто-retry' },
            { en: 'Window', uk: 'Вікно' },
            { en: 'After exhaustion', uk: 'Після вичерпання' },
          ],
          rows: [
            [
              { en: 'Stripe', uk: 'Stripe' },
              { en: 'Exponential backoff', uk: 'Exponential backoff' },
              { en: 'Up to 3 days (live mode)', uk: 'До 3 днів (live mode)' },
              { en: 'Keeps failing → endpoint disabled', uk: 'Далі падає → endpoint вимикається' },
            ],
            [
              { en: 'GitHub', uk: 'GitHub' },
              { en: 'None — delivers once', uk: 'Немає — доставляє раз' },
              { en: 'Redeliver manually / via API, 3 days', uk: 'Redeliver вручну / через API, 3 дні' },
              { en: 'You detect and redeliver yourself', uk: 'Сам виявляєш і передоставляєш' },
            ],
          ],
          caption: {
            en: 'Two real policies at the extremes: read your provider’s retry contract before designing the consumer — it decides your dedup TTL (T4) and your monitoring (T7).',
            uk: 'Дві реальні політики на полюсах: читай retry-контракт свого провайдера до дизайну consumer-а — він визначає твій TTL дедуплікації (T4) і твій моніторинг (T7).',
          },
        },
      ],
    },
    // ── T4 · Idempotency keys ─────────────────────────────────────────────────
    {
      id: 'idempotency-keys',
      title: { en: 'Idempotency keys: exactly-once effect', uk: 'Idempotency keys: exactly-once ефект' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Since duplicates are guaranteed *by design*, the consumer converts at-least-once **delivery** into exactly-once **effect** with an **idempotency key**: the provider’s stable event id (`webhook-id` in Standard Webhooks, `event.id` at Stripe, `X-GitHub-Delivery` at GitHub). The recipe: before processing, atomically record the id in a dedup store — a `UNIQUE` insert in the events table inside the same transaction as the business effect is the gold standard, because the effect and the “I did this” marker commit or roll back **together**. Seen the id before? Return 2xx and do nothing — acking a duplicate is correct, it just confirms delivery. This is the same idempotency machinery every reliable API needs (m21); webhooks simply make it non-optional.',
            uk: 'Оскільки дублікати гарантовані *за дизайном*, consumer перетворює at-least-once **доставку** на exactly-once **ефект** через **idempotency key**: стабільний id події від провайдера (`webhook-id` у Standard Webhooks, `event.id` у Stripe, `X-GitHub-Delivery` у GitHub). Рецепт: перед обробкою атомарно запиши id у сховище дедуплікації — `UNIQUE`-insert у таблицю подій у тій самій транзакції, що й бізнес-ефект, — золотий стандарт, бо ефект і позначка «я це зробив» комітяться чи відкочуються **разом**. Бачив id раніше? Поверни 2xx і не роби нічого — ack дубліката коректний, він лише підтверджує доставку. Це та сама машинерія idempotency, потрібна кожному надійному API (m21); webhooks просто роблять її обовʼязковою.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Your dedup TTL must outlive their retry window', uk: 'Твій TTL дедуплікації має пережити їхнє retry-вікно' },
          md: {
            en: 'If Stripe retries for up to 3 days and your dedup keys expire after 24 hours, a day-2 retry sails past the check and double-fires. Keep processed ids at least as long as the provider’s maximum retry window (plus manual-redelivery windows — GitHub allows redelivering for 3 days). Disk is cheaper than refunds.',
            uk: 'Якщо Stripe повторює до 3 днів, а твої ключі дедуплікації спливають за 24 години, retry другого дня проскочить перевірку і спрацює двічі. Тримай оброблені id щонайменше стільки, скільки триває максимальне retry-вікно провайдера (плюс вікна ручного redelivery — GitHub дозволяє передоставку 3 дні). Диск дешевший за повернення коштів.',
          },
        },
      ],
    },
    // ── T5 · HMAC signature verification ──────────────────────────────────────
    {
      id: 'signature-verification-hmac',
      title: { en: 'Signature verification (HMAC)', uk: 'Перевірка підпису (HMAC)' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'How do you know a POST really came from the provider? A shared secret and an **HMAC-SHA256** signature (RFC 2104): the provider computes `HMAC(secret, message)` and sends it in a header; you recompute and compare. The header dialects differ — Stripe sends `Stripe-Signature: t=<ts>,v1=<hex>` signing `"<ts>.<payload>"`; GitHub sends `X-Hub-Signature-256: sha256=<hex>` over the **body only**; and **Standard Webhooks** — the spec Stripe’s scheme inspired, now adopted by OpenAI, Anthropic, Google, Twilio, PagerDuty and others — standardizes the trio `webhook-id` / `webhook-timestamp` / `webhook-signature`, signing `"<id>.<ts>.<payload>"` with a base64 `v1,<sig>` value, and supports **key rotation** by sending several space-delimited signatures (verify against each until one matches).',
            uk: 'Звідки знати, що POST справді прийшов від провайдера? Спільний секрет і підпис **HMAC-SHA256** (RFC 2104): провайдер рахує `HMAC(secret, message)` і шле в заголовку; ти перераховуєш і порівнюєш. Діалекти заголовків різняться — Stripe шле `Stripe-Signature: t=<ts>,v1=<hex>`, підписуючи `"<ts>.<payload>"`; GitHub шле `X-Hub-Signature-256: sha256=<hex>` лише над **тілом**; а **Standard Webhooks** — специфікація, яку надихнула схема Stripe і яку вже прийняли OpenAI, Anthropic, Google, Twilio, PagerDuty та інші, — стандартизує трійцю `webhook-id` / `webhook-timestamp` / `webhook-signature`, підписуючи `"<id>.<ts>.<payload>"` base64-значенням `v1,<sig>`, і підтримує **ротацію ключів**, надсилаючи кілька підписів через пробіл (перевіряй кожен, доки один не зійдеться).',
          },
        },
        {
          kind: 'code',
          lang: 'js',
          code: `import { createHmac, timingSafeEqual } from 'node:crypto';

// Standard Webhooks verification: HMAC-SHA256 over "<id>.<timestamp>.<rawBody>"
export function verifyWebhook(headers, rawBody, secret) {
  const id = headers['webhook-id'];
  const ts = headers['webhook-timestamp'];                        // sign the RAW header value
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false; // ±5 min replay window (T6)

  const expected = Buffer.from(
    createHmac('sha256', secret)
      .update(\`\${id}.\${ts}.\${rawBody}\`)                           // the RAW bytes — never re-serialized JSON
      .digest('base64'),
  );

  return (headers['webhook-signature'] ?? '')                      // "v1,AAA… v1,BBB…" during key rotation
    .split(' ')
    .map((part) => Buffer.from(part.split(',')[1] ?? ''))
    .some((sig) => sig.length === expected.length &&               // BYTE lengths (timingSafeEqual throws otherwise)
      timingSafeEqual(sig, expected));                             // constant-time compare
}`,
          note: {
            en: 'Two classic bugs: verifying a re-serialized body (JSON.parse → stringify changes bytes → valid signatures fail) and comparing with === (a timing side-channel). Keep the raw body; use timingSafeEqual.',
            uk: 'Два класичні баги: перевірка пересеріалізованого тіла (JSON.parse → stringify змінює байти → валідні підписи падають) і порівняння через === (часовий side-channel). Тримай сире тіло; використовуй timingSafeEqual.',
          },
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'Verify before you parse, act after you verify', uk: 'Перевіряй до парсингу, дій після перевірки' },
          md: {
            en: 'The signature check is your authentication — do it before business logic, ideally before even JSON-parsing untrusted bytes. Note what each dialect protects: schemes that sign a timestamp (Stripe, Standard Webhooks) bound replay; GitHub’s body-only signature doesn’t, so there you lean on TLS plus dedup by `X-GitHub-Delivery`. And keep secrets per-endpoint, rotatable, and out of code.',
            uk: 'Перевірка підпису — твоя автентифікація: роби її до бізнес-логіки, в ідеалі навіть до JSON-парсингу недовірених байтів. Зваж, що захищає кожен діалект: схеми з підписаним timestamp (Stripe, Standard Webhooks) обмежують replay; підпис GitHub лише над тілом — ні, тож там спирайся на TLS плюс дедуплікацію за `X-GitHub-Delivery`. І тримай секрети per-endpoint, ротованими й поза кодом.',
          },
        },
      ],
    },
    // ── T6 · Replay & ordering ────────────────────────────────────────────────
    {
      id: 'replay-and-ordering',
      title: { en: 'Replay attacks & event ordering', uk: 'Replay-атаки та порядок подій' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Two subtler failure modes. **Replay:** a captured request has a *valid* signature forever — unless time is part of the signed message. That’s why the timestamp is signed and checked against a **tolerance** (Stripe’s libraries default to 5 minutes): outside the window, reject; inside it, your idempotency key (T4) already collapses re-sends. **Ordering:** retries, parallel workers, and network jitter mean events can arrive **out of order** — `invoice.paid` before `invoice.created` is a normal Tuesday. Don’t encode state transitions in arrival order. The robust designs: send **thin payloads** (“object X changed — here’s its id”) and have the consumer fetch the *current* state from the API; or include a **sequence / version number** per object and ignore anything stale.',
            uk: 'Два тонші режими відмови. **Replay:** перехоплений запит має *валідний* підпис назавжди — якщо час не є частиною підписаного повідомлення. Тому timestamp підписується й перевіряється проти **толерантності** (бібліотеки Stripe за замовчуванням — 5 хвилин): поза вікном — відхиляй; всередині — твій idempotency key (T4) вже схлопує повтори. **Порядок:** retries, паралельні воркери й мережевий jitter означають, що події можуть приходити **не по черзі** — `invoice.paid` до `invoice.created` — звичайний вівторок. Не кодуй переходи стану порядком прибуття. Надійні дизайни: шли **тонкі payload-и** («обʼєкт X змінився — ось його id»), а consumer хай тягне *поточний* стан з API; або додавай **sequence / version** на обʼєкт і ігноруй застаріле.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Thin payloads age better', uk: 'Тонкі payload-и старіють краще' },
          md: {
            en: 'A fat payload is a snapshot that’s stale the moment it’s queued — act on it and you may overwrite newer state. “Id + type, then fetch” costs one API call and is self-healing: whatever order events arrive in, you always apply the current truth. Bonus: less PII in transit and in your logs.',
            uk: 'Товстий payload — це знімок, застарілий у мить постановки в чергу: дій за ним — і можеш перезаписати новіший стан. «Id + тип, потім fetch» коштує один виклик API і самозцілюється: у якому б порядку не прийшли події, ти завжди застосовуєш поточну правду. Бонус: менше PII в дорозі й у твоїх логах.',
          },
        },
      ],
    },
    // ── T7 · Dead-letter & monitoring ─────────────────────────────────────────
    {
      id: 'dead-letter',
      title: { en: 'Dead-letter queues & silent death', uk: 'Dead-letter черги та тиха смерть' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'When the retry budget is spent, a good provider doesn’t just drop the event — it parks the delivery in a **dead-letter queue**: inspectable, alertable, and **redeliverable** once you’ve fixed the endpoint (GitHub exposes redelivery in the UI and REST API for 3 days; Stripe lets you resend from the dashboard — and *disables* an endpoint that keeps failing). The consumer-side mirror: alert on delivery failure rates, watch for the provider’s “endpoint disabled” emails, and — the senior habit — **reconcile periodically**: a scheduled job that polls the source of truth for anything your event stream missed. Webhooks fail *silently*: no traffic looks exactly like no events.',
            uk: 'Коли бюджет retries вичерпано, добрий провайдер не просто кидає подію — він паркує доставку в **dead-letter чергу**: її видно, на неї можна алертити й **передоставити**, щойно ти полагодив endpoint (GitHub дає redelivery в UI та REST API на 3 дні; Stripe дозволяє повторно надіслати з дашборда — і *вимикає* endpoint, що падає далі). Дзеркало на боці consumer-а: алерти на частку невдалих доставок, увага до листів провайдера «endpoint disabled» і — звичка senior-а — **періодична звірка**: планова джоба, що опитує джерело правди на все, що твій потік подій пропустив. Webhooks падають *тихо*: відсутність трафіку виглядає точнісінько як відсутність подій.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'No traffic ≠ no events', uk: 'Немає трафіку ≠ немає подій' },
          md: {
            en: 'An expired TLS cert, a broken route, a provider that quietly disabled your endpoint after three days of 500s — from inside your system all three look like a calm, event-free week. Monitor the *provider’s* delivery dashboard or API, not just your own logs, and run a reconciliation poll as the safety net under the push.',
            uk: 'Протухлий TLS-сертифікат, зламаний маршрут, провайдер, що тихо вимкнув твій endpoint після трьох днів 500-х, — зсередини твоєї системи всі три виглядають як спокійний тиждень без подій. Моніторь дашборд чи API доставки *провайдера*, не лише власні логи, і тримай звірковий poll страхувальною сіткою під push-ем.',
          },
        },
      ],
    },
    // ── T8 · vs polling / WebSockets + the verdict ────────────────────────────
    {
      id: 'vs-polling-vs-websockets',
      title: { en: 'Webhooks vs polling vs WebSockets', uk: 'Webhooks проти polling проти WebSockets' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Webhooks compete with two alternatives. Against **polling** they trade infrastructure for efficiency: polling wastes requests when nothing changed and adds latency up to the poll interval, but it’s trivial to run and *pull-controlled* — you can’t be overwhelmed. Against **WebSockets/SSE** the split is topological: sockets push to **connected clients** (browsers, live UIs), webhooks push to **servers that must not miss events even while down** — the provider’s queue holds and retries deliveries through your outage, which no live socket does. Many products need both: a webhook updates your backend, which fans out to browsers over WS/SSE (m12/m13).',
            uk: 'Webhooks конкурують із двома альтернативами. Проти **polling-у** вони міняють інфраструктуру на ефективність: polling палить запити, коли нічого не змінилося, і додає затримку до інтервалу опитування, але його тривіально тримати і він *pull-контрольований* — тебе не завалять. Проти **WebSockets/SSE** поділ топологічний: сокети пушать **підключеним клієнтам** (браузери, живі UI), webhooks пушать **серверам, які не можуть пропустити події навіть лежачи** — черга провайдера тримає і повторює доставки крізь твій даунтайм, чого жоден живий сокет не робить. Багатьом продуктам треба обидва: webhook оновлює твій бекенд, а той розсилає браузерам через WS/SSE (m12/m13).',
          },
        },
        {
          kind: 'compare',
          a: { en: 'Reach for webhooks', uk: 'Бери webhooks' },
          b: { en: 'Prefer polling / sockets', uk: 'Обери polling / сокети' },
          rows: [
            [
              { en: 'Receiver', uk: 'Отримувач' },
              { en: 'A server that must not miss events', uk: 'Сервер, що не може пропустити події' },
              { en: 'Browsers / live UIs → WS (m12) or SSE (m13)', uk: 'Браузери / живі UI → WS (m12) чи SSE (m13)' },
            ],
            [
              { en: 'Event rate', uk: 'Частота подій' },
              { en: 'Sparse, discrete events — push beats waste', uk: 'Рідкі дискретні події — push бʼє марнотратство' },
              { en: 'Constant streams → sockets; rare checks → polling', uk: 'Постійні потоки → сокети; рідкі перевірки → polling' },
            ],
            [
              { en: 'Reliability', uk: 'Надійність' },
              { en: 'Provider queues + retries through your downtime', uk: 'Черги провайдера + retries крізь твій даунтайм' },
              { en: 'Poll-and-reconcile is simpler to audit', uk: 'Poll-and-reconcile простіше аудитувати' },
            ],
            [
              { en: 'Your cost', uk: 'Твоя ціна' },
              { en: 'Public endpoint + verify + dedup + monitor', uk: 'Публічний endpoint + перевірка + дедуплікація + моніторинг' },
              { en: 'A cron job hitting GET is all it takes', uk: 'Досить cron-джоби з GET-ом' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'The verdict', uk: 'Вердикт' },
          md: {
            en: 'Use webhooks for server→server notification of discrete events — payments, CI, tickets, provisioning — where polling would be wasteful and a missed event is unacceptable. Avoid them for browser delivery (that’s WS/SSE), for high-frequency streams (that’s messaging, m16), or when you can’t operate a hardened public endpoint — then poll. And when you *are* the provider: sign with a timestamp, retry with backoff, expose a dead-letter with redelivery, and document your policy — everything this module demanded of the consumer, mirrored.',
            uk: 'Бери webhooks для server→server сповіщень про дискретні події — платежі, CI, тикети, provisioning — де polling марнотратний, а пропущена подія неприйнятна. Уникай їх для доставки в браузер (це WS/SSE), для високочастотних потоків (це messaging, m16) чи коли не можеш тримати захищений публічний endpoint — тоді опитуй. А коли провайдер — *ти*: підписуй із timestamp-ом, повторюй із backoff-ом, дай dead-letter із redelivery і задокументуй політику — все, що цей модуль вимагав від consumer-а, віддзеркалено.',
          },
        },
      ],
    },
  ],
  keyPoints: [
    { en: 'A webhook is a reverse API: you register a URL, the provider POSTs events — and you now operate a public HTTP endpoint.', uk: 'Webhook — зворотний API: ти реєструєш URL, провайдер POST-ить події — і тепер ти тримаєш публічний HTTP endpoint.' },
    { en: 'Delivery is at-least-once by design: lost acks and timeouts cause re-delivery, so duplicates are the price of reliability.', uk: 'Доставка за дизайном at-least-once: загублені ack-и й таймаути ведуть до передоставки, тож дублікати — ціна надійності.' },
    { en: 'Ack 2xx fast and process from your own queue; providers retry with exponential backoff under wildly different policies (Stripe: ~3 days then disable; GitHub: none — manual redelivery).', uk: 'Ack-ай 2xx швидко й обробляй із власної черги; провайдери повторюють з exponential backoff за дуже різними політиками (Stripe: ~3 дні, потім вимикає; GitHub: жодних — ручний redelivery).' },
    { en: 'Exactly-once effect is the consumer’s job: dedup on the event id, atomically with the business effect, kept longer than the retry window.', uk: 'Exactly-once ефект — робота consumer-а: дедуплікація за id події, атомарно з бізнес-ефектом, збережена довше за retry-вікно.' },
    { en: 'Verify HMAC-SHA256 signatures over the RAW body with a constant-time compare; a signed timestamp (±5 min) bounds replay — Standard Webhooks (webhook-id/-timestamp/-signature) is the emerging convention.', uk: 'Перевіряй HMAC-SHA256 підписи над СИРИМ тілом константним у часі порівнянням; підписаний timestamp (±5 хв) обмежує replay — Standard Webhooks (webhook-id/-timestamp/-signature) — конвенція, що набирає силу.' },
    { en: 'Never assume ordering (thin payloads + fetch state, or sequence numbers), and never trust silence — DLQ, delivery monitoring, and a reconciliation poll catch what push missed.', uk: 'Ніколи не покладайся на порядок (тонкі payload-и + fetch стану або sequence-номери) і ніколи не вір тиші — DLQ, моніторинг доставки та звірковий poll ловлять те, що push пропустив.' },
  ],
  pitfalls: [
    {
      title: { en: 'Acting on unverified (or re-serialized) payloads', uk: 'Діяти за неперевіреними (чи пересеріалізованими) payload-ами' },
      body: {
        en: 'Anyone can POST to your URL — without signature verification you’ll execute an attacker’s “payment succeeded”. And the classic implementation bug: verifying JSON.parse→stringify output instead of the raw bytes, so genuine signatures fail and someone “fixes” it by removing the check. Verify the raw body, with timingSafeEqual, before any logic.',
        uk: 'Будь-хто може POST-ити на твій URL — без перевірки підпису ти виконаєш «платіж пройшов» від атакувальника. І класичний баг реалізації: перевірка виводу JSON.parse→stringify замість сирих байтів, тож справжні підписи падають, і хтось «лагодить» це, прибираючи перевірку. Перевіряй сире тіло, з timingSafeEqual, до будь-якої логіки.',
      },
    },
    {
      title: { en: 'A non-idempotent consumer (the double charge)', uk: 'Неідемпотентний consumer (подвійне списання)' },
      body: {
        en: 'If processing isn’t deduplicated by event id, the guaranteed-by-design duplicate delivery becomes a duplicated business effect: two shipments, two invoices, two charges. Store processed ids atomically with the effect and keep them longer than the provider’s retry window.',
        uk: 'Якщо обробка не дедуплікується за id події, гарантована дизайном повторна доставка стає подвоєним бізнес-ефектом: два відвантаження, два рахунки, два списання. Зберігай оброблені id атомарно з ефектом і тримай їх довше за retry-вікно провайдера.',
      },
    },
    {
      title: { en: 'Trusting silence: no monitoring, no reconciliation', uk: 'Довіряти тиші: без моніторингу, без звірки' },
      body: {
        en: 'Webhooks fail silently — an expired cert or a provider-disabled endpoint looks like a quiet week. Watch the provider’s delivery metrics, alert on failure rates, and run a periodic reconciliation poll against the source of truth so missed events surface as diffs, not as customer complaints.',
        uk: 'Webhooks падають тихо — протухлий сертифікат чи вимкнений провайдером endpoint виглядає як спокійний тиждень. Стеж за метриками доставки провайдера, алерти на частку невдач і періодичний звірковий poll проти джерела правди — щоб пропущені події зринали як diff-и, а не як скарги клієнтів.',
      },
    },
  ],
  interview: [
    {
      q: { en: 'Design a webhook consumer for payment events. What can go wrong and how do you defend?', uk: 'Спроєктуй webhook consumer для платіжних подій. Що може піти не так і як захищаєшся?' },
      a: {
        en: 'The endpoint does four things fast: verify, persist, ack, defer. Verify the HMAC signature over the RAW request body (never re-serialized JSON) with a constant-time compare, and check the signed timestamp against a ~5-minute tolerance to bound replay. Persist the event to my own queue/table and return 2xx immediately — providers time out slow handlers and a timeout triggers a retry of half-done work. Process asynchronously with an idempotency check: insert the event id with a UNIQUE constraint in the same transaction as the business effect, so the effect applies exactly once no matter how many times delivery repeats — at-least-once delivery guarantees duplicates (a success whose ack is lost gets re-delivered). Never infer state from arrival order — retries and parallel workers reorder events — so use thin payloads and fetch current state, or sequence numbers to drop stale updates. Keep dedup records longer than the provider’s retry window (Stripe retries up to 3 days). And don’t trust silence: monitor the provider’s delivery dashboard, alert on failures (Stripe disables persistently failing endpoints), and run a periodic reconciliation poll as the net under the push.',
        uk: 'Endpoint робить чотири речі швидко: перевіряє, зберігає, ack-ає, відкладає. Перевіряю HMAC-підпис над СИРИМ тілом запиту (ніколи не пересеріалізованим JSON) константним у часі порівнянням і звіряю підписаний timestamp із толерантністю ~5 хвилин, щоб обмежити replay. Зберігаю подію у власну чергу/таблицю і повертаю 2xx одразу — провайдери таймаутять повільні handler-и, а timeout тригерить retry напівзробленої роботи. Обробляю асинхронно з перевіркою ідемпотентності: insert id події з UNIQUE-обмеженням у тій самій транзакції, що й бізнес-ефект, — тож ефект застосовується рівно раз, скільки б разів не повторилася доставка: at-least-once гарантує дублікати (успіх із загубленим ack передоставляється). Ніколи не виводжу стан із порядку прибуття — retries і паралельні воркери переставляють події — тож тонкі payload-и + fetch поточного стану або sequence-номери, щоб відкидати застаріле. Записи дедуплікації тримаю довше за retry-вікно провайдера (Stripe повторює до 3 днів). І не вірю тиші: моніторю дашборд доставки провайдера, алерти на невдачі (Stripe вимикає endpoint-и, що стабільно падають) і періодичний звірковий poll як сітку під push-ем.',
      },
      level: 'senior',
    },
    {
      q: { en: 'Now the other chair: you’re building the webhook PROVIDER. What does a good delivery system include?', uk: 'Тепер інше крісло: ти будуєш webhook-ПРОВАЙДЕРА. Що включає добра система доставки?' },
      a: {
        en: 'Durable queueing first: the event is persisted before any delivery attempt, and each endpoint gets independent delivery so one dead consumer can’t block others. Deliveries POST with a signed payload — HMAC-SHA256 over id.timestamp.body per Standard Webhooks (webhook-id / webhook-timestamp / webhook-signature), which gives consumers replay protection and a ready idempotency key; support key rotation by sending multiple space-delimited signatures. Treat only 2xx as success, with a short timeout; on failure, retry on an exponential backoff schedule with jitter across a documented window (Stripe-style: days). After exhaustion, park the delivery in a dead-letter queue with UI/API redelivery, notify the owner, and auto-disable endpoints that fail persistently — while exposing delivery logs and metrics so consumers can see their own health. Document everything: retry schedule, timeout, signature scheme, IP ranges. The meta-rule: everything I’d demand as a consumer — signatures, retries, dedup keys, observability — I must provide as the producer.',
        uk: 'Спершу довговічна черга: подія зберігається до будь-якої спроби доставки, і кожен endpoint отримує незалежну доставку, щоб один мертвий consumer не блокував інших. Доставки POST-яться з підписаним payload — HMAC-SHA256 над id.timestamp.body за Standard Webhooks (webhook-id / webhook-timestamp / webhook-signature): це дає consumer-ам захист від replay і готовий idempotency key; підтримай ротацію ключів кількома підписами через пробіл. Успіхом вважай лише 2xx, з коротким timeout-ом; при невдачі — retries за exponential backoff із jitter у задокументованому вікні (як у Stripe: дні). Після вичерпання — паркуй доставку в dead-letter чергу з redelivery через UI/API, повідом власника й авто-вимикай endpoint-и, що падають стабільно, — водночас відкривши логи й метрики доставки, щоб consumer-и бачили своє здоровʼя. Задокументуй усе: розклад retries, timeout, схему підпису, діапазони IP. Мета-правило: все, чого я вимагав би як consumer, — підписи, retries, ключі дедуплікації, observability — мушу дати як producer.',
      },
      level: 'senior',
    },
  ],
  seeAlso: ['m21-idempotency', 'm13-sse', 'm12-websockets', 'm16-async-messaging', 'm17-auth-identity', 'm5-rest'],
  sources: [
    { title: 'Standard Webhooks — the specification', url: 'https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md' },
    { title: 'Stripe — Receive events in your webhook endpoint (retries, best practices)', url: 'https://docs.stripe.com/webhooks' },
    { title: 'Stripe — Webhook signatures (Stripe-Signature, tolerance)', url: 'https://docs.stripe.com/webhooks/signature' },
    { title: 'GitHub — Validating webhook deliveries (X-Hub-Signature-256)', url: 'https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries' },
    { title: 'GitHub — Handling failed webhook deliveries (no auto-retry; redelivery)', url: 'https://docs.github.com/en/webhooks/using-webhooks/handling-failed-webhook-deliveries' },
    { title: 'RFC 2104 — HMAC: Keyed-Hashing for Message Authentication', url: 'https://datatracker.ietf.org/doc/html/rfc2104' },
    { title: 'webhooks.fyi — webhook security & design patterns directory', url: 'https://webhooks.fyi/' },
  ],
};
