import type { Module } from '../types';

/*
 * m18-versioning — Versioning & evolution (s4-cross-cutting, order 2). Change the contract without
 * breaking callers. Right-sized: no hero sim; figure 'version-strategies' (URI vs header vs media-type,
 * same request three ways). Five curriculum topics: uri-vs-header-vs-media-type (figure) →
 * breaking-change-taxonomy → graphql-protobuf-evolution → deprecation-sunset → consumer-driven-contracts
 * (verdict).
 *
 * Facts web-verified S11 (2026-07):
 *  - Deprecation HTTP header = RFC 9745 (a published Proposed Standard) — value is a structured-field Date
 *    (RFC 9651); may be past or future. Sunset = RFC 8594 — an HTTP-date; Sunset MUST NOT be earlier than
 *    Deprecation. Pair with a Link header to the migration guide.
 *  - GraphQL evolves without version numbers: additive schema growth + the @deprecated(reason:) directive,
 *    removal only at zero usage (usage analytics); nullability changes are the subtle break.
 *  - protobuf: the field NUMBER is the contract (not the name). Adding a new number is backward+forward
 *    compatible (unknown fields preserved); NEVER reuse/change a number; when removing, `reserved` the
 *    number (and name). Renaming is wire-safe but breaks JSON/codegen.
 *  - Consumer-driven contracts = Pact: consumers publish expected interactions, the provider verifies them
 *    in CI, so a breaking change fails the provider build before deploy. buf breaking / GraphQL checks are
 *    the contract-first equivalents.
 */
