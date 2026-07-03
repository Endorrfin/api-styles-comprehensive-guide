import type { Module } from '../types';

/*
 * m11-trpc — TypeScript-native RPC (s2, Contract-first & typed). Right-sized: no hero sim;
 * figure 'trpc-inference' (the type flowing server→client with no codegen). Six curriculum topics:
 * ts-native-rpc → no-codegen-inference (figure) → routers-procedures → end-to-end-types →
 * boundaries-monorepo → vs-grpc-graphql (compare + verdict).
 * Facts web-verified S10b (2026-07): tRPC v11 is the current major (v11.13.x), released mid-2025,
 * largely backward-compatible with v10; TypeScript-only, NO codegen — inference walks the router type;
 * client imports the TYPE only (`import type { AppRouter } from ...`, `export type AppRouter =
 * typeof appRouter`), never the runtime router; transport is plain HTTP + JSON via httpLink/
 * httpBatchLink (same-tick batching); procedures are queries/mutations/subscriptions (v11 subscriptions
 * can ride SSE); Node 18+ required; runtime validators (zod/valibot) supply `.input()` validation and
 * tRPC infers the static type from them (types are erased at runtime).
 */
export const m11: Module = {
  id: 'm11-trpc',
  num: 11,
  section: 's2-contract-first',
  order: 3,
  level: 'senior',
  title: { en: 'tRPC', uk: 'tRPC' },
  tagline: {
    en: 'End-to-end types with no schema, no codegen.',
    uk: 'Наскрізні типи без schema, без codegen.',
  },
  readMins: 12,
  mentalModel: {
    en: 'The TypeScript type **is** the contract. The server exports its router’s *type* — `export type AppRouter = typeof appRouter` — and the client `import type`s it. No IDL, no generated files, no wire format of its own: the compiler keeps both ends in sync, so a refactor on the server lights up red on the client before you run anything. gRPC and GraphQL translate the contract into a neutral language (proto, SDL) *because* the two ends might differ; tRPC bets the opposite — if both ends are TypeScript, delete the translation.',
    uk: 'Тип TypeScript **І Є** контрактом. Сервер експортує *тип* свого router-а — `export type AppRouter = typeof appRouter` — а клієнт робить `import type`. Жодного IDL, жодних згенерованих файлів, жодного власного wire-формату: компілятор тримає обидва кінці в синхроні, тож рефактор на сервері засвічується червоним на клієнті ще до запуску. gRPC і GraphQL перекладають контракт у нейтральну мову (proto, SDL), *бо* кінці можуть різнитися; tRPC ставить на протилежне — якщо обидва кінці TypeScript, викинь переклад.',
  },
  topics: [
    // ── T1 · TypeScript-native RPC ────────────────────────────────────────────
    {
      id: 'ts-native-rpc',
      title: { en: 'TypeScript-native RPC', uk: 'TypeScript-native RPC' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: '**tRPC** (TypeScript Remote Procedure Call) makes calling a server procedure feel like calling a local async function: `await trpc.user.byId.query({ id: "42" })` — with full autocomplete and type-checking on the arguments and the result. Unlike gRPC (m10) and GraphQL (m9), which start from a language-neutral **IDL** and *generate* a client, tRPC invents **no schema language and no wire format of its own** — under the hood it is plain HTTP with JSON bodies (m4). The move that makes this possible: it assumes TypeScript on *both* ends of *one* codebase, so it can skip the contract-description step entirely. The TypeScript types already **are** the description. That single decision — no IDL — is what makes tRPC the lightest possible typed RPC, and also what fences it into the TypeScript world (T5).',
            uk: '**tRPC** (TypeScript Remote Procedure Call) робить виклик серверної процедури схожим на виклик локальної async-функції: `await trpc.user.byId.query({ id: "42" })` — з повним автокомплітом і перевіркою типів на аргументах і результаті. На відміну від gRPC (m10) і GraphQL (m9), які стартують із мовно-нейтрального **IDL** і *генерують* клієнт, tRPC не вигадує **ні мови схеми, ні власного wire-формату** — під капотом це звичайний HTTP із JSON-тілами (m4). Хід, який це вможливлює: він припускає TypeScript на *обох* кінцях *одного* codebase, тож може повністю пропустити крок опису контракту. Типи TypeScript уже **і є** описом. Саме це рішення — без IDL — робить tRPC найлегшим можливим типізованим RPC, і воно ж загороджує його у світі TypeScript (T5).',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Same language, no translation layer', uk: 'Одна мова — без шару перекладу' },
          md: {
            en: 'gRPC and GraphQL must serialize the contract into a neutral language (`.proto`, SDL) *precisely because* client and server might be written in different languages — that neutral artifact is the whole point. tRPC’s bet is the inverse: when both ends are TypeScript, that translation is pure overhead, so delete it. Everything else in this module — the inference, the monorepo constraint, the verdict — falls out of that one trade.',
            uk: 'gRPC і GraphQL мусять серіалізувати контракт у нейтральну мову (`.proto`, SDL) *саме тому, що* клієнт і сервер можуть бути різними мовами — цей нейтральний артефакт і є суттю. Ставка tRPC зворотна: коли обидва кінці TypeScript, той переклад — чистий overhead, тож викинь його. Усе інше в цьому модулі — inference, обмеження monorepo, вердикт — випливає з цього одного обміну.',
          },
        },
      ],
    },
    // ── T2 · No codegen: inference IS the contract (figure) ────────────────────
    {
      id: 'no-codegen-inference',
      title: { en: 'No codegen: inference is the contract', uk: 'Без codegen: inference — це контракт' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'This is the heart of tRPC. On the server you build a router and export **only its type**: `export type AppRouter = typeof appRouter`. On the client you `import type { AppRouter }` and hand it to the client factory. Because it is `import type`, **nothing runtime crosses the boundary** — the import is erased at compile time; only TypeScript’s inference engine walks the router’s shape to give every procedure its exact input and output types. No build step, no generated files, no `.proto`/`.graphql` to keep in sync: change a procedure’s return type and the client’s call site re-types on the next `tsc` pass — in your editor, instantly. This is “no-codegen” in the literal sense: the compiler does at author-time what a codegen step does elsewhere.',
            uk: 'Це серце tRPC. На сервері ти будуєш router і експортуєш **лише його тип**: `export type AppRouter = typeof appRouter`. На клієнті робиш `import type { AppRouter }` і передаєш у фабрику клієнта. Оскільки це `import type`, **ніщо runtime не перетинає межу** — імпорт стирається на компіляції; лише inference-рушій TypeScript обходить форму router-а, даючи кожній процедурі точні типи входу й виходу. Жодного build-кроку, жодних згенерованих файлів, жодного `.proto`/`.graphql` для синхронізації: зміни тип повернення процедури — і місце виклику на клієнті переотипується на наступному проході `tsc`, у редакторі, миттєво. Це «no-codegen» у буквальному сенсі: компілятор робить під час письма те, що деінде робить крок codegen.',
          },
        },
        {
          kind: 'figure',
          fig: 'trpc-inference',
          caption: {
            en: 'The server exports a type, not code; the client imports that type, not code. TypeScript’s inference — not a codegen step — carries the contract across the boundary, so both ends move together on every edit.',
            uk: 'Сервер експортує тип, а не код; клієнт імпортує той тип, а не код. Inference TypeScript — а не крок codegen — переносить контракт через межу, тож обидва кінці рухаються разом на кожній правці.',
          },
        },
        {
          kind: 'code',
          lang: 'ts',
          code: `// server — procedures + the exported TYPE (never the runtime router)
export const appRouter = router({
  user: router({
    byId: publicProcedure
      .input(z.object({ id: z.string() }))          // runtime validation…
      .query(({ input }) => db.user.find(input.id)),// …return type inferred
  }),
});
export type AppRouter = typeof appRouter;           // the contract = a type

// client — import the TYPE only: erased at runtime, drives inference
import type { AppRouter } from '../server';
const trpc = createTRPCClient<AppRouter>({ links: [httpBatchLink({ url })] });
const u = await trpc.user.byId.query({ id: '42' }); // u: User — typed + autocompleted`,
          note: {
            en: 'One source of truth: the zod schema validates at runtime AND is the type tRPC infers from. Note `import type` — importing the value `appRouter` would drag server code into the client bundle (a pitfall below).',
            uk: 'Одне джерело правди: zod-схема валідує в runtime І є типом, з якого tRPC робить inference. Зверни увагу на `import type` — імпорт значення `appRouter` затягнув би серверний код у клієнтський бандл (пастка нижче).',
          },
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'Types vanish at runtime — validate anyway', uk: 'Типи зникають у runtime — валідуй попри це' },
          md: {
            en: 'TypeScript types are **erased** when compiled to JavaScript, so the inferred input type checks *nothing* at runtime — a hostile client can POST any JSON to your procedure. Every procedure that takes input must run a **runtime validator** (zod, valibot, arktype) via `.input(schema)`; tRPC then infers the static type *from that validator*, so one declaration both validates and types. Skipping `.input()` and trusting the inferred type is the classic tRPC security hole — the types are developer experience, not a security boundary (m22).',
            uk: 'Типи TypeScript **стираються** при компіляції в JavaScript, тож виведений тип входу не перевіряє *нічого* в runtime — ворожий клієнт може POST-нути будь-який JSON у твою процедуру. Кожна процедура, що приймає вхід, мусить запускати **runtime-валідатор** (zod, valibot, arktype) через `.input(schema)`; далі tRPC виводить статичний тип *із цього валідатора*, тож одна декларація і валідує, і типізує. Пропустити `.input()` і довіритися виведеному типу — класична діра безпеки tRPC: типи — це developer experience, а не межа безпеки (m22).',
          },
        },
      ],
    },
    // ── T3 · Routers & procedures ─────────────────────────────────────────────
    {
      id: 'routers-procedures',
      title: { en: 'Routers, procedures & links', uk: 'Routers, procedures і links' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The building blocks. A **procedure** is one endpoint and one of three kinds: a **query** (a read — GET-cacheable, the safe/idempotent role of m5), a **mutation** (a write), or a **subscription** (a stream — in v11 subscriptions ride **Server-Sent Events**, m13, or WebSockets, m12). You compose procedures into **routers** and nest routers into the one `AppRouter`, giving namespaced paths like `user.byId`. Reusable **base procedures** encode cross-cutting concerns once: a `publicProcedure` versus a `protectedProcedure` whose auth **middleware** runs first and narrows `ctx` to a logged-in user (m17). On the client, **`httpBatchLink`** collects the calls fired within one tick and ships them as a *single* HTTP request — GraphQL-style batching (m9), not REST’s one-call-per-endpoint — trimming round trips over one plain HTTP POST.',
            uk: 'Будівельні блоки. **Procedure** — це один endpoint і один із трьох видів: **query** (читання — GET-кешоване, safe/idempotent роль з m5), **mutation** (запис) або **subscription** (потік — у v11 subscriptions їдуть на **Server-Sent Events**, m13, або WebSockets, m12). Ти компонуєш процедури в **routers** і вкладаєш routers в один `AppRouter`, отримуючи неймспейснуті шляхи як `user.byId`. Перевикористовувані **base procedures** кодують наскрізні аспекти раз: `publicProcedure` проти `protectedProcedure`, чий auth-**middleware** відпрацьовує першим і звужує `ctx` до залогіненого користувача (m17). На клієнті **`httpBatchLink`** збирає виклики, випущені в одному tick, і шле їх *одним* HTTP-запитом — батчинг у стилі GraphQL (m9), а не REST-івський один-виклик-на-endpoint — зрізаючи round trips одним звичайним HTTP POST.',
          },
        },
      ],
    },
    // ── T4 · End-to-end types ─────────────────────────────────────────────────
    {
      id: 'end-to-end-types',
      title: { en: 'End-to-end types: one refactor loop', uk: 'Наскрізні типи: один цикл рефактора' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The payoff is a single, closed refactor loop. Rename a field or change a return shape on the server, and every client call site that used it turns **red in the same editor, before you run anything** — the same guarantee gRPC and GraphQL give, but *without the generate step in between*. Contrast the loops: with gRPC/GraphQL you edit the IDL → run codegen → the generated types shift → your call sites update; with tRPC you edit the resolver → the call sites update. Fewer moving parts means the contract **cannot silently drift**, because there is no second artifact to forget to regenerate. The cost is that this safety is only as wide as your TypeScript: a Python or Swift client sees none of it.',
            uk: 'Виграш — єдиний, замкнений цикл рефактора. Перейменуй поле чи зміни форму повернення на сервері — і кожне місце виклику на клієнті, що ним користалося, стає **червоним у тому ж редакторі, ще до запуску** — та сама гарантія, що дають gRPC і GraphQL, але *без кроку генерації посередині*. Порівняй цикли: з gRPC/GraphQL ти правиш IDL → запускаєш codegen → згенеровані типи зсуваються → місця виклику оновлюються; з tRPC ти правиш resolver → місця виклику оновлюються. Менше рухомих частин означає, що контракт **не може тихо дрейфувати**, бо немає другого артефакту, який можна забути перегенерувати. Ціна — ця безпека така широка, як твій TypeScript: Python- чи Swift-клієнт її не бачить.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'The safety is compile-time, not over-the-wire', uk: 'Безпека — на компіляції, а не на дроті' },
          md: {
            en: 'Nothing about a tRPC response is self-describing on the network — it is just JSON, indistinguishable from a hand-rolled endpoint. The contract lives *entirely* in your shared TypeScript. That is exactly why tRPC cannot hand a schema to a third party the way an OpenAPI document or a `.proto` can — there is no artifact to hand over.',
            uk: 'Ніщо у відповіді tRPC не є самоописовим у мережі — це просто JSON, не відрізнити від саморобного endpoint-а. Контракт живе *повністю* у твоєму спільному TypeScript. Саме тому tRPC не може вручити схему третій стороні так, як OpenAPI-документ чи `.proto`, — немає артефакту, який передати.',
          },
        },
      ],
    },
    // ── T5 · Boundaries & the monorepo constraint ─────────────────────────────
    {
      id: 'boundaries-monorepo',
      title: { en: 'Boundaries: why it needs a monorepo', uk: 'Межі: чому потрібен monorepo' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The load-bearing constraint follows directly from “the type is the contract”: the client can only `import type { AppRouter }` if it can **see that type at build time**. In practice that means client and server live in the **same repository** (a monorepo — the T3-stack shape) or the server **publishes its types as a versioned package** the client depends on. Cross that boundary — a public API, a mobile app in Swift/Kotlin, a partner integration, a service written in Go — and the inference has nothing to import; tRPC simply stops applying. This is not a limitation to engineer around, it *is* tRPC’s niche: the internal boundary between a TypeScript backend and a TypeScript frontend you ship together. A common, healthy pattern is tRPC internally behind a REST or GraphQL public edge.',
            uk: 'Несуче обмеження випливає прямо з «тип — це контракт»: клієнт може зробити `import type { AppRouter }` лише якщо **бачить цей тип на build-time**. На практиці це означає, що клієнт і сервер живуть у **тому самому репозиторії** (monorepo — форма T3-стеку) або сервер **публікує свої типи як версійований пакет**, від якого залежить клієнт. Перетни цю межу — публічний API, мобільний застосунок на Swift/Kotlin, партнерська інтеграція, сервіс на Go — і inference-у нічого імпортувати; tRPC просто перестає застосовуватися. Це не обмеження, яке треба обійти, це *і є* ніша tRPC: внутрішня межа між TypeScript-бекендом і TypeScript-фронтендом, які ти шипиш разом. Поширений здоровий патерн — tRPC всередині за публічним краєм на REST чи GraphQL.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'The litmus test: would you publish a schema?', uk: 'Лакмус: ти б публікував схему?' },
          md: {
            en: 'One question decides it: does any consumer you don’t control — or don’t write in TypeScript — need this API? If **yes**, you need a published, language-neutral contract (OpenAPI/REST, SDL/GraphQL, proto/gRPC). If **every** consumer is your own TypeScript, tRPC deletes the contract-artifact busywork and pays you back in end-to-end types at near-zero ceremony.',
            uk: 'Одне питання вирішує все: чи потрібен цей API якомусь споживачу, якого ти не контролюєш — або не пишеш на TypeScript? Якщо **так**, тобі потрібен опублікований, мовно-нейтральний контракт (OpenAPI/REST, SDL/GraphQL, proto/gRPC). Якщо **кожен** споживач — твій власний TypeScript, tRPC викидає рутину з артефактом контракту й повертає наскрізні типи майже без церемоній.',
          },
        },
      ],
    },
    // ── T6 · vs gRPC & GraphQL (compare + verdict) ────────────────────────────
    {
      id: 'vs-grpc-graphql',
      title: { en: 'tRPC vs gRPC vs GraphQL — and the verdict', uk: 'tRPC проти gRPC проти GraphQL — і вердикт' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Put the three typed styles side by side. All three deliver end-to-end type safety; they differ in **what they demand for it**. **gRPC** (m10): a `.proto` IDL, codegen, a compact binary wire format over HTTP/2 — polyglot and fast, heaviest toolchain. **GraphQL** (m9): an SDL schema, a runtime of resolvers, one flexible endpoint where each client shapes its own query — great for many heterogeneous clients, brings its own server. **tRPC**: no IDL, no codegen, plain HTTP+JSON — the lightest, but TypeScript-only and internal. The axis that decides is **reach**: the more heterogeneous and less-trusted your consumers, the more you need an explicit, language-neutral contract — and the less tRPC fits.',
            uk: 'Постав три типізовані стилі поруч. Усі три дають наскрізну типобезпеку; різняться вони тим, **що вимагають за неї**. **gRPC** (m10): `.proto` IDL, codegen, компактний бінарний wire-формат над HTTP/2 — polyglot і швидкий, найважчий тулчейн. **GraphQL** (m9): SDL-схема, runtime із resolver-ів, один гнучкий endpoint, де кожен клієнт формує власний запит — чудово для багатьох різнорідних клієнтів, приносить власний сервер. **tRPC**: без IDL, без codegen, звичайний HTTP+JSON — найлегший, але тільки TypeScript і внутрішній. Вісь, що вирішує, — **reach (охоплення)**: що різнорідніші й менш довірені твої споживачі, то більше тобі потрібен явний, мовно-нейтральний контракт — і то менше пасує tRPC.',
          },
        },
        {
          kind: 'compare',
          a: { en: 'tRPC', uk: 'tRPC' },
          b: { en: 'gRPC / GraphQL', uk: 'gRPC / GraphQL' },
          rows: [
            [
              { en: 'Contract', uk: 'Контракт' },
              { en: 'The TypeScript type — no IDL', uk: 'Тип TypeScript — без IDL' },
              { en: 'Explicit IDL: .proto / SDL', uk: 'Явний IDL: .proto / SDL' },
            ],
            [
              { en: 'Codegen', uk: 'Codegen' },
              { en: 'None — TS inference', uk: 'Немає — inference TS' },
              { en: 'Required build step', uk: 'Обовʼязковий build-крок' },
            ],
            [
              { en: 'Consumers', uk: 'Споживачі' },
              { en: 'Your own TypeScript only', uk: 'Лише твій власний TypeScript' },
              { en: 'Any language / third parties', uk: 'Будь-яка мова / треті сторони' },
            ],
            [
              { en: 'Transport', uk: 'Транспорт' },
              { en: 'Plain HTTP + JSON', uk: 'Звичайний HTTP + JSON' },
              { en: 'HTTP/2 binary (gRPC) · HTTP+JSON (GraphQL)', uk: 'HTTP/2 binary (gRPC) · HTTP+JSON (GraphQL)' },
            ],
            [
              { en: 'Best fit', uk: 'Найкращий fit' },
              { en: 'Internal TS monorepo boundary', uk: 'Внутрішня межа TS-monorepo' },
              { en: 'Public / polyglot / cross-org', uk: 'Публічний / polyglot / крос-орг' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'The verdict', uk: 'Вердикт' },
          md: {
            en: 'Use tRPC when **both ends are TypeScript and shipped together** — full-stack apps, a BFF talking to its own frontend, an internal monorepo — where it buys end-to-end types at near-zero ceremony: no schema, no codegen, no new runtime. Avoid it the moment a consumer sits outside your TypeScript: public APIs, polyglot services, Swift/Kotlin mobile, partner integrations — reach for REST (m5) for reach, GraphQL (m9) for client-shaped queries, or gRPC (m10) for polyglot performance (it is fine to run tRPC internally behind such a public edge). And whichever you choose, **validate inputs at runtime** — tRPC’s inferred types check nothing once compiled.',
            uk: 'Бери tRPC, коли **обидва кінці — TypeScript і шипляться разом**: full-stack застосунки, BFF, що говорить із власним фронтендом, внутрішній monorepo — де він купує наскрізні типи майже без церемоній: без schema, без codegen, без нового runtime. Уникай його щойно споживач опиняється поза твоїм TypeScript: публічні API, polyglot-сервіси, мобілки на Swift/Kotlin, партнерські інтеграції — бери REST (m5) заради reach, GraphQL (m9) заради клієнт-формованих запитів чи gRPC (m10) заради polyglot-продуктивності (запускати tRPC всередині за таким публічним краєм — нормально). І що б ти не обрав, **валідуй вхід у runtime** — виведені типи tRPC не перевіряють нічого після компіляції.',
          },
        },
      ],
    },
  ],
  keyPoints: [
    { en: 'tRPC is TypeScript-native RPC: call server procedures like local async functions over plain HTTP+JSON — no IDL and no wire format of its own.', uk: 'tRPC — це TypeScript-native RPC: викликай серверні процедури як локальні async-функції через звичайний HTTP+JSON — без IDL і без власного wire-формату.' },
    { en: 'The differentiator is no-codegen inference: the server exports `type AppRouter = typeof appRouter`; the client `import type`s it; TypeScript infers every input/output — no generated files to keep in sync.', uk: 'Відмінність — no-codegen inference: сервер експортує `type AppRouter = typeof appRouter`; клієнт робить `import type`; TypeScript виводить кожен вхід/вихід — без згенерованих файлів для синхронізації.' },
    { en: '`import type` is erased at runtime, so the inferred types validate nothing on the wire — every procedure must run a runtime validator (zod) via `.input()`, from which tRPC also infers the static type.', uk: '`import type` стирається в runtime, тож виведені типи не валідують нічого на дроті — кожна процедура мусить запускати runtime-валідатор (zod) через `.input()`, з якого tRPC також виводить статичний тип.' },
    { en: 'Procedures are queries / mutations / subscriptions (v11 subscriptions over SSE), composed into nested routers; httpBatchLink batches same-tick calls into one HTTP request.', uk: 'Procedures — це queries / mutations / subscriptions (у v11 subscriptions через SSE), скомпоновані у вкладені routers; httpBatchLink батчить виклики одного tick в один HTTP-запит.' },
    { en: 'The load-bearing limit: the type import is compile-time, so client and server must share TypeScript — same monorepo or a published types package. Not for polyglot or public/cross-org APIs.', uk: 'Несуче обмеження: імпорт типу — на compile-time, тож клієнт і сервер мусять ділити TypeScript — той самий monorepo або опублікований пакет типів. Не для polyglot чи публічних/крос-орг API.' },
    { en: 'Choose by reach: tRPC for internal TS-monorepo boundaries; gRPC/GraphQL/REST when consumers are heterogeneous, untrusted, or non-TypeScript.', uk: 'Обирай за reach: tRPC для внутрішніх меж TS-monorepo; gRPC/GraphQL/REST — коли споживачі різнорідні, недовірені чи не-TypeScript.' },
  ],
  pitfalls: [
    {
      title: { en: 'Trusting inferred types as validation', uk: 'Довіряти виведеним типам як валідації' },
      body: {
        en: 'TypeScript types are compile-time only; without `.input(zodSchema)` a client can POST any payload and your handler runs on unvalidated data. Always validate at the boundary and let tRPC infer the static type from the validator — one schema that both checks and types.',
        uk: 'Типи TypeScript існують лише на compile-time; без `.input(zodSchema)` клієнт може POST-нути будь-який payload, і твій handler виконається на невалідованих даних. Завжди валідуй на межі й дай tRPC вивести статичний тип із валідатора — одна схема, що і перевіряє, і типізує.',
      },
    },
    {
      title: { en: 'Reaching for tRPC at a public or polyglot boundary', uk: 'Тягнутися до tRPC на публічній чи polyglot межі' },
      body: {
        en: 'There is no schema to hand out and no non-TypeScript client can consume it, so you end up bolting OpenAPI generators onto tRPC to recover a contract. If any consumer is not your own TypeScript, start with REST, GraphQL, or gRPC instead.',
        uk: 'Немає схеми, яку роздати, і жоден не-TypeScript клієнт її не спожиє, тож ти врешті прикручуєш OpenAPI-генератори до tRPC, щоб повернути контракт. Якщо якийсь споживач — не твій власний TypeScript, починай натомість із REST, GraphQL чи gRPC.',
      },
    },
    {
      title: { en: 'Leaking the runtime router into the client', uk: 'Витік runtime-router-а в клієнт' },
      body: {
        en: 'Importing the value `appRouter` instead of `import type { AppRouter }` drags server code — database clients, secrets, business logic — into the client bundle. Export and import the TYPE only; the runtime router must never be reachable from client code.',
        uk: 'Імпорт значення `appRouter` замість `import type { AppRouter }` затягує серверний код — клієнти БД, секрети, бізнес-логіку — у клієнтський бандл. Експортуй та імпортуй лише ТИП; runtime-router ніколи не має бути досяжним із клієнтського коду.',
      },
    },
  ],
  interview: [
    {
      q: {
        en: 'A team wants end-to-end type safety between a Next.js frontend and its Node backend in one monorepo. Why might tRPC beat gRPC or GraphQL here — and what is the one thing they must not skip?',
        uk: 'Команда хоче наскрізну типобезпеку між Next.js-фронтендом і його Node-бекендом в одному monorepo. Чому тут tRPC може виграти в gRPC чи GraphQL — і що вони точно не мають пропустити?',
      },
      a: {
        en: 'In a single TypeScript monorepo the contract-description step that gRPC and GraphQL require is pure overhead: both ends already share a type system, so tRPC lets the compiler enforce the contract directly — `export type AppRouter = typeof appRouter`, `import type` on the client, and inference does what codegen does elsewhere, with no `.proto`/SDL to keep in sync and no generate step to forget. The team gets instant editor-level red squiggles across the boundary on any refactor, httpBatchLink batching, all over plain HTTP+JSON with no new runtime. The thing they must not skip is runtime input validation: TypeScript types are erased at compile time, so the inferred input type checks nothing on the wire — every procedure needs `.input(schema)` (zod/valibot) so tRPC validates at runtime and infers the static type from that same schema. Treat the inferred types as developer experience, not as a security boundary.',
        uk: 'У єдиному TypeScript-monorepo крок опису контракту, який вимагають gRPC і GraphQL, — чистий overhead: обидва кінці вже ділять систему типів, тож tRPC дає компілятору змушувати контракт напряму — `export type AppRouter = typeof appRouter`, `import type` на клієнті, а inference робить те, що деінде робить codegen, без `.proto`/SDL для синхронізації й без кроку генерації, який можна забути. Команда отримує миттєві червоні підкреслення в редакторі через межу на будь-якому рефакторі, батчинг httpBatchLink — усе через звичайний HTTP+JSON без нового runtime. Пропустити не можна runtime-валідацію входу: типи TypeScript стираються на компіляції, тож виведений тип входу не перевіряє нічого на дроті — кожна процедура потребує `.input(schema)` (zod/valibot), щоб tRPC валідував у runtime і виводив статичний тип із тієї ж схеми. Став до виведених типів як до developer experience, а не як до межі безпеки.',
      },
      level: 'senior',
    },
    {
      q: {
        en: 'When would you tell that same team NOT to use tRPC — and what breaks if they ignore you?',
        uk: 'Коли б ти сказав тій самій команді НЕ використовувати tRPC — і що зламається, якщо тебе проігнорують?',
      },
      a: {
        en: 'The moment a consumer lives outside their TypeScript. tRPC’s contract is the shared type, imported at build time — so a public API, a Swift/Kotlin mobile app, a Go service, or a partner integration has nothing to import and no schema to code-gen against. If they ship tRPC there anyway, they lose the very thing that justified it (the types never reach a non-TS client) and gain a hand-rolled JSON-over-HTTP API with no published contract; they will end up bolting OpenAPI generators onto tRPC to recover what REST, GraphQL, or gRPC give natively. The decision axis is reach: heterogeneous or untrusted consumers need an explicit, language-neutral contract. Keep tRPC for the internal TS↔TS boundary shipped from one repo, and put REST (reach), GraphQL (client-shaped queries), or gRPC (polyglot performance) at the external edges — running tRPC internally behind a REST or GraphQL public edge is a perfectly good design.',
        uk: 'Щойно споживач живе поза їхнім TypeScript. Контракт tRPC — це спільний тип, імпортований на build-time, тож публічний API, мобілка на Swift/Kotlin, Go-сервіс чи партнерська інтеграція не мають що імпортувати й проти чого code-gen-ити. Якщо вони все одно шиплять туди tRPC, вони втрачають саме те, що його виправдовувало (типи ніколи не дійдуть до не-TS клієнта), і отримують саморобний JSON-over-HTTP API без опублікованого контракту; врешті вони прикручують OpenAPI-генератори до tRPC, щоб повернути те, що REST, GraphQL чи gRPC дають нативно. Вісь рішення — reach: різнорідні чи недовірені споживачі потребують явного, мовно-нейтрального контракту. Тримай tRPC для внутрішньої межі TS↔TS, що шипиться з одного репо, а REST (reach), GraphQL (клієнт-формовані запити) чи gRPC (polyglot-продуктивність) став на зовнішні краї — запускати tRPC всередині за публічним краєм на REST чи GraphQL — цілком добрий дизайн.',
      },
      level: 'senior',
    },
  ],
  seeAlso: ['m10-grpc', 'm9-graphql', 'm5-rest', 'm13-sse', 'm22-security-threats'],
  sources: [
    { title: 'tRPC — Announcing tRPC v11 (current major, 2025)', url: 'https://trpc.io/blog/announcing-trpc-v11' },
    { title: 'tRPC — Define Routers (procedures, queries/mutations/subscriptions)', url: 'https://trpc.io/docs/server/routers' },
    { title: 'tRPC — Input & output validators (runtime validation → inference)', url: 'https://trpc.io/docs/server/validators' },
    { title: 'tRPC — httpBatchLink (same-tick request batching)', url: 'https://trpc.io/docs/client/links/httpBatchLink' },
    { title: 'tRPC — Migrate from v10 to v11', url: 'https://trpc.io/docs/migrate-from-v10-to-v11' },
    { title: 'tRPC — Server-Sent Events subscriptions (v11)', url: 'https://trpc.io/docs/server/subscriptions' },
  ],
};
