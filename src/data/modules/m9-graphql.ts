import type { Module } from '../types';

/*
 * m9-graphql — the client-shaped typed graph over one endpoint (s2, Contract-first & typed). SIGNATURE:
 * sim 'graphql-nplus1' (resolver fan-out vs DataLoader batching). Figure: 'graphql-over-under-fetching'.
 * Ten curriculum topics, ordered why → how → cost → fix → operate: the SDL schema → operations →
 * over/under-fetching (the REST delta, figure) → resolvers → the N+1 problem → DataLoader batching (sim)
 * → schema evolution → persisted queries → depth/complexity security → federation + the verdict.
 * Facts web-verified S6: GraphQL spec September 2025 edition (first full edition since Oct 2021);
 * GraphQL-over-HTTP media type application/graphql-response+json; DataLoader batches within one
 * event-loop tick + caches per request; graphql-ws replaced the deprecated subscriptions-transport-ws;
 * APQ ≠ safelisting (persisted/trusted documents are the security feature); Apollo Router (Rust) composes
 * subgraphs into a supergraph.
 */
export const m9: Module = {
  id: 'm9-graphql',
  num: 9,
  section: 's2-contract-first',
  order: 1,
  level: 'senior',
  signature: true,
  title: { en: 'GraphQL', uk: 'GraphQL' },
  tagline: {
    en: 'One endpoint, a typed graph: the client asks for exactly the fields it needs — and the server pays for it.',
    uk: 'Один endpoint, типізований граф: клієнт бере саме потрібні поля — а платить за це сервер.',
  },
  readMins: 20,
  mentalModel: {
    en: 'GraphQL is a typed graph you query by shape. Instead of many fixed endpoints each returning a fixed payload, there is **one endpoint** and a **schema**; the client sends a query whose shape *is* the response shape, asking for exactly the fields it needs across nested objects — in one round trip. Every field is resolved by a function. That flexibility is the whole point — and its cost lands on the server: a naive resolver tree quietly fans out into N+1 database calls, and an arbitrary client query is an open-ended bill.',
    uk: 'GraphQL — це типізований граф, який ти запитуєш за формою. Замість багатьох фіксованих endpoint-ів, кожен з фіксованим payload, є **один endpoint** і **schema**; клієнт шле query, форма якого *і є* формою відповіді, беручи саме потрібні поля крізь вкладені обʼєкти — за один round trip. Кожне поле резолвить функція. Ця гнучкість — і є суть, а її ціна лягає на сервер: наївне дерево resolver-ів тихо розгортається в N+1 викликів до БД, а довільний клієнтський query — це рахунок без стелі.',
  },
  topics: [
    // ── T1 · The typed schema (SDL) ──────────────────────────────────────────
    {
      id: 'schema-sdl',
      title: { en: 'The typed schema (SDL)', uk: 'Типізована schema (SDL)' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'GraphQL starts from a **schema**: a set of types and fields, usually written in the **SDL** (Schema Definition Language). The schema is the contract — it describes every type of data a client can ask for and how the types connect into a graph. Three **root types** are the entry points: `Query` (reads), `Mutation` (writes), and `Subscription` (streams). Because the whole schema is introspectable, tooling — autocomplete, type generation, docs — comes for free. This is the same contract-first instinct as gRPC’s `.proto` (m10), but the wire is JSON over HTTP and the client, not the schema, decides which fields come back.',
            uk: 'GraphQL починається зі **schema**: набору типів і полів, зазвичай написаних у **SDL** (Schema Definition Language). Schema — це контракт: вона описує кожен тип даних, який клієнт може попросити, і як типи зʼєднані в граф. Три **root-типи** — точки входу: `Query` (читання), `Mutation` (запис), `Subscription` (стріми). Оскільки вся schema підлягає introspection, tooling — автодоповнення, генерація типів, docs — зʼявляється безкоштовно. Це той самий contract-first інстинкт, що й `.proto` gRPC (m10), але на дроті — JSON над HTTP, і які поля повернуться, вирішує клієнт, а не schema.',
          },
        },
        {
          kind: 'code',
          lang: 'graphql',
          code: `type Post {
  id: ID!
  title: String!
  author: Author!        # a nested object — resolved per Post
}

type Author {
  id: ID!
  name: String!
}

type Query {
  posts(limit: Int = 20): [Post!]!
}`,
          note: {
            en: 'SDL in a nutshell: `!` = non-null, `[Post!]!` = a non-null list of non-null Posts. The `author` field on `Post` is a link in the graph — following it is what later triggers the N+1 problem.',
            uk: 'SDL стисло: `!` = non-null, `[Post!]!` = non-null список non-null Post-ів. Поле `author` на `Post` — це ребро графа; саме перехід по ньому згодом і породжує проблему N+1.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'One endpoint, strongly typed, client-shaped', uk: 'Один endpoint, суворо типізований, форму задає клієнт' },
          md: {
            en: 'REST spreads a weak contract across many endpoints (documentation and hope); gRPC has a strong `.proto` contract but fixed method signatures. GraphQL keeps a strong, typed, introspectable contract *and* lets the client pick the fields — one endpoint, any shape. That combination is its signature strength, and the root of everything hard about it.',
            uk: 'REST розмазує слабкий контракт по багатьох endpoint-ах (документація й надія); gRPC має сильний контракт `.proto`, але фіксовані сигнатури методів. GraphQL тримає сильний, типізований, introspectable контракт *і* дає клієнту обирати поля — один endpoint, будь-яка форма. Це поєднання — його фірмова сила й корінь усього складного в ньому.',
          },
        },
      ],
    },
    // ── T2 · Queries, mutations & subscriptions ──────────────────────────────
    {
      id: 'queries-mutations-subscriptions',
      title: { en: 'Queries, mutations & subscriptions', uk: 'Queries, mutations і subscriptions' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'A GraphQL operation is one of three kinds, all sent to the **same endpoint** (canonically `POST /graphql`; the GraphQL-over-HTTP spec defines the request shape and a response media type, `application/graphql-response+json`). A **query** reads data — its field resolvers run concurrently. A **mutation** writes — its *top-level* fields run **in series**, so ordered writes don’t race. A **subscription** is a long-lived stream of events. Subscriptions don’t fit a single request/response, so they ride a different transport: **`graphql-ws`** over WebSockets (which replaced the now-deprecated `subscriptions-transport-ws`) or **`graphql-sse`** over Server-Sent Events (m13).',
            uk: 'GraphQL-операція буває трьох видів, і всі йдуть на **той самий endpoint** (канонічно `POST /graphql`; специфікація GraphQL-over-HTTP визначає форму запиту й media type відповіді — `application/graphql-response+json`). **Query** читає дані — його field-resolver-и працюють паралельно. **Mutation** пише — його *top-level* поля виконуються **послідовно**, тож впорядковані записи не гоняться. **Subscription** — довгоживучий стрім подій. Subscriptions не влазять в один request/response, тож їдуть іншим транспортом: **`graphql-ws`** над WebSockets (замінив застарілий `subscriptions-transport-ws`) або **`graphql-sse`** над Server-Sent Events (m13).',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Operation', uk: 'Operation' },
            { en: 'Purpose', uk: 'Призначення' },
            { en: 'Execution', uk: 'Виконання' },
            { en: 'Transport', uk: 'Транспорт' },
          ],
          rows: [
            [
              { en: 'query', uk: 'query' },
              { en: 'Read', uk: 'Читання' },
              { en: 'Resolvers run in parallel', uk: 'Resolver-и паралельно' },
              { en: 'POST /graphql', uk: 'POST /graphql' },
            ],
            [
              { en: 'mutation', uk: 'mutation' },
              { en: 'Write', uk: 'Запис' },
              { en: 'Top-level fields run in series', uk: 'Top-level поля послідовно' },
              { en: 'POST /graphql', uk: 'POST /graphql' },
            ],
            [
              { en: 'subscription', uk: 'subscription' },
              { en: 'Stream events', uk: 'Стрім подій' },
              { en: 'Long-lived', uk: 'Довгоживучий' },
              { en: 'WebSocket (graphql-ws) / SSE', uk: 'WebSocket (graphql-ws) / SSE' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Use graphql-ws, not subscriptions-transport-ws', uk: 'Бери graphql-ws, а не subscriptions-transport-ws' },
          md: {
            en: 'The original subscription library, `subscriptions-transport-ws`, is unmaintained; the current protocol is `graphql-ws`. If you only need server→client push and want to reuse plain HTTP infrastructure, `graphql-sse` is often the simpler choice. The two WebSocket protocols are not cross-compatible, so client and server must agree.',
            uk: 'Оригінальна бібліотека subscriptions, `subscriptions-transport-ws`, не підтримується; актуальний протокол — `graphql-ws`. Якщо треба лише push сервер→клієнт і хочеш перевикористати звичайну HTTP-інфраструктуру, `graphql-sse` часто простіший вибір. Два WebSocket-протоколи не сумісні між собою, тож клієнт і сервер мають домовитися.',
          },
        },
      ],
    },
    // ── T3 · Over- and under-fetching (the REST delta, figure) ───────────────
    {
      id: 'over-under-fetching',
      title: { en: 'Over- and under-fetching', uk: 'Over- і under-fetching' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The reason GraphQL exists is a pair of problems REST runs into. **Over-fetching**: a fixed endpoint returns a fixed payload, so `GET /users/1` hands you the whole user when the screen needs only the name. **Under-fetching**: one endpoint isn’t enough, so a single view fires several requests — user, then their posts, then each post’s comments — the classic chatty mobile screen. GraphQL collapses both: the client sends *one* query naming exactly the fields it wants, across nested relationships, and gets back exactly that shape in one round trip. The query shape **is** the response shape.',
            uk: 'Причина існування GraphQL — пара проблем, у які впирається REST. **Over-fetching**: фіксований endpoint віддає фіксований payload, тож `GET /users/1` дає тобі всього user-а, коли екрану треба лише name. **Under-fetching**: одного endpoint замало, тож один екран шле кілька запитів — user, потім його posts, потім comments кожного post-а — класичний балакучий мобільний екран. GraphQL згортає обидва: клієнт шле *один* query, називаючи саме потрібні поля крізь вкладені звʼязки, і отримує рівно цю форму за один round trip. Форма query **і є** формою відповіді.',
          },
        },
        {
          kind: 'figure',
          fig: 'graphql-over-under-fetching',
          caption: {
            en: 'REST returns fixed payloads over several endpoints (over- + under-fetching); GraphQL returns exactly the requested fields from one endpoint in one request.',
            uk: 'REST повертає фіксовані payload-и через кілька endpoint-ів (over- + under-fetching); GraphQL повертає саме запитані поля з одного endpoint за один запит.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'The client’s convenience is the server’s problem', uk: 'Зручність клієнта — це проблема сервера' },
          md: {
            en: 'Letting the client shape arbitrary nested queries moves cost from the network to the server. A field the client casually adds can mean another table, another service, another fan-out. Everything hard about GraphQL in production — the N+1 problem, complexity-based DoS, caching — flows from this one move. The rest of this module is about paying that bill deliberately.',
            uk: 'Дозвіл клієнту формувати довільні вкладені запити переносить вартість з мережі на сервер. Поле, яке клієнт мимохідь додав, може означати ще одну таблицю, ще один сервіс, ще один fan-out. Усе складне в GraphQL у проді — проблема N+1, complexity-based DoS, кешування — випливає з цього одного кроку. Решта модуля — про те, як платити цей рахунок свідомо.',
          },
        },
      ],
    },
    // ── T4 · Resolvers ────────────────────────────────────────────────────────
    {
      id: 'resolvers',
      title: { en: 'Resolvers: how a field resolves', uk: 'Resolver-и: як резолвиться поле' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Behind every field is a **resolver** — a function `(obj, args, context, info)` that returns the field’s value. Execution walks the query tree top-down: the root `Query.posts` resolver returns a list, then for each Post the engine calls the `Post.author` resolver, and so on until it reaches scalar **leaves** (strings, numbers). Resolvers can be async — they return Promises, and GraphQL awaits them with optimal concurrency. Many are *trivial* (just read a property off the parent object), but a field like `author` usually has to **go fetch** — and that is exactly where the trouble starts.',
            uk: 'За кожним полем стоїть **resolver** — функція `(obj, args, context, info)`, що повертає значення поля. Виконання йде деревом query згори вниз: кореневий resolver `Query.posts` повертає список, далі для кожного Post рушій кличе resolver `Post.author`, і так до скалярних **листків** (рядки, числа). Resolver-и можуть бути async — повертають Promise, і GraphQL чекає їх з оптимальною конкурентністю. Багато з них *тривіальні* (просто читають властивість з батьківського обʼєкта), але поле на кшталт `author` зазвичай мусить **піти дістати** — і саме звідси починаються проблеми.',
          },
        },
        {
          kind: 'code',
          lang: 'js',
          code: `const resolvers = {
  Query: {
    posts: (_p, { limit }, ctx) => ctx.db.posts.list(limit),      // 1 query
  },
  Post: {
    // called once PER post in the list → the N+1 fan-out
    author: (post, _a, ctx) => ctx.db.users.byId(post.authorId),
  },
};`,
          note: {
            en: 'The `Post.author` resolver looks innocent, but the engine runs it once for every post the list returned. Ten posts → ten `users.byId` calls, on top of the one `posts.list`.',
            uk: 'Resolver `Post.author` виглядає невинно, але рушій виконує його для кожного post-а зі списку. Десять post-ів → десять викликів `users.byId` понад один `posts.list`.',
          },
        },
      ],
    },
    // ── T5 · The N+1 problem ─────────────────────────────────────────────────
    {
      id: 'the-n-plus-1-problem',
      title: { en: 'The N+1 problem', uk: 'Проблема N+1' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Put the resolver tree and the nested field together and you get the **N+1 problem**. A query for a list of `posts` where each `post` also asks for its `author` runs **one** query to load the N posts, then **one more query per post** to load its author — `1 + N` database calls for what a single `JOIN` or `WHERE id IN (…)` could do in two. It’s insidious because it’s **invisible in development**: with three rows in a seed database everything is instant; with ten thousand rows and real latency it quietly melts the database. The N+1 problem isn’t unique to GraphQL — ORMs hit it too — but GraphQL’s per-field resolvers make it the *default* outcome unless you design against it.',
            uk: 'Склади дерево resolver-ів і вкладене поле — і отримаєш **проблему N+1**. Query за списком `posts`, де кожен `post` ще й просить свого `author`, робить **один** запит, щоб завантажити N post-ів, а потім **ще по одному запиту на кожен post**, щоб завантажити його author — `1 + N` викликів до БД замість двох через `JOIN` чи `WHERE id IN (…)`. Це підступно, бо **невидиме в розробці**: з трьома рядками в seed-БД усе миттєве; з десятьма тисячами рядків і реальною latency воно тихо плавить базу. Проблема N+1 не унікальна для GraphQL — ORM-и теж у неї впираються — але per-field resolver-и GraphQL роблять її *дефолтним* результатом, якщо не проєктувати проти неї.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'It scales with your data, not your code', uk: 'Воно масштабується з даними, а не з кодом' },
          md: {
            en: 'N+1 is a data-volume bug, so it passes every code review and every small-dataset test, then surfaces as a production incident when a popular list grows. Treat any nested resolver that fetches (`author`, `comments`, `organization`) as N+1 until proven batched. The fix — DataLoader — is next.',
            uk: 'N+1 — це баг обсягу даних, тож він проходить будь-який code review і будь-який тест на малому наборі, а потім спливає прод-інцидентом, коли популярний список росте. Вважай будь-який вкладений resolver, що фетчить (`author`, `comments`, `organization`), проблемою N+1, доки не доведено, що він батчиться. Виправлення — DataLoader — далі.',
          },
        },
      ],
    },
    // ── T6 · DataLoader batching (the sim) ───────────────────────────────────
    {
      id: 'dataloader-batching',
      title: { en: 'DataLoader batching', uk: 'DataLoader batching' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: '**DataLoader** sits between your resolvers and the data source and turns the fan-out back into a batch. Instead of querying immediately, each `author` resolver calls `loader.load(authorId)`, which just registers the key. DataLoader collects **every key requested within a single tick of the event loop**, then calls your batch function **once** with all of them — one `SELECT … WHERE id IN (…)`. A **per-request cache** dedupes repeats, so two posts by the same author cause only one lookup. `1 + N` collapses to `1 + 1`. Drive the simulator below: toggle DataLoader and watch the database query count fall from N+1 to 2.',
            uk: '**DataLoader** стоїть між твоїми resolver-ами й джерелом даних і перетворює fan-out назад на batch. Замість негайного запиту кожен resolver `author` кличе `loader.load(authorId)`, що лише реєструє ключ. DataLoader збирає **кожен ключ, запитаний у межах одного tick event loop**, а тоді кличе твою batch-функцію **один раз** з усіма — один `SELECT … WHERE id IN (…)`. **Per-request cache** дедуплікує повтори, тож два post-и того самого author дають лише один lookup. `1 + N` згортається в `1 + 1`. Покрути симулятор нижче: увімкни DataLoader і дивись, як кількість запитів до БД падає з N+1 до 2.',
          },
        },
        {
          kind: 'sim',
          sim: 'graphql-nplus1',
          caption: {
            en: 'Set the number of posts and toggle DataLoader. Naive resolvers issue one author query per post (N+1); DataLoader batches the tick’s loads into a single de-duplicated IN query (2 total).',
            uk: 'Задай кількість post-ів і перемкни DataLoader. Наївні resolver-и шлють по одному запиту author на кожен post (N+1); DataLoader батчить завантаження tick-у в один дедуплікований IN-запит (2 усього).',
          },
        },
        {
          kind: 'code',
          lang: 'js',
          code: `// one loader PER request, created in context
const authorLoader = new DataLoader(
  (ids) => ctx.db.users.byIds(ids)   // 1 query: WHERE id IN (ids)
);

const resolvers = {
  Post: { author: (post) => authorLoader.load(post.authorId) }, // batched + de-duped
};`,
          note: {
            en: 'The resolver looks per-post, but `load()` defers to the batch. Same tick, all keys → one query.',
            uk: 'Resolver виглядає per-post, але `load()` відкладає до batch. Той самий tick, усі ключі → один запит.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'Create the loader per request, never globally', uk: 'Створюй loader на кожен запит, ніколи глобально' },
          md: {
            en: 'DataLoader’s cache is meant to live for **one** GraphQL request. A loader shared across requests would serve one user stale data — or another user’s data — and never see writes. Instantiate loaders in the per-request context, and let them be garbage-collected when the request ends.',
            uk: 'Cache DataLoader має жити протягом **одного** GraphQL-запиту. Loader, спільний між запитами, віддавав би одному користувачу застарілі дані — або дані іншого користувача — і ніколи не бачив би записів. Створюй loader-и в per-request context і дай їм зібратися garbage collector-ом, коли запит завершиться.',
          },
        },
      ],
    },
    // ── T7 · Schema evolution ────────────────────────────────────────────────
    {
      id: 'schema-evolution',
      title: { en: 'Schema evolution', uk: 'Еволюція schema' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'GraphQL discourages URL versions like `/v2`. Because a client only ever receives the fields it explicitly selects, **adding** a field or type can’t break anyone — additive change is safe by construction. To retire a field you mark it **`@deprecated(reason:)`**; tooling surfaces the warning, field-usage analytics tell you who still calls it, and once usage reaches zero you remove it. Evolution becomes continuous instead of a big-bang version bump. (The current **September 2025** spec edition — the first full edition since October 2021 — also adds schema coordinates and `oneOf` input objects, sharpening how tools reference and validate the graph.)',
            uk: 'GraphQL відмовляє в URL-версіях на кшталт `/v2`. Оскільки клієнт отримує лише поля, які явно вибрав, **додавання** поля чи типу не може нічого зламати — additive-зміна безпечна за побудовою. Щоб вивести поле з ужитку, позначаєш його **`@deprecated(reason:)`**; tooling показує попередження, аналітика використання полів каже, хто ще його кличе, і коли використання падає до нуля — ти його прибираєш. Еволюція стає безперервною замість big-bang стрибка версії. (Актуальна редакція специфікації **September 2025** — перша повна з жовтня 2021 — також додає schema coordinates і `oneOf` input objects, уточнюючи, як інструменти посилаються на граф і валідують його.)',
          },
        },
        {
          kind: 'code',
          lang: 'graphql',
          code: `type Author {
  name: String!
  fullName: String @deprecated(reason: "Use \`name\`.")
}`,
          note: {
            en: 'Add `name`, deprecate `fullName`, watch usage drop to zero, then delete it — no `/v2`, no forced client migration.',
            uk: 'Додай `name`, deprecate `fullName`, дочекайся нуля використання, тоді видали — без `/v2`, без примусової міграції клієнтів.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Additive is safe; changing a field’s meaning is not', uk: 'Additive безпечно; зміна сенсу поля — ні' },
          md: {
            en: 'The escape from versioning only holds while changes are additive. Renaming a field, tightening a type (nullable → non-null on input, or the reverse on output), or quietly changing a field’s semantics are still breaking. This is the same discipline as protobuf field numbers (m10) and REST versioning (m18): grow the contract, don’t mutate it.',
            uk: 'Втеча від версіонування тримається лише поки зміни additive. Перейменування поля, звуження типу (nullable → non-null на вході чи навпаки на виході) або тиха зміна семантики поля — усе ще breaking. Це та сама дисципліна, що й номери полів protobuf (m10) та версіонування REST (m18): нарощуй контракт, а не мутуй його.',
          },
        },
      ],
    },
    // ── T8 · Persisted queries & trusted documents ───────────────────────────
    {
      id: 'persisted-queries',
      title: { en: 'Persisted queries & trusted documents', uk: 'Persisted queries і trusted documents' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Two related features share a confusing name. **Automatic Persisted Queries (APQ)** let a client send a short **SHA-256 hash** instead of the full query text; if the server has seen it, it runs the cached document, otherwise the client registers it once. APQ shrinks requests and makes them GET-cacheable — it is purely a **performance** feature. **Persisted queries / trusted documents** are different: a **build-time allowlist** (a persisted-query list) of exactly the operations your first-party apps are allowed to run, so the server rejects anything else. That is a **security** feature — an operation safelist.',
            uk: 'Дві повʼязані фічі ділять оманливу назву. **Automatic Persisted Queries (APQ)** дають клієнту слати короткий **SHA-256 hash** замість повного тексту query; якщо сервер його бачив — виконує кешований документ, інакше клієнт реєструє його раз. APQ зменшує запити й робить їх GET-кешованими — це суто фіча **продуктивності**. **Persisted queries / trusted documents** — інше: **build-time allowlist** (persisted-query list) саме тих операцій, які твоїм first-party застосункам дозволено виконувати, тож сервер відхиляє будь-що інше. Це фіча **безпеки** — safelist операцій.',
          },
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'APQ is not safelisting', uk: 'APQ — це не safelisting' },
          md: {
            en: 'A common and dangerous mix-up: APQ does **not** secure your API. Because clients can register new operations at runtime, APQ still accepts arbitrary queries. To actually lock a public graph to known operations you must use a persisted-query allowlist (trusted documents) and turn automatic registration off. Performance and safelisting are two different switches.',
            uk: 'Поширена й небезпечна плутанина: APQ **не** захищає твій API. Оскільки клієнти можуть реєструвати нові операції в рантаймі, APQ усе одно приймає довільні query. Щоб реально замкнути публічний граф на відомі операції, треба persisted-query allowlist (trusted documents) і вимкнути автоматичну реєстрацію. Продуктивність і safelisting — це два різні перемикачі.',
          },
        },
      ],
    },
    // ── T9 · Security: depth & complexity ────────────────────────────────────
    {
      id: 'security-depth-complexity',
      title: { en: 'Security: depth & complexity limits', uk: 'Безпека: ліміти depth і complexity' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'One endpoint that accepts arbitrary nested queries is a denial-of-service surface. A deeply nested or cyclic query (`posts → author → posts → author …`) or a very wide one can ask for astronomically more work than any REST endpoint could. The defenses are layered and must run **before** resolvers do: a **maximum depth** limit, a **query cost / complexity** budget (assign each field a cost and reject queries over a threshold), pagination on every list, and per-operation timeouts. Many teams also **disable introspection in production** to slow schema discovery, and always add field-level **authorization** and CSRF protection — a GraphQL POST is still an HTTP request.',
            uk: 'Один endpoint, що приймає довільні вкладені query, — це поверхня denial-of-service. Глибоко вкладений чи циклічний query (`posts → author → posts → author …`) або дуже широкий може попросити астрономічно більше роботи, ніж будь-який REST-endpoint. Захист багатошаровий і має спрацьовувати **до** resolver-ів: ліміт **максимальної depth**, бюджет **query cost / complexity** (признач кожному полю вартість і відхиляй query понад поріг), пагінація на кожному списку та таймаути на операцію. Багато команд також **вимикають introspection у проді**, щоб уповільнити розвідку schema, і завжди додають field-level **авторизацію** й CSRF-захист — GraphQL POST усе одно HTTP-запит.',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Threat', uk: 'Загроза' },
            { en: 'Defense', uk: 'Захист' },
          ],
          rows: [
            [
              { en: 'Deeply nested / cyclic query', uk: 'Глибоко вкладений / циклічний query' },
              { en: 'Maximum depth limit', uk: 'Ліміт максимальної depth' },
            ],
            [
              { en: 'Expensive wide query (DoS)', uk: 'Дорогий широкий query (DoS)' },
              { en: 'Query cost / complexity budget', uk: 'Бюджет query cost / complexity' },
            ],
            [
              { en: 'Schema discovery', uk: 'Розвідка schema' },
              { en: 'Disable introspection in prod', uk: 'Вимкнути introspection у проді' },
            ],
            [
              { en: 'Arbitrary operations', uk: 'Довільні операції' },
              { en: 'Persisted / trusted documents', uk: 'Persisted / trusted documents' },
            ],
            [
              { en: 'Unbounded lists', uk: 'Безмежні списки' },
              { en: 'Pagination + timeouts', uk: 'Пагінація + таймаути' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'The top GraphQL threat is complexity, not injection', uk: 'Головна загроза GraphQL — complexity, не injection' },
          md: {
            en: 'Unlike REST, GraphQL’s defining risk is that a single valid query can be ruinously expensive. Depth and cost limits are not optional hardening — they are the primary control, and they must be enforced during validation, before a single resolver touches the database.',
            uk: 'На відміну від REST, визначальний ризик GraphQL — що один валідний query може бути руйнівно дорогим. Ліміти depth і cost — не опційне загартування, а первинний контроль, і застосовувати їх треба під час валідації, до того як хоч один resolver торкнеться БД.',
          },
        },
      ],
    },
    // ── T10 · Federation & the verdict ───────────────────────────────────────
    {
      id: 'federation',
      title: { en: 'Federation & when to use GraphQL', uk: 'Federation і коли брати GraphQL' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'One giant schema owned by one team becomes an organizational bottleneck. **Federation** splits the graph into **subgraphs** — each team owns a domain schema and its resolvers — which are **composed** into a single **supergraph**. A **router** (Apollo Router, written in Rust, which replaced the older Gateway) receives a client query, plans which subgraphs can resolve which fields, dispatches the sub-queries, and stitches the result. The client still sees **one graph and one endpoint**; the org gets many independently deployable services behind it. It’s the same polyglot instinct as m2: one reachable surface out front, specialized services within.',
            uk: 'Одна велетенська schema, якою володіє одна команда, стає організаційним вузьким місцем. **Federation** розбиває граф на **subgraph-и** — кожна команда володіє domain-schema та її resolver-ами — які **композуються** в один **supergraph**. **Router** (Apollo Router на Rust, що замінив старіший Gateway) приймає клієнтський query, планує, які subgraph-и резолвлять які поля, розсилає під-запити й зшиває результат. Клієнт усе одно бачить **один граф і один endpoint**; організація отримує багато незалежно деплойних сервісів за ним. Це той самий polyglot-інстинкт, що й у m2: одна доступна поверхня спереду, спеціалізовані сервіси всередині.',
          },
        },
        {
          kind: 'compare',
          a: { en: 'Reach for GraphQL', uk: 'Бери GraphQL' },
          b: { en: 'Prefer REST / gRPC', uk: 'Обери REST / gRPC' },
          rows: [
            [
              { en: 'Clients', uk: 'Клієнти' },
              { en: 'Many varied clients over one rich graph', uk: 'Багато різних клієнтів над одним багатим графом' },
              { en: 'Uniform CRUD (REST) or typed internal RPC (gRPC)', uk: 'Уніформний CRUD (REST) чи типізований internal RPC (gRPC)' },
            ],
            [
              { en: 'Fetching', uk: 'Фетчинг' },
              { en: 'Nested, client-shaped, one round trip', uk: 'Вкладений, форму задає клієнт, один round trip' },
              { en: 'Fixed endpoints / methods', uk: 'Фіксовані endpoint-и / методи' },
            ],
            [
              { en: 'Caching', uk: 'Кешування' },
              { en: 'App-level; harder over HTTP', uk: 'На рівні застосунку; складніше над HTTP' },
              { en: 'REST gets HTTP caching for free', uk: 'REST отримує HTTP-кешування безкоштовно' },
            ],
            [
              { en: 'Cost model', uk: 'Модель вартості' },
              { en: 'Server absorbs arbitrary query cost', uk: 'Сервер вбирає довільну вартість query' },
              { en: 'Predictable per-endpoint cost', uk: 'Передбачувана вартість на endpoint' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'The verdict', uk: 'Вердикт' },
          md: {
            en: 'Use GraphQL when many different clients need to read a rich, interconnected graph and you want to kill over- and under-fetching — product APIs, mobile apps, a BFF over many services, a federated org graph. Avoid it for simple cacheable CRUD (REST is less machinery and gets HTTP caching free), for typed high-throughput internal RPC (gRPC, m10), and anywhere you can’t afford to budget query cost. Its power and its danger are the same sentence: the client asks for exactly what it wants — so you must make the server safe to be asked.',
            uk: 'Бери GraphQL, коли багатьом різним клієнтам треба читати багатий взаємоповʼязаний граф і ти хочеш убити over- та under-fetching — product API, мобільні застосунки, BFF над багатьма сервісами, федеративний org-граф. Уникай для простого кешованого CRUD (REST — менше механіки й безкоштовне HTTP-кешування), для типізованого high-throughput internal RPC (gRPC, m10) і там, де не можеш дозволити собі бюджетувати вартість query. Його сила й небезпека — це одне речення: клієнт просить саме те, що хоче, — тож ти маєш зробити сервер безпечним для запитів.',
          },
        },
      ],
    },
  ],
  keyPoints: [
    { en: 'GraphQL is one endpoint over a typed schema; the client’s query shape is the response shape, killing REST’s over- and under-fetching.', uk: 'GraphQL — один endpoint над типізованою schema; форма query клієнта — це форма відповіді, що вбиває over- та under-fetching REST.' },
    { en: 'Every field is a resolver and execution walks the query tree — flexible, but nested fetch resolvers fan out into N+1 database queries.', uk: 'Кожне поле — resolver, а виконання йде деревом query — гнучко, але вкладені fetch-resolver-и розгортаються в N+1 запитів до БД.' },
    { en: 'DataLoader batches every key loaded within one event-loop tick into a single de-duplicated `IN` query and caches per request — N+1 becomes 2.', uk: 'DataLoader батчить кожен ключ, завантажений у межах одного tick event loop, в один дедуплікований `IN`-запит і кешує per-request — N+1 стає 2.' },
    { en: 'Evolve by adding fields and `@deprecated`, not `/v2` URLs — a client only receives the fields it selects, so additive change is safe.', uk: 'Еволюціонуй додаванням полів і `@deprecated`, а не URL `/v2` — клієнт отримує лише вибрані поля, тож additive-зміна безпечна.' },
    { en: 'Arbitrary client queries are a DoS surface: enforce depth + complexity limits before resolvers, and safelist with persisted/trusted documents (APQ alone is not security).', uk: 'Довільні клієнтські query — поверхня DoS: застосовуй ліміти depth + complexity до resolver-ів і safelist через persisted/trusted documents (сам APQ — не безпека).' },
    { en: 'At scale, federate: subgraphs compose into a supergraph a router plans across. Choose GraphQL for rich graphs and varied clients; REST for cacheable CRUD; gRPC for internal RPC.', uk: 'На масштабі федеруй: subgraph-и композуються в supergraph, по якому планує router. Обирай GraphQL для багатих графів і різних клієнтів; REST для кешованого CRUD; gRPC для internal RPC.' },
  ],
  pitfalls: [
    {
      title: { en: 'Shipping resolvers without DataLoader (N+1)', uk: 'Викочувати resolver-и без DataLoader (N+1)' },
      body: {
        en: 'A nested resolver that fetches (`author`, `comments`) runs once per parent row, so a list query silently becomes 1 + N database calls. It passes small-dataset tests and melts under production data. Batch every such resolver with a per-request DataLoader.',
        uk: 'Вкладений resolver, що фетчить (`author`, `comments`), виконується раз на кожен батьківський рядок, тож query-список тихо стає 1 + N викликами до БД. Він проходить тести на малих даних і плавиться під прод-даними. Батч кожен такий resolver через per-request DataLoader.',
      },
    },
    {
      title: { en: 'No depth or complexity limit on a public endpoint', uk: 'Без ліміту depth чи complexity на публічному endpoint' },
      body: {
        en: 'One endpoint accepting arbitrary nested queries lets a single request cost ruinously much. Without a max-depth and a query-cost budget enforced during validation, a deep or wide query is a trivial DoS. These limits are the primary control, not optional hardening.',
        uk: 'Один endpoint, що приймає довільні вкладені query, дозволяє одному запиту коштувати руйнівно багато. Без max-depth і бюджету query-cost під час валідації глибокий чи широкий query — тривіальний DoS. Ці ліміти — первинний контроль, а не опційне загартування.',
      },
    },
    {
      title: { en: 'Mistaking APQ for a safelist', uk: 'Плутати APQ із safelist' },
      body: {
        en: 'Automatic Persisted Queries reduce request size but still let clients register arbitrary operations, so they provide no security. Locking a graph to known operations requires a persisted-query allowlist (trusted documents) with automatic registration turned off.',
        uk: 'Automatic Persisted Queries зменшують розмір запиту, але все одно дають клієнтам реєструвати довільні операції, тож безпеки не дають. Замкнути граф на відомі операції можна лише persisted-query allowlist (trusted documents) із вимкненою автоматичною реєстрацією.',
      },
    },
  ],
  interview: [
    {
      q: { en: 'What is the N+1 problem in GraphQL, and how does DataLoader fix it?', uk: 'Що таке проблема N+1 у GraphQL і як DataLoader її виправляє?' },
      a: {
        en: 'When a query asks for a list plus a nested field — say `posts { author { name } }` — the engine runs one query for the N posts, then calls the `author` resolver once per post, issuing N more queries: 1 + N total. It hides in development because small datasets are fast, then overloads the database in production. DataLoader fixes it by deferring: each `author` resolver calls `loader.load(id)` instead of querying, DataLoader collects all the ids requested within one tick of the event loop, and calls a single batch function — one `SELECT … WHERE id IN (…)`. A per-request cache also de-duplicates repeated ids. So 1 + N collapses to 1 + 1. The key discipline is creating the loader per request so its cache never leaks across users or serves stale data.',
        uk: 'Коли query просить список плюс вкладене поле — скажімо `posts { author { name } }` — рушій робить один запит за N post-ів, потім кличе resolver `author` раз на кожен post, видаючи ще N запитів: 1 + N усього. Це ховається в розробці, бо малі набори швидкі, а тоді перевантажує БД у проді. DataLoader виправляє це відкладанням: кожен resolver `author` кличе `loader.load(id)` замість запиту, DataLoader збирає всі id, запитані в межах одного tick event loop, і кличе одну batch-функцію — один `SELECT … WHERE id IN (…)`. Per-request cache ще й дедуплікує повторні id. Тож 1 + N згортається в 1 + 1. Ключова дисципліна — створювати loader на кожен запит, щоб його cache не протікав між користувачами й не віддавав застарілі дані.',
      },
      level: 'senior',
    },
    {
      q: { en: 'How do you secure a public GraphQL endpoint?', uk: 'Як захистити публічний GraphQL-endpoint?' },
      a: {
        en: 'The defining GraphQL risk is that one valid query can be arbitrarily expensive, so the primary controls are a maximum depth limit and a query cost/complexity budget, both enforced during validation before any resolver runs. On top of that: paginate every list and set per-operation timeouts; add field-level authorization (never rely on the client omitting a field); and treat the POST like any HTTP request with CSRF protection. To eliminate unexpected operations entirely, use persisted queries / trusted documents — a build-time allowlist of the operations your first-party apps may run — and note that APQ alone is a performance feature, not a safelist. Many teams also disable introspection in production to slow schema discovery, though that is defense-in-depth, not a real access control.',
        uk: 'Визначальний ризик GraphQL — що один валідний query може бути довільно дорогим, тож первинні контролі — ліміт максимальної depth і бюджет query cost/complexity, обидва застосовані під час валідації до запуску будь-якого resolver-а. Понад це: пагінуй кожен список і став таймаути на операцію; додай field-level авторизацію (ніколи не покладайся на те, що клієнт пропустить поле); і стався до POST як до будь-якого HTTP-запиту з CSRF-захистом. Щоб узагалі усунути неочікувані операції, використовуй persisted queries / trusted documents — build-time allowlist операцій, які твоїм first-party застосункам дозволено виконувати — і памʼятай, що сам APQ — це фіча продуктивності, а не safelist. Багато команд також вимикають introspection у проді, щоб уповільнити розвідку schema, хоча це defense-in-depth, а не справжній контроль доступу.',
      },
      level: 'senior',
    },
  ],
  seeAlso: ['m5-rest', 'm10-grpc', 'm11-trpc', 'm4-data-formats', 'm18-versioning', 'm19-errors-status'],
  sources: [
    { title: 'GraphQL Specification — September 2025 edition', url: 'https://spec.graphql.org/September2025/' },
    { title: 'GraphQL — Learn: Schemas and Types (SDL)', url: 'https://graphql.org/learn/schema/' },
    { title: 'GraphQL — Learn: Execution (resolvers)', url: 'https://graphql.org/learn/execution/' },
    { title: 'GraphQL over HTTP specification', url: 'https://graphql.github.io/graphql-over-http/' },
    { title: 'DataLoader — batching & per-request caching (graphql/dataloader)', url: 'https://github.com/graphql/dataloader' },
    { title: 'graphql-ws — the GraphQL over WebSocket Protocol', url: 'https://www.npmjs.com/package/graphql-ws' },
    { title: 'GraphQL — Learn: Security (depth, complexity, introspection)', url: 'https://graphql.org/learn/security/' },
    { title: 'Apollo — Safelisting with Persisted Queries', url: 'https://www.apollographql.com/docs/graphos/platform/security/persisted-queries' },
    { title: 'GraphQL — Learn: Federation (subgraphs, supergraph, router)', url: 'https://graphql.org/learn/federation/' },
  ],
};
