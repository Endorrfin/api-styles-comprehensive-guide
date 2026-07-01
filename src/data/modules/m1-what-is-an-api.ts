import type { Module } from '../types';

/*
 * m1-what-is-an-api — the beginner on-ramp (s3). No signature sim; figures 'api-boundary' +
 * 'in-process-vs-network'. Sets up the vocabulary the whole guide leans on: interface, contract,
 * product, and the network boundary. Facts verified S3: term "API" (Cotton & Greatorex, 1968),
 * RPC formalized (Birrell & Nelson, ACM TOCS 1984), REST (Fielding, 2000), GraphQL & gRPC (2015).
 */
export const m1: Module = {
  id: 'm1-what-is-an-api',
  num: 1,
  section: 's0-foundations',
  order: 1,
  level: 'beginner',
  title: { en: 'What is an API?', uk: 'Що таке API?' },
  tagline: {
    en: 'The interface as a contract — and as a product. The vocabulary the rest of this guide is built on.',
    uk: 'Інтерфейс як контракт — і як продукт. Словник, на якому побудований решта посібника.',
  },
  readMins: 12,
  mentalModel: {
    en: 'An API is a promise across a boundary: a stable contract that lets one program use another without knowing how it works inside.',
    uk: 'API — це обіцянка через межу: стабільний контракт, що дозволяє одній програмі користуватися іншою, не знаючи, як вона влаштована всередині.',
  },
  topics: [
    // ── T1 · Interface vs implementation ─────────────────────────────────────
    {
      id: 'interface-vs-implementation',
      title: { en: 'Interface vs implementation', uk: 'Інтерфейс проти реалізації' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'API stands for **Application Programming Interface**. Strip away the acronym and the key word is **interface**: the surface one piece of software exposes so *other* software can use it. An interface separates the **what** — the operations you are allowed to call — from the **how** — the code, data, and machinery that actually carry them out. When you call `Math.max(a, b)`, you know *what* it promises (returns the larger number); you neither know nor care *how* it does it. That separation is the whole idea.',
            uk: 'API розшифровується як **Application Programming Interface**. Прибери абревіатуру — і ключове слово це **interface**: поверхня, яку одна частина ПЗ виставляє, щоб *інше* ПЗ могло нею користуватися. Інтерфейс відділяє **що** — операції, які тобі дозволено викликати — від **як** — коду, даних і механіки, що їх насправді виконують. Коли ти викликаєш `Math.max(a, b)`, ти знаєш, *що* воно обіцяє (повертає більше число); ти не знаєш і тобі байдуже, *як*. Саме це відділення і є вся суть.',
          },
        },
        {
          kind: 'figure',
          fig: 'api-boundary',
          caption: {
            en: 'The API is the stable facade. Consumers depend only on it; the implementation behind it is free to change.',
            uk: 'API — це стабільний фасад. Споживачі залежать лише від нього; реалізація за ним вільна змінюватись.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: 'This is **encapsulation**, and it is why APIs matter: as long as the interface holds, the team behind it can rewrite the database, swap the language, or move to a different server — and nobody who *uses* the API has to change a line. The interface is a firewall between "your problem" and "my problem". Break it and every consumer breaks with you; honor it and both sides evolve independently.',
            uk: 'Це **encapsulation**, і саме тому API важливі: доки інтерфейс тримається, команда за ним може переписати базу даних, змінити мову чи переїхати на інший сервер — і ніхто, хто *користується* API, не змінить жодного рядка. Інтерфейс — це firewall між «твоєю проблемою» і «моєю проблемою». Зламай його — і кожен споживач ламається з тобою; дотримайся — і обидві сторони еволюціонують незалежно.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'You already use APIs everywhere', uk: 'Ти вже всюди користуєшся API' },
          md: {
            en: 'An API is not only a web thing. The standard library you import, the operating-system calls your program makes, the buttons a UI toolkit gives you — all are APIs. This guide is about one *family* of them: **network APIs**, where the two sides live on different machines. But the core idea — a stable interface over a hidden implementation — is the same everywhere.',
            uk: 'API — це не лише веб. Стандартна бібліотека, яку ти імпортуєш, виклики операційної системи, які робить твоя програма, кнопки UI-тулкіта — усе це API. Цей посібник про одну їхню *сімʼю*: **мережеві API**, де дві сторони живуть на різних машинах. Але головна ідея — стабільний інтерфейс над прихованою реалізацією — однакова всюди.',
          },
        },
      ],
    },
    // ── T2 · The API as a contract ───────────────────────────────────────────
    {
      id: 'api-as-contract',
      title: { en: 'The API as a contract', uk: 'API як контракт' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'If the interface is the surface, the **contract** is the fine print: the precise, mutual promise both sides code against. A good contract pins down what you can ask, what you get back, what can go wrong, and what is guaranteed. Both sides depend on it: the **provider** promises to keep it, the **consumer** is allowed to rely on it. That is what makes independent teams — or independent companies — able to build against each other without a meeting.',
            uk: 'Якщо інтерфейс — це поверхня, то **контракт** — це дрібний шрифт: точна взаємна обіцянка, під яку кодують обидві сторони. Хороший контракт фіксує, що можна попросити, що повернеться, що може піти не так і що гарантовано. Обидві сторони залежать від нього: **provider** обіцяє його дотримуватись, **consumer** має право на нього покладатися. Саме це дозволяє незалежним командам — чи незалежним компаніям — будувати одне під одного без жодної зустрічі.',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'A contract pins down…', uk: 'Контракт фіксує…' },
            { en: 'Example', uk: 'Приклад' },
          ],
          rows: [
            [
              { en: 'The operation', uk: 'Операцію' },
              { en: '`GET /users/42` · `getUser(id)`', uk: '`GET /users/42` · `getUser(id)`' },
            ],
            [
              { en: 'Inputs & their shape', uk: 'Входи та їхню форму' },
              { en: 'id: integer, required', uk: 'id: integer, обовʼязковий' },
            ],
            [
              { en: 'Output & its shape', uk: 'Вихід та його форму' },
              { en: '`{ id, name, email }`', uk: '`{ id, name, email }`' },
            ],
            [
              { en: 'Errors', uk: 'Помилки' },
              { en: '404 if no such user; 401 if not authed', uk: '404 якщо юзера нема; 401 якщо не авторизований' },
            ],
            [
              { en: 'Guarantees / semantics', uk: 'Гарантії / семантику' },
              { en: 'safe to retry? cacheable? ordered?', uk: 'безпечно повторювати? кешується? впорядковано?' },
            ],
          ],
          caption: {
            en: 'The five things every API contract must make explicit — long before you pick REST, GraphQL, or gRPC.',
            uk: 'Пʼять речей, які кожен контракт API має зробити явними — задовго до вибору REST, GraphQL чи gRPC.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: 'Modern contracts are **machine-readable**, not just prose in a wiki: an OpenAPI document for REST, an SDL schema for GraphQL, a `.proto` file for gRPC. Once the contract is a file, tooling can generate client libraries, validate requests, mock the server, and diff two versions for breaking changes. The contract stops being a promise you *hope* both sides remember and becomes one a machine can enforce.',
            uk: 'Сучасні контракти **машиночитні**, а не просто текст у вікі: OpenAPI-документ для REST, SDL-schema для GraphQL, файл `.proto` для gRPC. Щойно контракт стає файлом, tooling може генерувати клієнтські бібліотеки, валідувати запити, мокати сервер і порівнювати дві версії на breaking changes. Контракт перестає бути обіцянкою, яку обидві сторони *сподіваються* памʼятати, і стає тією, яку може примусити машина.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'A published contract is a liability you must maintain', uk: 'Опублікований контракт — це зобовʼязання, яке треба підтримувати' },
          md: {
            en: 'The moment someone depends on your API, its shape is no longer yours to change freely. You can *add* to a contract safely, but *removing* or *renaming* breaks every consumer at once. This single fact drives most of the hard parts of API design — versioning, deprecation, backward compatibility — covered later in Section IV (`m18`).',
            uk: 'Щойно хтось залежить від твого API, його форма вже не твоя, щоб вільно її міняти. Ти можеш безпечно *додавати* до контракту, але *прибирати* чи *перейменовувати* — ламає кожного споживача одразу. Саме цей факт визначає більшість складних частин дизайну API — versioning, deprecation, backward compatibility — про це далі в Секції IV (`m18`).',
          },
        },
      ],
    },
    // ── T3 · The API as a product ────────────────────────────────────────────
    {
      id: 'api-as-product',
      title: { en: 'The API as a product', uk: 'API як продукт' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'An API has a **user** — a developer — and that reframes everything. If your API is confusing, inconsistent, or badly documented, developers route around it or leave, exactly like users abandoning a clumsy app. Companies like Stripe and Twilio built their business on this insight: the API *is* the product, and developer experience (DX) — clear docs, predictable naming, honest errors, stable versions — is the feature that sells it.',
            uk: 'В API є **користувач** — розробник — і це переосмислює все. Якщо твій API заплутаний, непослідовний чи погано задокументований, розробники обходять його або йдуть, точно як користувачі кидають незручний застосунок. Компанії на кшталт Stripe і Twilio побудували бізнес на цьому інсайті: API *і є* продукт, а developer experience (DX) — зрозумілі доки, передбачувані назви, чесні помилки, стабільні версії — це фіча, що його продає.',
          },
        },
        {
          kind: 'compare',
          a: { en: 'API as an afterthought', uk: 'API як щось другорядне' },
          b: { en: 'API as a product', uk: 'API як продукт' },
          rows: [
            [
              { en: 'Naming', uk: 'Іменування' },
              { en: 'Ad-hoc, mirrors the database', uk: 'Хаотичне, віддзеркалює базу' },
              { en: 'Consistent, models the domain', uk: 'Послідовне, моделює домен' },
            ],
            [
              { en: 'Errors', uk: 'Помилки' },
              { en: 'Vague 500s, "something failed"', uk: 'Розмиті 500, «щось впало»' },
              { en: 'Typed, actionable, documented', uk: 'Типізовані, дієві, задокументовані' },
            ],
            [
              { en: 'Docs', uk: 'Документація' },
              { en: 'Out of date or absent', uk: 'Застарілі або відсутні' },
              { en: 'Generated from the contract, live', uk: 'Згенеровані з контракту, актуальні' },
            ],
            [
              { en: 'Change', uk: 'Зміни' },
              { en: 'Breaks clients without warning', uk: 'Ламає клієнтів без попередження' },
              { en: 'Versioned, deprecation on a schedule', uk: 'Версіоновані, deprecation за графіком' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Your API’s first customer is your own next team', uk: 'Перший клієнт твого API — твоя ж наступна команда' },
          md: {
            en: 'Even a purely internal API is a product: the mobile team, the data team, and *future you* are its customers. Treating internal APIs with product discipline — a real contract, real docs, real versioning — is what keeps a growing system from collapsing into a tangle of brittle, undocumented calls.',
            uk: 'Навіть суто внутрішній API — це продукт: мобільна команда, дата-команда і *майбутній ти* — його клієнти. Ставитись до внутрішніх API з продуктовою дисципліною — справжній контракт, справжні доки, справжнє версіонування — це те, що не дає системі, яка росте, перетворитись на клубок крихких недокументованих викликів.',
          },
        },
      ],
    },
    // ── T4 · In-process vs across a network ──────────────────────────────────
    {
      id: 'in-process-vs-network',
      title: { en: 'In-process vs across a network', uk: 'У процесі проти через мережу' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Here is the fork this whole guide hangs on. A **local** (in-process) call and a **network** call can look identical in your code — `user = getUser(42)` — but they are worlds apart. A local call shares memory, takes nanoseconds, and either returns or throws. A network call leaves your machine, crosses cables and routers you do not control, and can be **slow, lost, duplicated, or half-completed** — while the other side has no idea you are waiting.',
            uk: 'Ось розвилка, на якій тримається весь цей посібник. **Локальний** (in-process) виклик і **мережевий** виклик можуть виглядати ідентично в коді — `user = getUser(42)` — але вони з різних світів. Локальний виклик ділить памʼять, займає наносекунди і або повертає, або кидає виняток. Мережевий виклик залишає твою машину, перетинає кабелі й роутери, які ти не контролюєш, і може бути **повільним, загубленим, здубльованим чи наполовину виконаним** — а інша сторона й гадки не має, що ти чекаєш.',
          },
        },
        {
          kind: 'figure',
          fig: 'in-process-vs-network',
          caption: {
            en: 'The same call, two worlds: shared memory and instant failure locally; latency, partial failure, and serialization across the wire.',
            uk: 'Той самий виклик, два світи: спільна памʼять і миттєва відмова локально; latency, часткова відмова і серіалізація через дріт.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: 'This is why a network API is a discipline of its own. Every network call forces decisions a local call never does: how long to **wait** before giving up (timeouts); what to do when you get no answer (**retries** — and whether repeating is even safe); how to turn objects into bytes and back (**serialization**); who is allowed to call at all (**auth**); and how to change the contract without breaking callers on the other side of the wire (**versioning**). The classic warning is the *"fallacies of distributed computing"*: assuming the network is reliable, fast, and free. It is none of those.',
            uk: 'Саме тому мережевий API — це окрема дисципліна. Кожен мережевий виклик змушує до рішень, яких локальний ніколи не вимагає: скільки **чекати** до відмови (timeouts); що робити, коли відповіді нема (**retries** — і чи взагалі безпечно повторювати); як перетворити обʼєкти на байти і назад (**serialization**); кому взагалі дозволено викликати (**auth**); і як змінити контракт, не зламавши клієнтів по той бік дроту (**versioning**). Класичне попередження — *«fallacies of distributed computing»*: припущення, що мережа надійна, швидка і безкоштовна. Вона не така.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'A network call is not a function call with extra steps', uk: 'Мережевий виклик — не виклик функції з додатковими кроками' },
          md: {
            en: 'The most expensive beginner mistake is pretending the gap is not there: making one network call per item in a loop (hundreds of round-trips), ignoring timeouts so a slow dependency freezes your whole app, or assuming a request that "failed" did not actually run. Design *for* the gap — batch, set timeouts, make retries safe — and most distributed-systems pain disappears.',
            uk: 'Найдорожча помилка початківця — вдавати, що розриву нема: робити один мережевий виклик на елемент у циклі (сотні round-trip-ів), ігнорувати timeouts, через що повільна залежність морозить увесь застосунок, або припускати, що запит, який «упав», насправді не виконався. Проєктуй *під* розрив — батч, timeouts, безпечні retries — і більшість болю розподілених систем зникає.',
          },
        },
      ],
    },
    // ── T5 · A tiny history ──────────────────────────────────────────────────
    {
      id: 'a-tiny-history',
      title: { en: 'A tiny history', uk: 'Коротка історія' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'You do not need the history to use an API — but it explains *why there are so many styles*. Each one was invented to fix a specific limit of the one before, which is exactly why this guide teaches every later style as a **delta from REST**. The very short version: the word came first, then the network, then a series of answers to "how should two programs talk?"',
            uk: 'Історія не потрібна, щоб користуватися API — але вона пояснює, *чому стилів так багато*. Кожен придумали, щоб виправити конкретне обмеження попереднього, і саме тому цей посібник викладає кожен пізніший стиль як **дельту від REST**. Дуже коротко: спершу зʼявилося слово, потім мережа, а потім — низка відповідей на питання «як двом програмам говорити?»',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'When', uk: 'Коли' },
            { en: 'Milestone', uk: 'Віха' },
            { en: 'What it added', uk: 'Що додало' },
          ],
          rows: [
            [
              { en: '1968', uk: '1968' },
              { en: 'The term “application program interface” (Cotton & Greatorex)', uk: 'Термін «application program interface» (Cotton & Greatorex)' },
              { en: 'The idea of a device-independent interface', uk: 'Ідея інтерфейсу, незалежного від пристрою' },
            ],
            [
              { en: '1984', uk: '1984' },
              { en: 'Remote Procedure Call formalized (Birrell & Nelson)', uk: 'Remote Procedure Call формалізовано (Birrell & Nelson)' },
              { en: 'Call a function on another machine', uk: 'Виклик функції на іншій машині' },
            ],
            [
              { en: '1990s', uk: '1990-ті' },
              { en: 'CORBA / DCOM; then XML-RPC → SOAP', uk: 'CORBA / DCOM; потім XML-RPC → SOAP' },
              { en: 'Cross-language objects; XML contracts', uk: 'Крос-мовні обʼєкти; XML-контракти' },
            ],
            [
              { en: '2000', uk: '2000' },
              { en: 'REST defined (Fielding’s dissertation)', uk: 'REST визначено (дисертація Fielding)' },
              { en: 'Use the web itself as the model', uk: 'Використати сам веб як модель' },
            ],
            [
              { en: '2000s', uk: '2000-ті' },
              { en: 'REST + JSON overtake SOAP for public APIs', uk: 'REST + JSON обганяють SOAP для публічних API' },
              { en: 'Simplicity, caching, ubiquity', uk: 'Простота, кешування, всюдисущість' },
            ],
            [
              { en: '2015', uk: '2015' },
              { en: 'GraphQL (Facebook) & gRPC (Google) open-sourced', uk: 'GraphQL (Facebook) і gRPC (Google) відкрито' },
              { en: 'Client-shaped queries; typed binary streaming', uk: 'Client-shaped запити; типізований binary streaming' },
            ],
            [
              { en: '2010s→', uk: '2010-ті→' },
              { en: 'WebSockets, SSE, webhooks, tRPC, event streaming', uk: 'WebSockets, SSE, webhooks, tRPC, event streaming' },
              { en: 'Real-time, push, and end-to-end types', uk: 'Real-time, push і наскрізні типи' },
            ],
          ],
          caption: {
            en: 'Not a forced reading order — a map of why each style exists. Every row answered a limit of the row above.',
            uk: 'Не обовʼязковий порядок читання — карта того, чому кожен стиль існує. Кожен рядок відповів на обмеження рядка вище.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: 'Notice the throughline. RPC made the network feel like a function call — but hid its dangers. REST embraced the web’s own rules and won the public internet — but struggles with chatty, client-shaped, and real-time needs. GraphQL, gRPC, WebSockets, and webhooks each took one of those weak spots. There is no "final" style, only a growing toolkit — which is why the last thing this guide teaches (`m24`) is not another style but how to **choose**.',
            uk: 'Поміть наскрізну лінію. RPC зробив мережу схожою на виклик функції — але сховав її небезпеки. REST прийняв власні правила вебу і виграв публічний інтернет — але має труднощі з балакучими, client-shaped і real-time потребами. GraphQL, gRPC, WebSockets і webhooks кожен узяв одне з цих слабких місць. «Фінального» стилю нема, є лише набір, що росте — і тому останнє, чого вчить цей посібник (`m24`), — не ще один стиль, а як **обирати**.',
          },
        },
      ],
    },
  ],
  keyPoints: [
    { en: 'An API is an interface: a stable “what” that hides a changeable “how” (encapsulation).', uk: 'API — це інтерфейс: стабільне «що», що ховає змінюване «як» (encapsulation).' },
    { en: 'It is a contract — inputs, outputs, errors, guarantees — that both sides code against.', uk: 'Це контракт — входи, виходи, помилки, гарантії — під який кодують обидві сторони.' },
    { en: 'It is a product with a user (a developer); DX — docs, consistency, stability — is the feature.', uk: 'Це продукт із користувачем (розробником); DX — доки, послідовність, стабільність — це фіча.' },
    { en: 'A network call is not a local call: latency, partial failure, serialization, auth, versioning.', uk: 'Мережевий виклик — не локальний: latency, часткова відмова, серіалізація, auth, версіонування.' },
    { en: 'The many styles exist because each fixed a limit of the last — so we teach them as deltas.', uk: 'Багато стилів існують, бо кожен виправив обмеження попереднього — тож ми вчимо їх як дельти.' },
  ],
  pitfalls: [
    {
      title: { en: 'Confusing the API with the implementation', uk: 'Плутати API з реалізацією' },
      body: {
        en: 'Leaking database column names or internal service shapes into the contract couples every consumer to your internals — and freezes the internals you meant to keep free to change.',
        uk: 'Просочування назв колонок бази чи форм внутрішніх сервісів у контракт привʼязує кожного споживача до твоїх нутрощів — і заморожує ті нутрощі, які ти хотів лишити вільними до змін.',
      },
    },
    {
      title: { en: 'Treating a network call like a local one', uk: 'Ставитись до мережевого виклику як до локального' },
      body: {
        en: 'No timeouts, no retries, one call per loop item. The gap is real; code that ignores it works on your laptop and falls over in production.',
        uk: 'Без timeouts, без retries, один виклик на елемент циклу. Розрив реальний; код, що його ігнорує, працює на ноутбуці й падає в проді.',
      },
    },
    {
      title: { en: 'Shipping without a written contract', uk: 'Реліз без written контракту' },
      body: {
        en: '“The code is the docs” means every consumer reverse-engineers your intent and every change is a guess. A machine-readable contract (OpenAPI/SDL/proto) pays for itself immediately.',
        uk: '«Код — це документація» означає, що кожен споживач реверс-інженерить твій намір, а кожна зміна — здогад. Машиночитний контракт (OpenAPI/SDL/proto) окупається одразу.',
      },
    },
  ],
  interview: [
    {
      q: { en: 'Explain the difference between an API and its implementation, and why it matters.', uk: 'Поясни різницю між API та його реалізацією і чому це важливо.' },
      a: {
        en: 'The API is the interface — the operations, inputs, outputs, and guarantees a caller depends on. The implementation is the hidden code that fulfills them. Separating them lets the provider change the implementation freely (rewrite, re-scale, re-language) without breaking any consumer, as long as the contract holds. That decoupling is the entire reason APIs enable independent teams and systems.',
        uk: 'API — це інтерфейс: операції, входи, виходи й гарантії, від яких залежить викликач. Реалізація — прихований код, що їх виконує. Їхнє відділення дозволяє provider-у вільно міняти реалізацію (переписати, перемасштабувати, змінити мову), не ламаючи жодного споживача, доки тримається контракт. Саме це розчеплення — уся причина, чому API дають незалежні команди й системи.',
      },
      level: 'beginner',
    },
  ],
  seeAlso: ['m2-decision-axes', 'm5-rest', 'm3-http-transport', 'm18-versioning'],
  sources: [
    { title: 'Wikipedia — API (history: “application program interface”, Cotton & Greatorex, 1968)', url: 'https://en.wikipedia.org/wiki/API' },
    { title: 'Birrell & Nelson — Implementing Remote Procedure Calls (ACM TOCS, 1984)', url: 'https://dl.acm.org/doi/10.1145/2080.357392' },
    { title: 'Fielding — Architectural Styles and the Design of Network-based Software Architectures (REST, 2000)', url: 'https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm' },
    { title: 'Wikipedia — Fallacies of distributed computing', url: 'https://en.wikipedia.org/wiki/Fallacies_of_distributed_computing' },
    { title: 'MDN — Introduction to web APIs', url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Client-side_web_APIs/Introduction' },
  ],
};
