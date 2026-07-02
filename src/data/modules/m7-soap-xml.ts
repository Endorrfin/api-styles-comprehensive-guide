import type { Module } from '../types';

/*
 * m7-soap-xml — the contract-heavy enterprise elder (s1, Request/Response over HTTP). Right-sized:
 * no sim; figure 'soap-envelope' (Envelope → Header (WS-*) → Body/Fault). Six curriculum topics:
 * envelope structure (figure) → WSDL → WS-Security & WS-* → rpc vs document style → SOAP vs REST →
 * where SOAP survives + verdict. Facts web-verified S10a: SOAP 1.2 is a W3C Recommendation (Second
 * Edition, 2007); WSDL 1.1 (2001 W3C Note) remains the de-facto description format — WSDL 2.0 (2007
 * Rec) never displaced it; WS-Security (OASIS) provides message-level signing/encryption/tokens;
 * SOAP still runs core flows in banking, government, healthcare and ERP (SAP, Salesforce, NetSuite).
 */
export const m7: Module = {
  id: 'm7-soap-xml',
  num: 7,
  section: 's1-req-resp-http',
  order: 3,
  level: 'senior',
  title: { en: 'SOAP / XML Web Services', uk: 'SOAP / XML Web Services' },
  tagline: { en: 'The contract-heavy enterprise elder.', uk: 'Контрактно-важкий корпоративний старійшина.' },
  readMins: 13,
  mentalModel: {
    en: 'SOAP is a **message in an envelope**, not a resource at a URL: every call is an XML **Envelope** (Header for machine-processed concerns like security and addressing, Body for the payload) described by a **WSDL contract** precise enough to generate client code — with an extension stack (**WS-Security, WS-ReliableMessaging…**) that solves enterprise problems *inside the message*, independent of transport. Verbose and rigid by today’s taste, it still runs the money.',
    uk: 'SOAP — це **повідомлення в конверті**, а не ресурс за URL: кожен виклик — XML-**Envelope** (Header для машинно-оброблюваних аспектів на кшталт безпеки й адресації, Body для payload), описаний **WSDL-контрактом**, достатньо точним для генерації клієнтського коду, — з розширювальним стеком (**WS-Security, WS-ReliableMessaging…**), що розвʼязує enterprise-проблеми *всередині повідомлення*, незалежно від транспорту. Багатослівний і жорсткий на сьогоднішній смак — але гроші досі ганяє він.',
  },
  topics: [
    // ── T1 · Envelope structure (figure) ──────────────────────────────────────
    {
      id: 'envelope-structure',
      title: { en: 'The envelope: Header, Body, Fault', uk: 'Конверт: Header, Body, Fault' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Every SOAP message — request or response — is one XML document: an **`Envelope`** containing an optional **`Header`** and a mandatory **`Body`**. The split is the design idea. The *Body* carries the business payload (the operation’s parameters or result). The *Header* carries **orthogonal, machine-processed concerns** — security tokens and signatures, transaction ids, addressing, routing — which intermediaries may inspect and process without touching the Body. Errors come back as a structured **`Fault`** element inside the Body (code, reason, detail), not as an HTTP status convention. That’s why SOAP calls itself **transport-independent**: the envelope is self-contained, and HTTP POST is merely its most common courier (SMTP and JMS carried it too in the enterprise era).',
            uk: 'Кожне SOAP-повідомлення — запит чи відповідь — це один XML-документ: **`Envelope`** з опційним **`Header`** і обовʼязковим **`Body`**. Саме цей поділ — дизайн-ідея. *Body* несе бізнес-payload (параметри чи результат операції). *Header* несе **ортогональні, машинно-оброблювані аспекти** — security-токени й підписи, id транзакцій, адресацію, маршрутизацію — і проміжні вузли можуть їх читати й обробляти, не торкаючись Body. Помилки повертаються структурованим елементом **`Fault`** усередині Body (code, reason, detail), а не конвенцією HTTP-статусів. Тому SOAP зве себе **транспортно-незалежним**: конверт самодостатній, а HTTP POST — лише його найтиповіший курʼєр (в enterprise-еру його возили й SMTP та JMS).',
          },
        },
        {
          kind: 'figure',
          fig: 'soap-envelope',
          caption: {
            en: 'The envelope: a Header for machine-processed concerns (WS-Security signature, addressing, transaction), a Body for the operation payload — or a structured Fault when the call fails.',
            uk: 'Конверт: Header для машинно-оброблюваних аспектів (підпис WS-Security, адресація, транзакція), Body для payload операції — або структурований Fault, коли виклик падає.',
          },
        },
        {
          kind: 'code',
          lang: 'xml',
          code: `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
               xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
  <soap:Header>
    <wsse:Security><!-- signature · timestamp · token (T3) --></wsse:Security>
  </soap:Header>
  <soap:Body>
    <pay:TransferFunds xmlns:pay="urn:bank:payments">
      <pay:fromIban>UA90...3335</pay:fromIban>
      <pay:toIban>DE89...0130</pay:toIban>
      <pay:amount currency="EUR">250.00</pay:amount>
    </pay:TransferFunds>
  </soap:Body>
</soap:Envelope>`,
          note: {
            en: 'SOAP 1.2 (the W3C Recommendation, Second Edition 2007) — note the namespaces everywhere: verbose, but unambiguous and schema-validatable, which is the entire point.',
            uk: 'SOAP 1.2 (W3C Recommendation, Second Edition 2007) — зауваж повсюдні namespaces: багатослівно, зате однозначно й валідовано схемою, у чому й сенс.',
          },
        },
      ],
    },
    // ── T2 · WSDL ─────────────────────────────────────────────────────────────
    {
      id: 'wsdl',
      title: { en: 'WSDL: the contract that generates code', uk: 'WSDL: контракт, що генерує код' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'A **WSDL** document is the machine-readable contract: the **types** (XML Schema — with real constraints: patterns, ranges, enumerations), the **messages** and **operations** (portType/interface), the **binding** (how they map onto SOAP over HTTP) and the **endpoint address**. From one WSDL, tooling generates a fully typed client or server skeleton (`wsimport`, `svcutil`, `wsdl2java`) — contract-first development a decade before OpenAPI, protobuf (m10) or GraphQL SDL (m9) reinvented it. The version reality check: **WSDL 1.1 (a 2001 W3C Note) is still the de-facto format**; WSDL 2.0 became a W3C Recommendation in 2007 and simply never displaced it — expect 1.1 everywhere in the wild.',
            uk: 'Документ **WSDL** — машиночитний контракт: **types** (XML Schema — зі справжніми обмеженнями: патерни, діапазони, enumerations), **messages** та **operations** (portType/interface), **binding** (як вони мапляться на SOAP over HTTP) і **адреса endpoint-а**. З одного WSDL тулінг генерує повністю типізований клієнт чи серверний скелет (`wsimport`, `svcutil`, `wsdl2java`) — contract-first розробка за декаду до того, як OpenAPI, protobuf (m10) чи GraphQL SDL (m9) перевинайшли її. Перевірка версійної реальності: **WSDL 1.1 (W3C Note 2001 року) — досі де-факто формат**; WSDL 2.0 став W3C Recommendation у 2007 і просто ніколи його не витіснив — у дикій природі чекай 1.1.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'XML Schema is the strictest contract in this guide', uk: 'XML Schema — найсуворіший контракт у цьому гіді' },
          md: {
            en: 'An XSD can say “an IBAN matching this regex, an amount with exactly 2 decimal places between 0.01 and 1,000,000”. Validation happens at the boundary, in generated code, before your logic runs. That rigidity is why regulated industries stayed: the contract *is* the compliance artifact — and why every change needs a new contract version rolled out to every consumer.',
            uk: 'XSD вміє сказати: «IBAN за цим regex, сума рівно з 2 знаками після коми від 0.01 до 1 000 000». Валідація стається на межі, у згенерованому коді, до твоєї логіки. Ця жорсткість — причина, чому регульовані індустрії лишилися: контракт *і є* артефактом комплаєнсу, — і причина, чому кожна зміна вимагає нової версії контракту, розкоченої на кожного споживача.',
          },
        },
      ],
    },
    // ── T3 · WS-Security & the WS-* stack ─────────────────────────────────────
    {
      id: 'ws-security-ws-star',
      title: { en: 'WS-Security & the WS-* stack', uk: 'WS-Security і стек WS-*' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The Header slot spawned a whole standards stack. **WS-Security** (OASIS) is the one that still matters: **message-level security** — XML Signature and XML Encryption applied to *parts of the envelope*, plus token profiles (username, X.509 certificates, SAML assertions) carried in the header. Contrast with TLS (m3): TLS protects the *pipe* hop-by-hop and its guarantees end at each terminator, while a signed envelope stays signed **at rest and across intermediaries** — an auditor can verify *this exact message* was authorized years later (non-repudiation). Around it: WS-Addressing (routing metadata), WS-ReliableMessaging (delivery guarantees), WS-Policy (declaring which of these an endpoint requires), WS-AtomicTransaction. The stack’s depth is real power and the origin of the “WS-deathstar” complexity reputation — interop pain across vendor toolkits is what the **WS-I Basic Profile** existed to tame.',
            uk: 'Слот Header породив цілий стек стандартів. **WS-Security** (OASIS) — той, що досі важить: **безпека рівня повідомлення** — XML Signature та XML Encryption, застосовані до *частин конверта*, плюс профілі токенів (username, сертифікати X.509, SAML assertions) у header-і. Контраст із TLS (m3): TLS захищає *трубу* hop-by-hop, і його гарантії закінчуються на кожному термінаторі, а підписаний конверт лишається підписаним **у спокої та крізь проміжні вузли** — аудитор може перевірити, що *саме це повідомлення* було авторизоване, і роки потому (non-repudiation). Довкола: WS-Addressing (метадані маршрутизації), WS-ReliableMessaging (гарантії доставки), WS-Policy (декларація, чого endpoint вимагає), WS-AtomicTransaction. Глибина стека — справжня сила і джерело репутації «WS-зірки смерті»; біль інтеропу між вендорськими тулкітами приборкував саме **WS-I Basic Profile**.',
          },
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'Message-level vs transport-level security', uk: 'Безпека рівня повідомлення проти рівня транспорту' },
          md: {
            en: 'If a payment order crosses three intermediaries, TLS gives you three secure hops with three points where the plaintext exists and trust resets. A WS-Security-signed envelope carries its own proof end-to-end: any hop can route it, none can alter it undetected. That property — signatures that survive storage and forwarding — is what modern webhook HMACs (m15) and JWS tokens re-created in JSON. When you meet SOAP in banking, this is why it’s still there.',
            uk: 'Якщо платіжне доручення проходить три проміжні вузли, TLS дає три захищені стрибки з трьома точками, де існує plaintext і скидається довіра. Конверт, підписаний WS-Security, несе власний доказ end-to-end: будь-який вузол може його маршрутизувати, жоден не може непомітно змінити. Ця властивість — підписи, що переживають зберігання й пересилання, — саме те, що вебхукові HMAC (m15) і JWS-токени перевідтворили в JSON. Коли зустрінеш SOAP у банкінгу — він там досі саме через це.',
          },
        },
      ],
    },
    // ── T4 · RPC vs document style ────────────────────────────────────────────
    {
      id: 'rpc-vs-document-style',
      title: { en: 'RPC style vs document style', uk: 'RPC-стиль проти document-стилю' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Two philosophies fit in one envelope. **RPC style** models the Body as a *function call* — an element named after the operation wrapping the parameters. **Document style** models it as a *standalone XML document* that happens to be sent somewhere — validated by its own schema, meaningful outside the call. The industry converged on a hybrid: **document/literal wrapped** — technically a document, shaped like a call — because it keeps full schema validation while staying tooling-friendly, and because WS-I Basic Profile pushed the older `rpc/encoded` out of interop. The distinction survives SOAP itself: “is this message a *command to execute* or a *fact being conveyed*?” is the same question event-driven designs ask (m16).',
            uk: 'В один конверт вміщаються дві філософії. **RPC-стиль** моделює Body як *виклик функції* — елемент, названий за операцією, обгортає параметри. **Document-стиль** — як *самостійний XML-документ*, який просто кудись надіслали: він валідується власною схемою і має сенс поза викликом. Індустрія зійшлася на гібриді — **document/literal wrapped**: технічно документ, за формою виклик, — бо він зберігає повну валідацію схемою, лишаючись зручним для тулінгу, а WS-I Basic Profile виштовхнув старіший `rpc/encoded` з інтеропу. Розрізнення пережило сам SOAP: «це повідомлення — *команда до виконання* чи *факт, що передається*?» — те саме питання ставлять event-driven дизайни (m16).',
          },
        },
      ],
    },
    // ── T5 · SOAP vs REST ─────────────────────────────────────────────────────
    {
      id: 'soap-vs-rest',
      title: { en: 'SOAP vs REST: what actually differs', uk: 'SOAP проти REST: що різниться насправді' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The classic debate, minus the tribalism: they disagree on **where the semantics live**. REST (m5) pushes semantics into HTTP itself — methods, status codes, caching, URLs as resource identities; the web’s infrastructure understands your API. SOAP treats HTTP as a dumb courier — everything meaningful lives *inside the envelope*, so proxies and caches see only `POST /service` with `200 OK`, but the message gains transport independence, schema rigor, and header-borne extensions (T3). Practically: REST wins on simplicity, cacheability, browser/mobile friendliness, and ecosystem defaults; SOAP wins where you need *contract strictness + message-level security + vendor-neutral codegen* — and where the counterparty’s integration guide simply says “here is our WSDL”.',
            uk: 'Класична суперечка, мінус трайбалізм: вони розходяться в тому, **де живе семантика**. REST (m5) вштовхує семантику в сам HTTP — методи, статус-коди, кешування, URL як ідентичності ресурсів; інфраструктура вебу розуміє твій API. SOAP трактує HTTP як тупого курʼєра — усе значуще живе *всередині конверта*, тож proxy й кеші бачать лише `POST /service` із `200 OK`, зате повідомлення отримує транспортну незалежність, суворість схеми та розширення в header-і (T3). Практично: REST виграє простотою, кешованістю, дружністю до браузерів/мобайлу та дефолтами екосистеми; SOAP виграє там, де потрібні *суворість контракту + безпека рівня повідомлення + вендор-нейтральний codegen* — і де інтеграційний гайд контрагента просто каже «ось наш WSDL».',
          },
        },
        {
          kind: 'compare',
          a: { en: 'SOAP', uk: 'SOAP' },
          b: { en: 'REST', uk: 'REST' },
          rows: [
            [
              { en: 'Semantics live in', uk: 'Семантика живе в' },
              { en: 'The envelope (Header/Body/Fault)', uk: 'Конверті (Header/Body/Fault)' },
              { en: 'HTTP itself (methods, statuses, URLs)', uk: 'Самому HTTP (методи, статуси, URL-и)' },
            ],
            [
              { en: 'Contract', uk: 'Контракт' },
              { en: 'WSDL + XML Schema — strict, codegen-first', uk: 'WSDL + XML Schema — суворий, codegen-first' },
              { en: 'OpenAPI — descriptive, looser by default', uk: 'OpenAPI — описовий, за замовчуванням мʼякший' },
            ],
            [
              { en: 'Security', uk: 'Безпека' },
              { en: 'Message-level (WS-Security) + TLS', uk: 'Рівня повідомлення (WS-Security) + TLS' },
              { en: 'Transport-level (TLS) + tokens', uk: 'Рівня транспорту (TLS) + токени' },
            ],
            [
              { en: 'HTTP caching', uk: 'HTTP-кешування' },
              { en: 'None — everything is POST', uk: 'Немає — все POST' },
              { en: 'First-class (GET, ETags, m5)', uk: 'Першокласне (GET, ETags, m5)' },
            ],
            [
              { en: 'Payload', uk: 'Payload' },
              { en: 'XML only, namespaced, verbose', uk: 'Лише XML, з namespaces, багатослівний' },
              { en: 'JSON by default, negotiable (m4)', uk: 'JSON за замовчуванням, узгоджуваний (m4)' },
            ],
          ],
        },
      ],
    },
    // ── T6 · Where SOAP survives + the verdict ────────────────────────────────
    {
      id: 'where-soap-survives',
      title: { en: 'Where SOAP survives', uk: 'Де SOAP виживає' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'SOAP is not a museum piece — it processes real money daily. It persists where its properties are requirements: **banking and payments** (message-level signatures, non-repudiation, audit); **government and healthcare** exchanges (long-lived formal contracts, compliance); **ERP and enterprise platforms** — SAP’s integration surface, Salesforce’s SOAP API, Oracle NetSuite — where thousands of existing integrations make the WSDL the stable ABI; **airlines and telecom** back-office flows. The engineering posture for the 2020s: you’ll rarely *choose* SOAP for a new public API, but you **will integrate against it** — so know how to read a WSDL, generate a client, put the right WS-Security profile on the wire, and wrap the whole thing behind a facade (m23) so the rest of your system stays in its native style.',
            uk: 'SOAP — не музейний експонат: він щодня проводить реальні гроші. Він тримається там, де його властивості — вимоги: **банкінг і платежі** (підписи рівня повідомлення, non-repudiation, аудит); обміни **держсектору й охорони здоровʼя** (довговічні формальні контракти, комплаєнс); **ERP та enterprise-платформи** — інтеграційна поверхня SAP, SOAP API Salesforce, Oracle NetSuite — де тисячі наявних інтеграцій роблять WSDL стабільним ABI; back-office потоки **авіаліній і телекому**. Інженерна постава для 2020-х: новий публічний API на SOAP ти навряд *обереш*, але **інтегруватися з ним доведеться** — тож умій читати WSDL, генерувати клієнт, класти правильний профіль WS-Security на дріт і загортати все за фасад (m23), щоб решта системи жила у своєму стилі.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'The verdict', uk: 'Вердикт' },
          md: {
            en: 'Choose SOAP when the counterparty or the regulator effectively chooses it for you: formal WSDL contracts, WS-Security message-level guarantees, enterprise ecosystems that already speak it. Avoid it for new public/product APIs — REST (m5) or gRPC (m10) deliver the same request/response with far less ceremony. When you inherit it, don’t fight it: generate clients from the WSDL, validate against the XSD, isolate it behind an adapter, and let it do what it has done reliably for twenty years.',
            uk: 'Обирай SOAP, коли контрагент чи регулятор фактично обирає його за тебе: формальні WSDL-контракти, гарантії рівня повідомлення від WS-Security, enterprise-екосистеми, що вже ним говорять. Уникай його для нових публічних/продуктових API — REST (m5) чи gRPC (m10) дають той самий request/response із значно меншими церемоніями. Успадкувавши — не воюй: генеруй клієнти з WSDL, валідуй проти XSD, ізолюй за адаптером і дай йому робити те, що він надійно робить уже двадцять років.',
          },
        },
      ],
    },
  ],
  keyPoints: [
    { en: 'A SOAP message is an XML Envelope: an optional Header for machine-processed concerns (security, addressing), a mandatory Body for the payload, structured Faults for errors.', uk: 'SOAP-повідомлення — XML-Envelope: опційний Header для машинно-оброблюваних аспектів (безпека, адресація), обовʼязковий Body для payload, структуровані Faults для помилок.' },
    { en: 'WSDL + XML Schema form a strict, codegen-first contract — contract-first development long before OpenAPI/protobuf; WSDL 1.1 remains the de-facto format (2.0 never took).', uk: 'WSDL + XML Schema — суворий, codegen-first контракт: contract-first розробка задовго до OpenAPI/protobuf; WSDL 1.1 — досі де-факто формат (2.0 не прижився).' },
    { en: 'WS-Security gives message-level signing/encryption and token profiles: the proof travels inside the envelope, survives intermediaries and storage — non-repudiation TLS cannot give.', uk: 'WS-Security дає підписи/шифрування рівня повідомлення й профілі токенів: доказ їде всередині конверта, переживає проміжні вузли та зберігання — non-repudiation, якого TLS не дасть.' },
    { en: 'Document/literal (wrapped) won over rpc/encoded — schema-validated documents shaped like calls, standardized for interop by the WS-I Basic Profile.', uk: 'Document/literal (wrapped) переміг rpc/encoded — валідовані схемою документи у формі викликів, стандартизовані для інтеропу WS-I Basic Profile.' },
    { en: 'SOAP treats HTTP as a courier (everything is POST — no HTTP caching); REST puts semantics in HTTP itself. That single difference explains most of the practical trade-offs.', uk: 'SOAP трактує HTTP як курʼєра (все — POST, жодного HTTP-кешування); REST кладе семантику в сам HTTP. Ця єдина різниця пояснює більшість практичних trade-off-ів.' },
    { en: 'It survives where its rigor is a requirement — banking, government, healthcare, ERP (SAP/Salesforce/NetSuite). You integrate against it via codegen and isolate it behind a facade.', uk: 'Він виживає там, де його суворість — вимога: банкінг, держсектор, охорона здоровʼя, ERP (SAP/Salesforce/NetSuite). Інтегруєшся через codegen та ізолюєш за фасадом.' },
  ],
  pitfalls: [
    {
      title: { en: 'Hand-writing envelopes instead of generating from the WSDL', uk: 'Писати конверти руками замість генерації з WSDL' },
      body: {
        en: 'Hand-rolled XML against a namespaced, schema-validated contract is a bug factory: one wrong namespace or element order and the counterparty rejects the message. Always generate the client from the WSDL and let the toolchain own serialization and validation.',
        uk: 'Ручний XML проти контракту з namespaces і валідацією схемою — фабрика багів: один хибний namespace чи порядок елементів — і контрагент відхиляє повідомлення. Завжди генеруй клієнт із WSDL і віддай серіалізацію та валідацію тулчейну.',
      },
    },
    {
      title: { en: 'Treating TLS as a substitute for WS-Security', uk: 'Вважати TLS заміною WS-Security' },
      body: {
        en: 'If the integration contract demands signed messages, TLS alone fails the requirement: its protection ends at every terminator, leaves no verifiable artifact, and gives no non-repudiation. Match the counterparty’s WS-Security policy exactly — signature, timestamp, token profile.',
        uk: 'Якщо інтеграційний контракт вимагає підписаних повідомлень, самого TLS замало: його захист закінчується на кожному термінаторі, не лишає перевірного артефакту й не дає non-repudiation. Точно відтвори WS-Security-політику контрагента — підпис, timestamp, профіль токена.',
      },
    },
    {
      title: { en: 'XML parser defaults: XXE and friends', uk: 'Дефолти XML-парсера: XXE і компанія' },
      body: {
        en: 'Accepting SOAP means accepting XML from the network: external entity expansion (XXE), entity-bomb DoS, and schema-poisoning are real (m22). Disable DTDs and external entities in every parser that touches inbound envelopes — the classic enterprise breach enters exactly here.',
        uk: 'Приймати SOAP означає приймати XML з мережі: розгортання зовнішніх entity (XXE), DoS entity-бомбами й отруєння схем — реальні загрози (m22). Вимкни DTD та зовнішні entity в кожному парсері, що торкається вхідних конвертів, — класичний enterprise-злам заходить саме тут.',
      },
    },
  ],
  interview: [
    {
      q: { en: 'Your fintech must integrate with a bank that only offers SOAP with WS-Security. How do you approach it?', uk: 'Твій фінтех має інтегруватися з банком, що пропонує лише SOAP із WS-Security. Як підійдеш?' },
      a: {
        en: 'Contract-first, tooling-first. Take their WSDL and XSDs and generate a typed client (wsimport/svcutil or the stack’s equivalent) — never hand-write envelopes against a namespaced schema. Read their WS-Security policy precisely: which parts are signed, X.509 or SAML token profile, timestamp requirements — and configure the toolkit’s security handler to match; test signature verification against their sandbox early, because interop details (canonicalization, key references) are where weeks disappear. Harden the XML boundary: DTDs and external entities off (XXE), size limits, schema validation on. Architecturally, wrap the whole integration behind an internal facade/adapter (an anti-corruption layer): my domain speaks our native style — REST or gRPC — and one adapter owns envelopes, faults-to-errors mapping (their Fault codes into our RFC 9457 problem details, m19), retries and idempotency semantics. Operationally: log the signed envelopes as compliance artifacts (that is non-repudiation working for us), monitor their WSDL for versioned changes, and pin contract versions explicitly — an enterprise counterparty will version formally, and my codegen should rerun per contract release, not against a live URL.',
        uk: 'Contract-first, tooling-first. Беру їхній WSDL і XSD-и та генерую типізований клієнт (wsimport/svcutil чи еквівалент стека) — жодного ручного XML проти схеми з namespaces. Точно читаю їхню WS-Security-політику: які частини підписуються, профіль токена X.509 чи SAML, вимоги до timestamp — і налаштовую security-handler тулкіта відповідно; перевірку підписів ганяю проти їхньої пісочниці якомога раніше, бо саме в деталях інтеропу (канонікалізація, посилання на ключі) зникають тижні. Гартую XML-межу: DTD й зовнішні entity вимкнені (XXE), ліміти розміру, валідація схемою увімкнена. Архітектурно — загортаю інтеграцію за внутрішній фасад/адаптер (anti-corruption layer): мій домен говорить нашим рідним стилем — REST чи gRPC, — а один адаптер володіє конвертами, мапінгом Fault→помилки (їхні Fault-коди в наші problem details за RFC 9457, m19), retries та семантикою ідемпотентності. Операційно: логую підписані конверти як артефакти комплаєнсу (це non-repudiation працює на нас), стежу за версіями їхнього WSDL і пінюю версії контракту явно — enterprise-контрагент версіонує формально, і мій codegen має перезапускатися на реліз контракту, а не проти живого URL.',
      },
      level: 'senior',
    },
  ],
  seeAlso: ['m5-rest', 'm4-data-formats', 'm10-grpc', 'm22-security-threats', 'm19-errors-status', 'm23-observability'],
  sources: [
    { title: 'W3C — SOAP Version 1.2 Part 1: Messaging Framework (Second Edition)', url: 'https://www.w3.org/TR/soap12-part1/' },
    { title: 'W3C — Web Services Description Language (WSDL) 1.1', url: 'https://www.w3.org/TR/wsdl' },
    { title: 'OASIS — Web Services Security: SOAP Message Security 1.1 (WS-Security)', url: 'https://docs.oasis-open.org/wss/v1.1/wss-v1.1-spec-os-SOAPMessageSecurity.pdf' },
    { title: 'W3C — Web Services Addressing 1.0 — Core', url: 'https://www.w3.org/TR/ws-addr-core/' },
    { title: 'Salesforce — SOAP API Developer Guide (a living large-scale SOAP API)', url: 'https://developer.salesforce.com/docs/atlas.en-us.api.meta/api/sforce_api_quickstart_intro.htm' },
    { title: 'OWASP — XML External Entity (XXE) Prevention Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html' },
  ],
};