export const m18: Module = {
  id: 'm18-versioning',
  num: 18,
  section: 's4-cross-cutting',
  order: 2,
  level: 'senior',
  title: { en: 'Versioning & evolution', uk: 'Версіонування та еволюція' },
  tagline: {
    en: 'Change the contract without breaking callers.',
    uk: 'Змінюй контракт, не ламаючи клієнтів.',
  },
  readMins: 15,
  mentalModel: {
    en: 'A published API is **a promise you have to keep**: the moment a client depends on a field, you can no longer remove or redefine it without breaking them. So evolution has one golden rule — **add, never take away; make new things optional; and when you must remove, deprecate on a clock, then sunset.** Explicit versioning (`/v1` → `/v2`) is the escape hatch for a *true* breaking change, but every version you ship is a version you must run, test, and support forever. The senior instinct is therefore inverted from the junior one: the best versioning strategy is the one you **rarely need**, because you designed the surface — and the clients — to **evolve compatibly**. Contract-first styles (GraphQL, protobuf) take this furthest: they drop version numbers entirely and evolve the schema under machine-checked compatibility rules.',
    uk: 'Опублікований API — це **обіцянка, яку треба тримати**: щойно клієнт залежить від поля, ти вже не можеш прибрати чи перевизначити його, не зламавши його. Тож еволюція має одне золоте правило — **додавай, ніколи не забирай; роби нове опційним; а коли мусиш прибрати — deprecate за годинником, потім sunset.** Явне версіонування (`/v1` → `/v2`) — це аварійний вихід для *справжньої* ламкої зміни, але кожна версія, яку ти випустив, — це версія, яку треба вічно запускати, тестувати й підтримувати. Тому senior-інстинкт обернений до junior-івського: найкраща стратегія версіонування — та, яка **рідко потрібна**, бо ти спроєктував поверхню — і клієнтів — **еволюціонувати сумісно**. Contract-first стилі (GraphQL, protobuf) доводять це найдалі: вони зовсім прибирають номери версій і еволюціонують схему за машинно-перевіреними правилами сумісності.',
  },
  topics: [
    // ── T1 · Where the version lives (figure) ─────────────────────────────────
    {
      id: 'uri-vs-header-vs-media-type',
      title: { en: 'URI vs header vs media type', uk: 'URI проти header проти media type' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'When you *do* version explicitly, there are three places to put the version, and the choice is a genuine trade-off. **URI path** (`/v2/orders/42`) is the most common: the version is **visible**, trivially **cacheable and routable**, and testable straight from a browser — at the cost of purists’ objection that a URI should name a *resource*, not its representation version, and that you fork the entire surface per version. **Custom header** (`API-Version: 2`) keeps URIs clean and stable, but the version is **less discoverable**, easy to forget, awkward to test by hand, and caches must be told to **vary** on it. **Media type / content negotiation** (`Accept: application/vnd.acme.order.v2+json`) is the **HTTP-native** answer — you version the *representation* and negotiate per resource — but tooling and discoverability are the weakest of the three. In practice public web APIs lean on **URI versioning** for pragmatism, media-type is the **purest**, and the header sits in between; the rule that matters more than the choice is **pick one and apply it consistently**, and version the API as a whole rather than each endpoint.',
            uk: 'Коли ти *справді* версіонуєш явно, є три місця для версії, і вибір — це реальний trade-off. **URI path** (`/v2/orders/42`) найпоширеніший: версія **видима**, тривіально **кешовна й маршрутовна**, тестовна прямо з браузера — ціною закиду пуристів, що URI має називати *ресурс*, а не версію його представлення, і що ти форкаєш усю поверхню на кожну версію. **Власний header** (`API-Version: 2`) тримає URI чистими й стабільними, але версія **менш помітна**, її легко забути, незручно тестувати вручну, а кешам треба сказати **vary** по ньому. **Media type / content negotiation** (`Accept: application/vnd.acme.order.v2+json`) — **HTTP-нативна** відповідь: ти версіонуєш *представлення* й узгоджуєш його на кожен ресурс — але тулінг і помітність тут найслабші з трьох. На практиці публічні web-API спираються на **URI-версіонування** з прагматизму, media-type — **найчистіший**, а header посередині; правило, важливіше за вибір, — **обери одне й застосовуй послідовно**, і версіонуй API як ціле, а не кожен endpoint окремо.',
          },
        },
        {
          kind: 'figure',
          fig: 'version-strategies',
          caption: {
            en: 'The same request, versioned three ways: in the URI path (visible, cacheable), in a custom header (clean URI, caches must vary on it), or in the media type via content negotiation (HTTP-native, per-representation). URI versioning is the pragmatic public-API default; media-type is the purest.',
            uk: 'Той самий запит, версіонований трьома способами: у шляху URI (видимо, кешовно), у власному header (чистий URI, кеші мають vary по ньому) або в media type через content negotiation (HTTP-нативно, per-representation). URI-версіонування — прагматичний дефолт публічних API; media-type — найчистіший.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'A version in the URL is coupling you can’t take back', uk: 'Версія в URL — це звʼязаність, яку не повернути' },
          md: {
            en: 'Once clients hardcode `/v1`, that path is load-bearing forever — which is exactly the point (stability) and exactly the cost (you run `/v1` until the last caller leaves). That asymmetry is why the strategy question matters less than the *evolution* question: if you can grow the surface compatibly (next topics), you rarely mint a new version at all, and you avoid maintaining two of everything.',
            uk: 'Щойно клієнти захардкодять `/v1`, цей шлях несе навантаження назавжди — і це саме сенс (стабільність) і саме ціна (ти тримаєш `/v1`, доки не піде останній викликач). Ця асиметрія — причина, чому питання стратегії важить менше за питання *еволюції*: якщо ти можеш нарощувати поверхню сумісно (наступні теми), ти рідко карбуєш нову версію взагалі й уникаєш підтримки двох копій усього.',
          },
        },
      ],
    },
    // ── T2 · Breaking-change taxonomy ─────────────────────────────────────────
    {
      id: 'breaking-change-taxonomy',
      title: { en: 'What actually breaks a client', uk: 'Що насправді ламає клієнта' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Compatible evolution needs a shared, precise line between safe and breaking. **Breaking** (needs a new version or a long deprecation): removing or renaming a field or endpoint; changing a field’s **type** or **meaning**; making an optional request parameter **required**; **tightening** validation or accepted enums; changing default values; or changing the **error codes/semantics** a client branches on. **Non-breaking** (safe to ship in place): adding an **optional** response field; adding an **optional** request parameter with a safe default; adding a new endpoint; **loosening** validation. The subtlety that catches teams: **adding a value to an output enum is only safe if clients ignore ones they don’t recognise**, and **adding a response field is only safe if clients ignore unknown fields.** Compatibility is therefore a **two-sided contract** — the server adds carefully *and* the client is built to tolerate what it didn’t expect.',
            uk: 'Сумісна еволюція потребує спільної, точної межі між безпечним і ламким. **Ламке** (потребує нової версії чи довгого deprecation): прибрати чи перейменувати поле або endpoint; змінити **тип** чи **сенс** поля; зробити опційний параметр запиту **обовʼязковим**; **посилити** валідацію чи прийняті enum-и; змінити дефолтні значення; або змінити **коди/семантику помилок**, на які клієнт розгалужується. **Не-ламке** (безпечно котити на місці): додати **опційне** поле відповіді; додати **опційний** параметр запиту з безпечним дефолтом; додати новий endpoint; **послабити** валідацію. Тонкість, що ловить команди: **додати значення до вихідного enum безпечно лише якщо клієнти ігнорують нерозпізнані**, а **додати поле відповіді безпечно лише якщо клієнти ігнорують невідомі поля.** Тому сумісність — це **двобічний контракт**: сервер додає обережно *і* клієнт зроблений терпіти те, чого не очікував.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'The tolerant reader makes evolution possible', uk: 'Терплячий читач робить еволюцію можливою' },
          md: {
            en: 'The robustness principle in practice: a client should **ignore fields it does not know** and **not over-validate** the parts it does not use, so that a server’s additive change stays invisible to it. Brittle clients that reject unknown fields or exhaustively switch on every enum value turn a *safe* server change into an outage. Design both ends for change — a tolerant reader on the client is what lets the server grow without a version bump.',
            uk: 'Принцип робастності на практиці: клієнт має **ігнорувати поля, яких не знає**, і **не перевалідовувати** те, чим не користується, щоб адитивна зміна сервера лишалась для нього невидимою. Крихкі клієнти, що відкидають невідомі поля чи вичерпно розгалужуються на кожне значення enum, перетворюють *безпечну* зміну сервера на аварію. Проєктуй обидва кінці під зміни — терплячий читач на клієнті і є те, що дає серверу рости без bump-у версії.',
          },
        },
      ],
    },
    // ── T3 · GraphQL & protobuf evolution ─────────────────────────────────────
    {
      id: 'graphql-protobuf-evolution',
      title: { en: 'Contract-first evolution (no /v2)', uk: 'Contract-first еволюція (без /v2)' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Contract-first styles evolve **without version numbers by design**, replacing “mint /v2” with “grow the schema under compatibility rules.” **GraphQL** has no `/v2`: because a client asks for **exactly the fields it wants**, adding fields and types never over-fetches or breaks anyone. You never remove in place — you mark a field **`@deprecated(reason: "use fullName")`** (which surfaces in introspection and IDEs), watch **per-field usage analytics**, and delete only when usage reaches zero. The subtle break is **nullability**: making a nullable field non-null, or vice versa, can break existing clients and resolvers. **protobuf/gRPC** hangs everything on the **field number, not the name**: adding a field with a **new number** is backward *and* forward compatible (old code preserves unknown fields), but you must **never reuse or change a number** — when you remove a field you **`reserved`** its number (and name) so no one can. Renaming a field is safe on the binary wire (the number is unchanged) but breaks JSON and generated code. Tooling makes the rules enforceable — **`buf` breaking-change detection** for protobuf, **schema checks / usage stats** for GraphQL — so a breaking diff fails CI instead of a client.',
            uk: 'Contract-first стилі еволюціонують **без номерів версій за задумом**, замінюючи «викарбувати /v2» на «нарощувати схему за правилами сумісності». **GraphQL** не має `/v2`: оскільки клієнт просить **рівно ті поля, які хоче**, додавання полів і типів ніколи не over-fetch-ить і нікого не ламає. Ти ніколи не прибираєш на місці — ти позначаєш поле **`@deprecated(reason: "use fullName")`** (воно зʼявляється в introspection та IDE), стежиш за **per-field usage-аналітикою** й видаляєш, лише коли використання сягне нуля. Тонкий злам — **nullability**: зробити nullable-поле non-null чи навпаки може зламати наявних клієнтів і резолвери. **protobuf/gRPC** вішає все на **номер поля, а не назву**: додати поле з **новим номером** — backward *і* forward сумісно (старий код зберігає невідомі поля), але **ніколи не переюзовуй і не змінюй номер** — прибираючи поле, ти **`reserved`**-уєш його номер (і назву), щоб ніхто не зміг. Перейменувати поле безпечно на бінарному wire (номер не змінився), але ламає JSON і згенерований код. Тулінг робить правила примусовими — **`buf` breaking-change detection** для protobuf, **schema checks / usage stats** для GraphQL — тож ламкий diff валить CI, а не клієнта.',
          },
        },
        {
          kind: 'code',
          lang: 'protobuf',
          code: `message Order {
  string id     = 1;
  string status = 2;
  // v1 had 'string customer = 3;' — removed.
  // Protect its number so it is never reused:
  reserved 3;
  reserved "customer";

  Customer customer_obj = 4; // the additive replacement (new number)
}`,
          note: {
            en: 'protobuf evolution: the removed field’s NUMBER (3) is reserved so a future edit cannot reuse it and silently misread old data; the replacement takes a brand-new number (4). Adding 4 is backward- and forward-compatible.',
            uk: 'Еволюція protobuf: НОМЕР прибраного поля (3) зарезервовано, щоб майбутня правка не переюзала його й мовчки не прочитала старі дані хибно; заміна бере цілком новий номер (4). Додавання 4 — backward- і forward-сумісне.',
          },
        },
      ],
    },
    // ── T4 · Deprecation & sunset ─────────────────────────────────────────────
    {
      id: 'deprecation-sunset',
      title: { en: 'Deprecate on a clock, then sunset', uk: 'Deprecate за годинником, потім sunset' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Once you have decided something must go, remove it **on a clock and in the open**. Announce it in the changelog and docs, then signal it **in-band** with two HTTP headers so tooling can see it too. **`Deprecation`** (RFC 9745) carries a structured-field **date** stating when the resource became — or will become — deprecated (it may be in the past or the future). **`Sunset`** (RFC 8594) carries the date the resource is expected to **stop responding**, and it **must not be earlier than** the Deprecation date. Add a **`Link`** header pointing at the migration guide. Then give a **realistic window** (public APIs measure this in months to years), **monitor usage** of the deprecated field or endpoint, and only actually remove it when usage is at or near zero. Contract-first equivalents exist: GraphQL’s **`@deprecated`** directive and protobuf’s **`deprecated = true`** field option both mark the intent where clients and tools will see it.',
            uk: 'Щойно ти вирішив, що щось має піти, прибирай **за годинником і відкрито**. Оголоси в changelog і docs, тоді просигналь **in-band** двома HTTP-headers, щоб і тулінг це бачив. **`Deprecation`** (RFC 9745) несе structured-field **дату**, що каже, коли ресурс став — або стане — deprecated (може бути в минулому чи майбутньому). **`Sunset`** (RFC 8594) несе дату, коли ресурс має **перестати відповідати**, і вона **не може бути раніша за** дату Deprecation. Додай header **`Link`**, що вказує на гайд міграції. Тоді дай **реалістичне вікно** (публічні API міряють його місяцями-роками), **моніторь використання** deprecated-поля чи endpoint і реально прибирай, лише коли використання на нулі чи близько. Contract-first аналоги є: директива GraphQL **`@deprecated`** і опція поля protobuf **`deprecated = true`** позначають намір там, де клієнти й інструменти його побачать.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'Deprecation is communication, not deletion', uk: 'Deprecation — це комунікація, а не видалення' },
          md: {
            en: 'A `Deprecation` header nobody reads and a `Sunset` nobody was told about will still break silent consumers on removal day. Machine signals are necessary but not sufficient: pair them with human ones — email the known integrators, put it in the changelog and dashboards — and **gate removal on measured usage**, not the calendar alone. If you cannot see who still calls the old thing, you cannot safely delete it.',
            uk: 'Header `Deprecation`, якого ніхто не читає, і `Sunset`, про який нікому не сказали, все одно зламають тихих споживачів у день видалення. Машинні сигнали необхідні, але недостатні: поєднай їх із людськими — напиши відомим інтеграторам, додай у changelog і дашборди — і **гейти видалення на виміряному використанні**, а не лише на календарі. Якщо ти не бачиш, хто ще кличе старе, ти не можеш безпечно його видалити.',
          },
        },
      ],
    },
    // ── T5 · Consumer-driven contracts + verdict ──────────────────────────────
    {
      id: 'consumer-driven-contracts',
      title: { en: 'Consumer-driven contracts & the verdict', uk: 'Consumer-driven contracts і вердикт' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The proactive alternative to “ship and hope” is **consumer-driven contract testing** (the canonical tool is **Pact**). Each **consumer** writes down the interactions it actually depends on — the requests it sends and the response shape it needs — as a **contract**; the **provider** then **verifies those contracts in its CI**. A breaking change fails the *provider’s* build **before deploy**, instead of the *consumer’s* runtime after. This inverts the usual spec relationship: a provider-driven **OpenAPI** or **proto** file describes the whole surface but never tells you which parts consumers rely on; a consumer-driven contract encodes exactly that. CDC shines in **internal microservice meshes** where you control both ends and the consumer set is known; it is impractical for a large **public** API with unknown consumers — there you fall back on versioning, deprecation headers, and usage analytics.',
            uk: 'Проактивна альтернатива «викоти й сподівайся» — це **consumer-driven contract testing** (канонічний інструмент — **Pact**). Кожен **консюмер** записує взаємодії, від яких реально залежить — запити, які шле, і форму відповіді, яка потрібна — як **контракт**; **провайдер** тоді **верифікує ці контракти у своєму CI**. Ламка зміна валить білд *провайдера* **до деплою**, а не рантайм *консюмера* після. Це інвертує звичне відношення специфікації: provider-driven **OpenAPI** чи **proto** описує всю поверхню, але ніколи не каже, від яких частин залежать консюмери; consumer-driven контракт кодує саме це. CDC сяє у **внутрішніх microservice-mesh-ах**, де ти контролюєш обидва кінці й набір консюмерів відомий; він непрактичний для великого **публічного** API з невідомими консюмерами — там ти вертаєшся до версіонування, deprecation-headers та usage-аналітики.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'The verdict', uk: 'Вердикт' },
          md: {
            en: 'Evolve **compatibly by default**: add optional, never remove in place, and be a tolerant reader — most changes need no version at all. Version **explicitly** only for true breaking changes (URI is the pragmatic public default, media-type the purest, header the middle), and treat each live version as a standing maintenance cost. In **contract-first** styles, drop version numbers and evolve the schema under compatibility rules with tooling in CI (GraphQL `@deprecated` + usage stats; protobuf new numbers + `reserved` + `buf`). When you must remove, **deprecate on a clock** with `Deprecation` + `Sunset` + `Link`, communicate to humans, and gate on measured usage. Inside a mesh, add **consumer-driven contract tests** so breakage fails CI, not production.',
            uk: 'Еволюціонуй **сумісно за замовчуванням**: додавай опційне, ніколи не прибирай на місці й будь терплячим читачем — більшість змін не потребує версії взагалі. Версіонуй **явно** лише для справжніх ламких змін (URI — прагматичний публічний дефолт, media-type — найчистіший, header — середина) і трактуй кожну живу версію як постійну ціну підтримки. У **contract-first** стилях прибери номери версій і еволюціонуй схему за правилами сумісності з тулінгом у CI (GraphQL `@deprecated` + usage stats; protobuf нові номери + `reserved` + `buf`). Коли мусиш прибрати, **deprecate за годинником** із `Deprecation` + `Sunset` + `Link`, комунікуй людям і гейти на виміряному використанні. Усередині mesh додай **consumer-driven contract-тести**, щоб злам валив CI, а не прод.',
          },
        },
      ],
    },
  ],
  keyPoints: [
    { en: 'A published API is a promise: additive/optional changes are safe; removing, renaming, retyping, or tightening is breaking. Compatibility is two-sided — the server adds carefully AND the client must be a tolerant reader.', uk: 'Опублікований API — це обіцянка: адитивні/опційні зміни безпечні; прибирання, перейменування, зміна типу чи посилення — ламкі. Сумісність двобічна — сервер додає обережно І клієнт має бути терплячим читачем.' },
    { en: 'Put an explicit version in the URI (visible, cacheable, pragmatic default), a header (clean URIs, caches vary on it), or the media type (HTTP-native, purest, complex). Pick one, apply it consistently, version the API as a whole.', uk: 'Клади явну версію в URI (видимо, кешовно, прагматичний дефолт), header (чисті URI, кеші vary по ньому) чи media type (HTTP-нативно, найчистіше, складно). Обери одне, застосовуй послідовно, версіонуй API як ціле.' },
    { en: 'Contract-first styles evolve without version numbers: GraphQL grows additively + @deprecated (remove at zero usage); protobuf adds new field NUMBERS and reserves removed ones — never reuse or change a number.', uk: 'Contract-first стилі еволюціонують без номерів версій: GraphQL росте адитивно + @deprecated (видаляй на нульовому використанні); protobuf додає нові НОМЕРИ полів і резервує прибрані — ніколи не переюзовуй і не змінюй номер.' },
    { en: 'Adding an enum value or response field is only safe if clients ignore what they don’t recognise — the tolerant-reader/robustness principle is what makes additive evolution non-breaking.', uk: 'Додати значення enum чи поле відповіді безпечно лише якщо клієнти ігнорують нерозпізнане — принцип терплячого читача/робастності і робить адитивну еволюцію не-ламкою.' },
    { en: 'Remove on a clock and in-band: Deprecation (RFC 9745, a date) + Sunset (RFC 8594, ≥ the Deprecation date) headers + a Link to docs, plus human comms and usage monitoring. Deprecation is communication, not deletion.', uk: 'Прибирай за годинником і in-band: Deprecation (RFC 9745, дата) + Sunset (RFC 8594, ≥ дати Deprecation) headers + Link на docs, плюс людська комунікація й моніторинг використання. Deprecation — це комунікація, а не видалення.' },
    { en: 'Consumer-driven contracts (Pact) make a breaking change fail the provider’s CI before deploy — ideal for internal meshes where the consumer set is known; public APIs lean on versioning + deprecation + analytics instead.', uk: 'Consumer-driven contracts (Pact) роблять так, що ламка зміна валить CI провайдера до деплою — ідеально для внутрішніх mesh-ів з відомим набором консюмерів; публічні API натомість спираються на версіонування + deprecation + аналітику.' },
  ],
  pitfalls: [
    {
      title: { en: 'Versioning too eagerly (or per-endpoint)', uk: 'Версіонувати надто охоче (чи per-endpoint)' },
      body: {
        en: 'Minting /v2 for a change that could have been an optional additive field forks the whole surface and doubles what you must run and test. Exhaust compatible evolution first, and version the API as a coherent whole — a swarm of independently versioned endpoints is a maintenance and discoverability nightmare.',
        uk: 'Викарбувати /v2 для зміни, яка могла б бути опційним адитивним полем, форкає всю поверхню й подвоює те, що треба запускати й тестувати. Спершу вичерпай сумісну еволюцію й версіонуй API як цілісне ціле — рій незалежно версіонованих endpoint-ів це кошмар підтримки й помітності.',
      },
    },
    {
      title: { en: 'Brittle clients that break on additive changes', uk: 'Крихкі клієнти, що ламаються на адитивних змінах' },
      body: {
        en: 'A client that rejects unknown fields, exhaustively switches on every enum value, or re-serialises responses it received will break when the server safely adds a field or enum member. Build tolerant readers: ignore unknowns, branch only on values you handle, and never round-trip data you don’t understand.',
        uk: 'Клієнт, що відкидає невідомі поля, вичерпно розгалужується на кожне значення enum чи ре-серіалізує отримані відповіді, зламається, коли сервер безпечно додасть поле чи член enum. Роби терплячих читачів: ігноруй невідоме, розгалужуйся лише на оброблювані значення й ніколи не round-trip-ай дані, яких не розумієш.',
      },
    },
    {
      title: { en: '“Deprecated” with no clock and no monitoring', uk: '«Deprecated» без годинника й моніторингу' },
      body: {
        en: 'A doc note or a Deprecation header with no Sunset date and no usage tracking means you can never safely remove anything — or you remove it and break silent consumers. Set a Sunset date, monitor per-field/endpoint usage, communicate to humans, and retire only when usage is at or near zero.',
        uk: 'Нотатка в docs чи header Deprecation без дати Sunset і без відстеження використання означає, що ти ніколи не зможеш безпечно щось прибрати — або прибереш і зламаєш тихих споживачів. Постав дату Sunset, моніторь per-field/endpoint використання, комунікуй людям і виводь з експлуатації, лише коли використання на нулі чи близько.',
      },
    },
  ],
  interview: [
    {
      q: {
        en: 'A widely-used public REST API needs a field to change from a string to a structured object. Walk your options and pick one.',
        uk: 'Широко використовуваному публічному REST API треба змінити поле зі string на структурований обʼєкт. Пройди варіанти й обери один.',
      },
      a: {
        en: 'Changing the field in place is a type change — instantly breaking for every client — so that is off the table. My first choice is the additive escape: add a NEW field, say customer_obj, alongside the existing customer string; populate both for a long transition; mark the old one deprecated in the docs and with a Deprecation header (plus a Link to the migration guide); monitor usage of the old field; and remove it only when usage reaches zero. No version bump, no forced migration, and tolerant-reader clients ignore the new field until they adopt it. I only reach for an explicit new version — pragmatically a URI /v2 for a public API — if the two shapes genuinely cannot coexist in one representation. Then I keep /v1 running, translate between v1 and v2 at the edge, publish Deprecation and Sunset headers on /v1 with a realistic window, and watch analytics to know when /v1 is safe to retire. The through-line is that every extra version is standing maintenance, so I spend a lot to avoid one: the additive path is almost always the right first move.',
        uk: 'Змінити поле на місці — це зміна типу, миттєво ламка для кожного клієнта, — тож це відпадає. Мій перший вибір — адитивний вихід: додати НОВЕ поле, скажімо customer_obj, поряд із наявним customer-string; заповнювати обидва протягом довгого переходу; позначити старе deprecated у docs і header-ом Deprecation (плюс Link на гайд міграції); моніторити використання старого поля; і прибрати його, лише коли використання сягне нуля. Без bump-у версії, без примусової міграції, а клієнти-терплячі-читачі ігнорують нове поле, доки не адаптують. До явної нової версії — прагматично URI /v2 для публічного API — я вдаюся, лише якщо дві форми справді не можуть співіснувати в одному представленні. Тоді я тримаю /v1 живим, транслюю між v1 і v2 на edge, публікую headers Deprecation і Sunset на /v1 з реалістичним вікном і стежу за аналітикою, щоб знати, коли /v1 безпечно вивести. Наскрізна теза: кожна зайва версія — це постійна підтримка, тож я багато вкладаю, щоб її уникнути: адитивний шлях майже завжди правильний перший крок.',
      },
      level: 'senior',
    },
    {
      q: {
        en: 'Your team keeps breaking downstream services with “small” changes. How do you make evolution safe systemically, not case by case?',
        uk: 'Твоя команда постійно ламає downstream-сервіси «дрібними» змінами. Як зробити еволюцію безпечною системно, а не case-by-case?',
      },
      a: {
        en: 'The fix is to turn compatibility from tribal knowledge into an automated build gate. Start with a shared, written definition of breaking vs non-breaking so reviews stop arguing about it. Then enforce it in CI. For contract-first surfaces, add breaking-change detection — buf for protobuf, schema checks plus field-usage stats for GraphQL — so a breaking diff fails the pipeline, not a client. For REST between our own services, adopt consumer-driven contract tests with Pact: each consumer publishes the interactions it depends on, and the provider verifies them in CI, so a breaking change fails the provider’s build before it ships. Require tolerant-reader behaviour on clients so additive changes stay invisible. And make removal a process: nothing gets deleted without a Deprecation and Sunset header, a migration link, a real window, and usage monitoring that has to hit near-zero first. The point is that none of this relies on a person remembering — the pipeline refuses to ship a break, and removals are gated on measured usage.',
        uk: 'Фікс — перетворити сумісність із племінного знання на автоматичний build-gate. Почни зі спільного, записаного визначення ламке-vs-не-ламке, щоб рев’ю перестали про це сперечатися. Тоді примусь це в CI. Для contract-first поверхонь додай breaking-change detection — buf для protobuf, schema checks плюс field-usage stats для GraphQL — щоб ламкий diff валив пайплайн, а не клієнта. Для REST між власними сервісами візьми consumer-driven contract-тести з Pact: кожен консюмер публікує взаємодії, від яких залежить, а провайдер верифікує їх у CI, тож ламка зміна валить білд провайдера до випуску. Вимагай поведінки терплячого читача на клієнтах, щоб адитивні зміни лишалися невидимими. І зроби видалення процесом: ніщо не видаляється без header-ів Deprecation і Sunset, лінку міграції, реального вікна й моніторингу використання, що має спершу впасти до близько-нуля. Суть у тому, що ніщо з цього не покладається на памʼять людини — пайплайн відмовляється випустити злам, а видалення гейтяться на виміряному використанні.',
      },
      level: 'staff',
    },
  ],
  seeAlso: ['m5-rest', 'm9-graphql', 'm10-grpc', 'm19-errors-status', 'm23-observability'],
  sources: [
    { title: 'RFC 9745 — The Deprecation HTTP Response Header Field', url: 'https://www.rfc-editor.org/rfc/rfc9745.html' },
    { title: 'RFC 8594 — The Sunset HTTP Header Field', url: 'https://www.rfc-editor.org/rfc/rfc8594.html' },
    { title: 'Protocol Buffers — Language Guide (proto3): field numbers & reserved', url: 'https://protobuf.dev/programming-guides/proto3/' },
    { title: 'GraphQL — Best Practices: Versioning & the @deprecated directive', url: 'https://graphql.org/learn/best-practices/#versioning' },
    { title: 'Pact — Consumer-Driven Contract Testing', url: 'https://docs.pact.io/' },
    { title: 'Buf — Breaking change detection for Protobuf', url: 'https://buf.build/docs/breaking/overview/' },
    { title: 'Zalando RESTful API Guidelines — Compatibility & Deprecation', url: 'https://opensource.zalando.com/restful-api-guidelines/#compatibility' },
  ],
};
