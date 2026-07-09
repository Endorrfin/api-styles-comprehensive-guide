import type { Module } from '../types';

/*
 * m22-security-threats — Security & threat models (s4-cross-cutting, order 6). The module that treats
 * every input as hostile and every hop as untrusted. Figure `trust-boundaries` (the untrusted→edge→
 * trusted zones, and which threat crosses which line). Eight curriculum topics: injection → ssrf →
 * cors → csrf → dos-complexity-attacks → deserialization → tls-everywhere → secrets-and-replay
 * (verdict). Level: staff.
 *
 * SCOPE BOUNDARY (avoid overlap): authn/authz — BOLA/BFLA, OAuth, JWT, mTLS mechanics — is m17's
 * turf; this module is the OTHER half of the OWASP API Top 10: the input/transport/DoS threats.
 * Cross-refs point back rather than re-teach: GraphQL depth (m9), XXE/entity-expansion (m7), webhook
 * signatures + timestamp windows (m15), replay vs legitimate duplicate (m21), gateway TLS termination
 * (m23).
 *
 * Facts web-verified S12b (2026-07):
 *  - OWASP API Security Top 10 — 2023 edition is current (released 2023-07, replaced 2019). SSRF is a
 *    named entry API7:2023; Unrestricted Resource Consumption = API4:2023.
 *  - Cloud instance-metadata endpoint (IMDS) = link-local 169.254.169.254; AWS IMDSv2 requires a
 *    session token (PUT) to blunt SSRF. Capital One 2019 breach = SSRF → IMDS credentials (documented).
 *  - CORS = a controlled relaxation of the browser Same-Origin Policy (Fetch standard), enforced by the
 *    browser only; reflecting Origin + Access-Control-Allow-Credentials: true is the classic misconfig.
 *  - SameSite=Lax is the default for unspecified cookies in Chromium (Chrome 80, 2020-02); Chrome keeps
 *    a ~120 s window where it does NOT enforce Lax on top-level POST for cookies set WITHOUT SameSite;
 *    Firefox/Safari do NOT default to Lax. SameSite is defense-in-depth, not a complete CSRF defense.
 *  - HTTP/2 Rapid Reset = CVE-2023-44487 (disclosed 2023-10-10); record volumes ~398M rps (Google),
 *    ~201M rps (Cloudflare), ~155M rps (AWS). Stream open + immediate RST_STREAM, cheap for the client.
 *  - TLS: BCP 195 = RFC 9325 (2022-11, obsoletes RFC 7525): support TLS 1.3 and prefer it; TLS 1.2 is
 *    the floor when configured against known attacks; SSL/early TLS deprecated.
 */
export const m22: Module = {
  id: 'm22-security-threats',
  num: 22,
  section: 's4-cross-cutting',
  order: 6,
  level: 'staff',
  title: { en: 'Security & threat models', uk: 'Безпека та моделі загроз' },
  tagline: {
    en: 'Injection, SSRF, CORS/CSRF, DoS, deserialization.',
    uk: 'Injection, SSRF, CORS/CSRF, DoS, deserialization.',
  },
  readMins: 18,
  mentalModel: {
    en: '**Every input is hostile until proven otherwise, and every hop is untrusted until it is authenticated.** Security at an API boundary is two disciplines wearing one badge. The first is a *data* discipline: everything that crosses the boundary — a query string, a JSON body, a header, a URL you are asked to fetch, a blob you are asked to deserialize — is untrusted **data**, never trusted **code**, and the whole catalogue of injection, SSRF, and deserialization bugs is what happens when that line blurs and data gets to *act*. The second is a *trust* discipline: the network is not a security boundary (a foothold inside the perimeter must buy nothing), credentials the browser attaches automatically are ambient authority an attacker can borrow (CSRF), and the browser controls that guard cross-origin reads (CORS) protect the *user*, not your server. Two questions carry the module: **"where is my trust boundary?"** and **"what am I letting cross it?"** Authentication and authorization — who the caller is and what they may touch — is the other half of the story, and it lives in m17; this module is everything else the OWASP API Top 10 warns about.',
    uk: '**Кожен вхід ворожий, доки не доведено інше, і кожен хоп недовірений, доки не автентифікований.** Безпека на межі API — це дві дисципліни під одним значком. Перша — дисципліна *даних*: усе, що перетинає межу — query string, JSON-тіло, заголовок, URL, який тебе просять зафетчити, blob, який просять десеріалізувати, — це недовірені **дані**, ніколи не довірений **код**, і весь каталог injection, SSRF і deserialization-багів — це те, що стається, коли ця межа розмивається і дані отримують право *діяти*. Друга — дисципліна *довіри*: мережа не є межею безпеки (плацдарм усередині периметра має не купувати нічого), креденшели, які браузер чіпляє автоматично, — це ambient authority, яку атакер може позичити (CSRF), а браузерні контролі, що стережуть cross-origin читання (CORS), захищають *користувача*, а не твій сервер. Два питання несуть модуль: **«де моя межа довіри?»** і **«що я пускаю крізь неї?»** Автентифікація й авторизація — хто викликач і що йому можна чіпати — це інша половина історії, і вона в m17; цей модуль — усе решта, про що попереджає OWASP API Top 10.',
  },
  topics: [
    // ── T1 · Injection ────────────────────────────────────────────────────────
    {
      id: 'injection',
      title: { en: 'Injection', uk: 'Injection' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Injection is the oldest bug on the list and always the same shape: **untrusted data is spliced into a string that an interpreter then executes** — SQL, a shell command, an LDAP filter, a NoSQL query, an XML document (XXE — m7), an HTML page (XSS). The interpreter cannot tell your intended query from the attacker\'s appended clause because *by the time it parses, they are one string*. Every API style is a delivery vehicle: a REST query parameter, a GraphQL argument, a gRPC field, a JSON-RPC param — all are attacker-controlled input the moment they leave the client. The fix is never "escape harder" (a blocklist you will lose) and never client-side validation (the attacker skips your client entirely). It is **structural separation of code from data**: parameterized queries / prepared statements so the SQL text and the values travel in *different channels* and the values can never be reparsed as syntax; safe APIs instead of shells (`execFile` with an argv array, not `exec` with a concatenated line); and **allowlist** validation at the boundary — assert the shape you expect (this is an integer, this matches this enum) and reject everything else. Escaping is the last resort for the rare context that has no parameterized API, not the first line of defence.',
            uk: 'Injection — найстаріший баг у списку і завжди тієї самої форми: **недовірені дані вклеюються в рядок, який інтерпретатор потім виконує** — SQL, shell-команда, LDAP-фільтр, NoSQL-запит, XML-документ (XXE — m7), HTML-сторінка (XSS). Інтерпретатор не відрізнить твій задуманий запит від дописаного атакером речення, бо *на момент парсингу вони — один рядок*. Кожен стиль API — це транспорт: REST query-параметр, GraphQL-аргумент, gRPC-поле, JSON-RPC param — усе це підконтрольний атакеру вхід тієї ж миті, коли він покидає клієнта. Фікс — ніколи не «екрануй сильніше» (блоклист, який ти програєш) і ніколи не клієнтська валідація (атакер оминає твій клієнт узагалі). Це **структурне відокремлення коду від даних**: параметризовані запити / prepared statements, щоб текст SQL і значення їхали *різними каналами* і значення ніколи не могли бути перепарсені як синтаксис; безпечні API замість shell (`execFile` з argv-масивом, не `exec` зі склеєним рядком); і **allowlist**-валідація на межі — стверджуй форму, яку очікуєш (це ціле число, це матчить цей enum), і відкидай усе інше. Екранування — останній засіб для рідкісного контексту без параметризованого API, а не перша лінія захисту.',
          },
        },
        {
          kind: 'code',
          lang: 'ts',
          code: `// The same query, two worlds. Only the channel changed — that is the entire fix.

// ✗ INJECTABLE — value becomes syntax. Input  ' OR '1'='1  rewrites the WHERE clause.
db.query("SELECT * FROM orders WHERE customer = '" + req.query.c + "'");

// ✓ PARAMETERIZED — the driver sends TEXT and VALUES on separate channels;
//   :c can never be reparsed as SQL, whatever bytes it contains.
db.query('SELECT * FROM orders WHERE customer = $1', [req.query.c]);

// ✓ BOUNDARY ALLOWLIST — assert the shape you expect before the value travels at all.
const Id = z.string().uuid();               // "this is a UUID, nothing else"
const customer = Id.parse(req.query.c);     // throws → 400 at the edge, not a query later`,
          note: {
            en: 'Parameterization is not a style choice — it is the mechanism that makes injection *impossible* for that call, because values never enter the parser as syntax. Reach for it in every interpreter you touch (SQL, the shell, the template engine), and validate shape at the boundary on top.',
            uk: 'Параметризація — не питання стилю, це механізм, що робить injection *неможливим* для того виклику, бо значення ніколи не входять у парсер як синтаксис. Бери її для кожного інтерпретатора, якого торкаєшся (SQL, shell, template engine), і валідуй форму на межі згори.',
          },
        },
        {
          kind: 'figure',
          fig: 'trust-boundaries',
          caption: {
            en: 'The boundary is the whole subject: untrusted callers on the left, your edge (validate + authenticate + authorize) as the membrane, trusted internals on the right. Each threat in this module is labelled by the line it crosses — injection rides data through into an interpreter; SSRF turns the server into a deputy reaching back inside; CSRF borrows the browser\'s ambient credentials.',
            uk: 'Межа — це весь предмет: недовірені викликачі ліворуч, твій edge (валідуй + автентифікуй + авторизуй) як мембрана, довірені внутрішні праворуч. Кожна загроза цього модуля підписана лінією, яку вона перетинає — injection везе дані крізь мембрану в інтерпретатор; SSRF робить сервер депутатом, що тягнеться назад усередину; CSRF позичає ambient-креденшели браузера.',
          },
        },
      ],
    },
    // ── T2 · SSRF ─────────────────────────────────────────────────────────────
    {
      id: 'ssrf',
      title: { en: 'SSRF — the confused deputy', uk: 'SSRF — заплутаний депутат' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: '**Server-Side Request Forgery** is injection\'s network-layer cousin, and it earned its own slot in the OWASP API Top 10 (**API7:2023**) precisely because modern APIs take URLs as input all the time: a webhook target (m15), an "import from URL", an avatar fetcher, a PDF renderer that loads remote images. The attacker cannot reach your internal network — but *your server can*, and SSRF tricks it into making the request on the attacker\'s behalf: the **confused deputy**. The crown jewel is the cloud **instance-metadata endpoint** at the link-local address `169.254.169.254`, which hands out temporary credentials to anything that can HTTP-GET it from the instance — the mechanism behind the 2019 Capital One breach. Internal admin panels, databases on `localhost`, and `file://` URLs are the other targets. Defence is an **allowlist, enforced after DNS resolution**: permit only the schemes and hosts you actually need, resolve the name, then re-check that the *resolved IP* is not private, loopback, or link-local (a naive host-name check loses to DNS rebinding — the name resolves to a safe IP when you validate and a `169.254.*` address when you fetch). Disable redirect-following, require **IMDSv2** (token-gated metadata), and put an egress firewall between the service and everything it has no business calling.',
            uk: '**Server-Side Request Forgery** — це мережевий кузен injection, і він заслужив власний слот у OWASP API Top 10 (**API7:2023**) саме тому, що сучасні API постійно беруть URL як вхід: webhook-таргет (m15), «імпорт з URL», фетчер аватарів, PDF-рендерер, що вантажить віддалені зображення. Атакер не дістане твою внутрішню мережу — але *твій сервер дістане*, і SSRF обманом змушує його зробити запит від імені атакера: **заплутаний депутат**. Головний приз — хмарний **instance-metadata endpoint** за link-local адресою `169.254.169.254`, що роздає тимчасові креденшели будь-чому, що може HTTP-GET-нути його з інстансу, — механізм за витоком Capital One 2019. Внутрішні адмінки, бази на `localhost` і `file://`-URL — інші цілі. Захист — **allowlist, застосований ПІСЛЯ резолву DNS**: дозволь лише схеми й хости, які реально потрібні, зарезолв ім\'я, тоді перевір, що *зарезолвлений IP* не приватний, не loopback і не link-local (наївна перевірка імені програє DNS rebinding — ім\'я резолвиться у безпечний IP, коли валідуєш, і в `169.254.*`, коли фетчиш). Вимкни слідування за редиректами, вимагай **IMDSv2** (metadata за токеном) і постав egress-firewall між сервісом і всім, що йому нема діла викликати.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Validate the resolved IP, not the hostname (TOCTOU)', uk: 'Валідуй зарезолвлений IP, а не hostname (TOCTOU)' },
          md: {
            en: 'The subtle failure is time-of-check to time-of-use: you validate `assets.example.com` (resolves to a public IP), approve it, and *then* fetch — but the attacker\'s DNS returns a public IP on the first lookup and `169.254.169.254` on the second (DNS rebinding). The fix is to resolve once, pin the connection to *that* checked IP, and reject private/link-local/loopback ranges on the resolved address — not the string. Blocklisting the literal `169.254.169.254` also loses to decimal/octal/IPv6-mapped encodings; allowlist the destinations instead.',
            uk: 'Тонка відмова — time-of-check to time-of-use: ти валідуєш `assets.example.com` (резолвиться в публічний IP), схвалюєш і *тоді* фетчиш — а DNS атакера повертає публічний IP на першому запиті і `169.254.169.254` на другому (DNS rebinding). Фікс — зарезолвити раз, запінити з\'єднання на *той* перевірений IP і відкидати private/link-local/loopback на зарезолвленій адресі, а не на рядку. Блоклист літерального `169.254.169.254` також програє decimal/octal/IPv6-mapped кодуванням; краще allowlist призначень.',
          },
        },
      ],
    },
    // ── T3 · CORS ─────────────────────────────────────────────────────────────
    {
      id: 'cors',
      title: { en: 'CORS — what it is and is not', uk: 'CORS — що це і що ні' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'CORS is the most misunderstood control in web security, and every misuse traces to one wrong belief: that it protects your server. It does not. The browser\'s **Same-Origin Policy** stops JavaScript on `evil.com` from *reading* the response of a request to `api.bank.com`; **CORS (Cross-Origin Resource Sharing)** is the server\'s way to selectively *relax* that policy — "browsers, it is OK to let `app.bank.com` read my responses" — via the `Access-Control-Allow-Origin` header, with a **preflight `OPTIONS`** negotiating anything beyond simple requests. Three consequences follow that people miss. First, CORS is enforced **only by browsers**: `curl`, a mobile app, or another server ignores it completely, so it is never an access-control layer for your API — that is authentication and authorization (m17). Second, a restrictive CORS policy does not stop a request from being *sent* (and its side effect from happening); it stops the *response from being read* — CSRF (next topic) lives in that gap. Third, the dangerous misconfiguration is *loosening*, not tightening: **reflecting the `Origin` header back with `Access-Control-Allow-Credentials: true`** tells the browser that *any* site may make credentialed reads — strictly worse than no CORS at all. Set an explicit allowlist of origins; never reflect; and treat `Allow-Credentials: true` as a decision that needs a reason.',
            uk: 'CORS — найбільш нерозуміний контроль у веб-безпеці, і кожне зловживання зводиться до однієї хибної віри: що він захищає твій сервер. Ні. Браузерна **Same-Origin Policy** не дає JavaScript на `evil.com` *читати* відповідь запиту до `api.bank.com`; **CORS (Cross-Origin Resource Sharing)** — це спосіб сервера вибірково *послабити* цю політику — «браузери, можна дозволити `app.bank.com` читати мої відповіді» — через заголовок `Access-Control-Allow-Origin`, з **preflight `OPTIONS`**, що узгоджує все поза simple-запитами. З цього випливають три наслідки, які пропускають. Перший: CORS застосовується **лише браузерами**: `curl`, мобільний застосунок чи інший сервер ігнорують його повністю, тож він ніколи не є шаром контролю доступу для твого API — це автентифікація й авторизація (m17). Другий: рестриктивна CORS-політика не заважає запиту бути *надісланим* (і його side-effect статися); вона заважає *відповідь прочитати* — CSRF (наступна тема) живе в цій щілині. Третій: небезпечна помилка — це *послаблення*, не затягування: **відбивання заголовка `Origin` назад разом з `Access-Control-Allow-Credentials: true`** каже браузеру, що *будь-який* сайт може робити credentialed-читання — строго гірше, ніж CORS узагалі. Постав явний allowlist origin-ів; ніколи не відбивай; і сприймай `Allow-Credentials: true` як рішення, що потребує причини.',
          },
        },
        {
          kind: 'compare',
          a: { en: 'What CORS actually is', uk: 'Чим CORS є насправді' },
          b: { en: 'What people wrongly assume', uk: 'Чим його помилково вважають' },
          rows: [
            [
              { en: 'Who enforces it', uk: 'Хто застосовує' },
              { en: 'The browser, on the client', uk: 'Браузер, на клієнті' },
              { en: '"My server firewalls cross-origin calls"', uk: '«Мій сервер фаєрволить cross-origin виклики»' },
            ],
            [
              { en: 'What it guards', uk: 'Що стереже' },
              { en: 'The user: cross-origin READING of responses', uk: 'Користувача: cross-origin ЧИТАННЯ відповідей' },
              { en: '"It blocks the request from happening"', uk: '«Воно блокує сам запит»' },
            ],
            [
              { en: 'Against a non-browser client', uk: 'Проти не-браузерного клієнта' },
              { en: 'No effect — curl/servers ignore it', uk: 'Жодного — curl/сервери ігнорують' },
              { en: '"It protects my API from scripts"', uk: '«Воно захищає моє API від скриптів»' },
            ],
            [
              { en: 'The real risk', uk: 'Реальний ризик' },
              { en: 'Reflecting Origin + Allow-Credentials: true', uk: 'Відбивання Origin + Allow-Credentials: true' },
              { en: '"Wider CORS = more convenient, harmless"', uk: '«Ширший CORS = зручніше, безпечно»' },
            ],
          ],
        },
      ],
    },
    // ── T4 · CSRF ─────────────────────────────────────────────────────────────
    {
      id: 'csrf',
      title: { en: 'CSRF & ambient authority', uk: 'CSRF та ambient authority' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Cross-Site Request Forgery is the attack that lives in the gap CORS leaves open, and its engine is **ambient authority**: a session **cookie** is attached by the browser to *every* request to its domain, automatically, whoever caused the request. So a form on `evil.com` that POSTs to `api.bank.com/transfer` rides the victim\'s logged-in cookie — the server sees a perfectly authenticated request it never should have honoured. The single most clarifying fact: **CSRF only bites credentials the browser attaches by itself.** A token sent as `Authorization: Bearer …` is added by *your* JavaScript and is **not** replayed cross-site, which is why bearer-token SPAs and mobile clients are structurally CSRF-resistant — the exposure is specific to cookie (and HTTP Basic) sessions. For those, defence is layered: **`SameSite` cookies** (Chromium defaults unspecified cookies to `Lax` since Chrome 80 / 2020, so they are withheld on cross-site POST) as a baseline; an **anti-CSRF token** (synchronizer or double-submit) the attacker\'s blind request cannot know; and an **Origin/Referer check** on state-changing requests. Keep `GET` safe and idempotent (m5) so a mere navigation can never mutate state — half of CSRF is really "a `GET` that shouldn\'t have had a side effect."',
            uk: 'Cross-Site Request Forgery — атака, що живе в щілині, яку лишає CORS, і її двигун — **ambient authority**: сесійний **cookie** чіпляється браузером до *кожного* запиту на його домен, автоматично, хай хто спричинив запит. Тож форма на `evil.com`, що POST-ить на `api.bank.com/transfer`, їде на залогіненому cookie жертви — сервер бачить ідеально автентифікований запит, який він ніколи не мав шанувати. Найпрояснювальніший факт: **CSRF кусає лише креденшели, які браузер чіпляє сам.** Токен, надісланий як `Authorization: Bearer …`, додає *твій* JavaScript, і він **не** відтворюється cross-site — ось чому bearer-token SPA й мобільні клієнти структурно CSRF-стійкі; вразливість специфічна для cookie- (і HTTP Basic-) сесій. Для них захист шаровий: **`SameSite`-cookie** (Chromium дефолтить незазначені cookie в `Lax` з Chrome 80 / 2020, тож їх притримують на cross-site POST) як базлайн; **anti-CSRF токен** (synchronizer чи double-submit), якого сліпий запит атакера не може знати; і перевірка **Origin/Referer** на запитах, що змінюють стан. Тримай `GET` safe та idempotent (m5), щоб проста навігація ніколи не могла мутувати стан — половина CSRF насправді це «`GET`, що не мав би мати side-effect».',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'SameSite is a layer, not the whole defence', uk: 'SameSite — шар, а не весь захист' },
          md: {
            en: 'Do not retire CSRF tokens just because you set `SameSite=Lax`. It is not the default in Safari or Firefox; Chromium keeps a ~2-minute window where cookies set *without* an explicit `SameSite` are still sent on top-level POST (to avoid breaking SSO); `Lax` still permits top-level `GET`, so a state-changing `GET` remains exposed; and same-site subdomains can sidestep it. Treat `SameSite` as defence-in-depth beneath a real anti-CSRF token or a bearer-in-header design.',
            uk: 'Не списуй CSRF-токени лише тому, що поставив `SameSite=Lax`. Це не дефолт у Safari чи Firefox; Chromium тримає ~2-хвилинне вікно, де cookie, поставлені *без* явного `SameSite`, усе ще шлються на top-level POST (щоб не ламати SSO); `Lax` усе ще пускає top-level `GET`, тож `GET`, що змінює стан, лишається вразливим; і same-site субдомени можуть його обійти. Сприймай `SameSite` як defense-in-depth під справжнім anti-CSRF токеном або дизайном bearer-in-header.',
          },
        },
      ],
    },
    // ── T5 · DoS by complexity ────────────────────────────────────────────────
    {
      id: 'dos-complexity-attacks',
      title: { en: 'DoS by complexity, not volume', uk: 'DoS складністю, а не обсягом' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The denial-of-service you can buy bandwidth against is the easy kind; the dangerous kind is **asymmetric** — a tiny request that costs the attacker nothing and costs you a CPU core, a gigabyte, or a thread. OWASP files it as **API4:2023, Unrestricted Resource Consumption**, and it comes in three flavours. **Algorithmic complexity**: an input crafted to hit a pathological path — hash-collision flooding, or **ReDoS**, where a backtracking regex like `(a+)+$` goes exponential on a string of `a`s. **Amplification**: a small message that expands hugely — a deeply nested or aliased **GraphQL** query (the reason m9 insists on depth + complexity limits), XML **entity expansion** ("billion laughs", m7), a decompression/zip bomb. **Protocol-level**: **HTTP/2 Rapid Reset (CVE-2023-44487)**, disclosed October 2023, where a client opens a stream and immediately sends `RST_STREAM` — cheap to send, real work to process — driving record floods around **398 million requests/second**. The defences are all *budgets enforced at the boundary before the work starts*: cap request/body size, query depth and complexity, array lengths and page sizes (m20); time-box every operation (m21); rate-limit and quota per principal (m20); review regexes for catastrophic backtracking; and configure the server\'s stream/connection limits so a protocol trick cannot convert cheap frames into unbounded work.',
            uk: 'DoS, проти якого можна купити смугу, — легкий різновид; небезпечний — **асиметричний**: крихітний запит, що коштує атакеру нічого, а тобі — ядро CPU, гігабайт чи потік. OWASP заносить це як **API4:2023, Unrestricted Resource Consumption**, і воно буває трьох смаків. **Алгоритмічна складність**: вхід, зроблений щоб влучити в патологічний шлях — hash-collision flooding або **ReDoS**, де backtracking-регекс на кшталт `(a+)+$` стає експоненційним на рядку з `a`. **Ампліфікація**: мале повідомлення, що величезно розгортається — глибоко вкладений чи aliased **GraphQL**-запит (причина, чому m9 наполягає на depth + complexity лімітах), XML **entity expansion** («billion laughs», m7), decompression/zip-бомба. **Рівень протоколу**: **HTTP/2 Rapid Reset (CVE-2023-44487)**, розкритий у жовтні 2023, де клієнт відкриває stream і негайно шле `RST_STREAM` — дешево слати, реальна робота обробляти, — женучи рекордні флуди близько **398 мільйонів запитів/секунду**. Захист — усе це *бюджети, застосовані на межі до початку роботи*: обмеж розмір запиту/тіла, глибину й складність запиту, довжини масивів і розміри сторінок (m20); тайм-боксь кожну операцію (m21); rate-limit і квота на principal (m20); ревʼю регексів на катастрофічний backtracking; і налаштуй ліміти stream/connection сервера, щоб протокольний трюк не конвертував дешеві фрейми в безмежну роботу.',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Attack', uk: 'Атака' },
            { en: 'The asymmetry', uk: 'Асиметрія' },
            { en: 'Boundary control', uk: 'Контроль на межі' },
          ],
          rows: [
            [
              { en: 'ReDoS', uk: 'ReDoS' },
              { en: 'A short string → exponential regex backtracking', uk: 'Короткий рядок → експоненційний backtracking' },
              { en: 'Linear regex engines, input caps, timeouts', uk: 'Лінійні regex-рушії, ліміти входу, timeout-и' },
            ],
            [
              { en: 'GraphQL depth/alias', uk: 'GraphQL depth/alias' },
              { en: 'One query → thousands of resolver calls (m9)', uk: 'Один запит → тисячі resolver-викликів (m9)' },
              { en: 'Depth + complexity limits, persisted queries', uk: 'Depth + complexity ліміти, persisted queries' },
            ],
            [
              { en: 'XML entity expansion', uk: 'XML entity expansion' },
              { en: 'A few KB → gigabytes in memory (m7)', uk: 'Кілька КБ → гігабайти в пам\'яті (m7)' },
              { en: 'Disable DTDs / external entities', uk: 'Вимкни DTD / external entities' },
            ],
            [
              { en: 'HTTP/2 Rapid Reset', uk: 'HTTP/2 Rapid Reset' },
              { en: 'open+RST_STREAM → ~398M rps (CVE-2023-44487)', uk: 'open+RST_STREAM → ~398M rps (CVE-2023-44487)' },
              { en: 'Stream/connection caps, patched servers', uk: 'Ліміти stream/connection, пропатчені сервери' },
            ],
            [
              { en: 'Decompression bomb', uk: 'Decompression-бомба' },
              { en: 'A small gzip → an unbounded body', uk: 'Малий gzip → безмежне тіло' },
              { en: 'Decompressed-size limits before buffering', uk: 'Ліміти розпакованого розміру до буферизації' },
            ],
          ],
          caption: {
            en: 'Asymmetric DoS: every row is cheap to send and expensive to serve. The control is always a budget checked before the expensive work begins.',
            uk: 'Асиметричний DoS: кожен рядок дешево слати й дорого обслуговувати. Контроль — завжди бюджет, перевірений до початку дорогої роботи.',
          },
        },
      ],
    },
    // ── T6 · Deserialization ──────────────────────────────────────────────────
    {
      id: 'deserialization',
      title: { en: 'Unsafe deserialization', uk: 'Небезпечна десеріалізація' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Deserialization turns bytes back into an in-memory object, and it becomes a weapon the moment the format can encode **which types to build and which methods to run**. Feed such a deserializer attacker-controlled bytes and you have handed it a program: Java native serialization and .NET `BinaryFormatter` are the classic **gadget-chain → remote-code-execution** vectors; Python `pickle` executes on load by design; and in JavaScript the quieter cousin is **prototype pollution** — a payload with a `__proto__` key that mutates `Object.prototype` for the whole process, flipping an `isAdmin` check or poisoning every object downstream. XML\'s **XXE** (m7) is the same disease in another format: external entities that read `file:///etc/passwd` or pivot into SSRF. The rule is blunt: **never deserialize untrusted input into rich, type-resolving objects.** Prefer data-only formats (`JSON.parse` yields plain data, not code — its danger is prototype pollution during a careless *merge*, not execution on parse); if a format supports type resolution or code, disable it; schema-validate the parsed shape before use; and for XML, turn **DTDs and external entities off** in every parser that touches the network.',
            uk: 'Десеріалізація перетворює байти назад в обʼєкт у памʼяті, і вона стає зброєю тієї миті, коли формат може закодувати, **які типи будувати і які методи запускати**. Згодуй такому десеріалізатору підконтрольні атакеру байти — і ти вручив йому програму: Java native serialization і .NET `BinaryFormatter` — класичні вектори **gadget-chain → remote-code-execution**; Python `pickle` виконує на завантаженні за дизайном; а в JavaScript тихіший кузен — **prototype pollution**: payload із ключем `__proto__`, що мутує `Object.prototype` на весь процес, перемикаючи перевірку `isAdmin` чи отруюючи кожен обʼєкт нижче за потоком. XML-ний **XXE** (m7) — та сама хвороба в іншому форматі: external entities, що читають `file:///etc/passwd` чи звертають у SSRF. Правило різке: **ніколи не десеріалізуй недовірений вхід у багаті, type-resolving обʼєкти.** Віддавай перевагу data-only форматам (`JSON.parse` дає плоскі дані, не код — його небезпека це prototype pollution під час недбалого *merge*, а не виконання на парсингу); якщо формат підтримує type resolution чи код — вимкни це; валідуй розпарсену форму схемою до вжитку; а для XML вимикай **DTD й external entities** у кожному парсері, що торкається мережі.',
          },
        },
        {
          kind: 'code',
          lang: 'ts',
          code: `// Prototype pollution — deserialization's quiet JS variant. No RCE, just a poisoned Object.
const evil = JSON.parse('{"__proto__":{"isAdmin":true}}'); // parses fine — it's just data…

// ✗ …until a naive recursive merge copies __proto__ onto Object.prototype:
function unsafeMerge(dst, src) { for (const k in src) dst[k] = typeof src[k] === 'object' ? unsafeMerge(dst[k] ?? {}, src[k]) : src[k]; }
unsafeMerge({}, evil);
({}).isAdmin;                 // → true.  Every object in the process now "is admin".

// ✓ Guard the dangerous keys, or use a null-proto target / Map / a vetted library.
function safeMerge(dst, src) {
  for (const k of Object.keys(src)) {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue; // reject
    dst[k] = /* recurse with the same guard */ src[k];
  }
  return dst;
}`,
          note: {
            en: 'The parse was never the problem — the *merge* was. Untrusted data is safe only while it stays inert data; the bug appears when code walks it and lets a special key change behaviour. Reject `__proto__`/`constructor`/`prototype`, or deserialize into a null-prototype object or a `Map`.',
            uk: 'Парсинг ніколи не був проблемою — *merge* був. Недовірені дані безпечні лише поки лишаються інертними даними; баг зʼявляється, коли код їх обходить і дає спеціальному ключу змінити поведінку. Відкидай `__proto__`/`constructor`/`prototype`, або десеріалізуй у null-prototype обʼєкт чи `Map`.',
          },
        },
      ],
    },
    // ── T7 · TLS everywhere ───────────────────────────────────────────────────
    {
      id: 'tls-everywhere',
      title: { en: 'TLS everywhere', uk: 'TLS усюди' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Everything so far assumes the bytes on the wire arrive confidential and unmodified — **TLS** is what buys that assumption, and the modern rule is *TLS everywhere*, not just at the front door. **BCP 195 / RFC 9325** (2022) is the current guidance: **support TLS 1.3 and prefer it**, keep **TLS 1.2 as the floor** only with a hardened cipher configuration, and treat SSL and early TLS as deprecated. Without TLS, a network attacker reads tokens and rewrites responses — every auth scheme in m17 assumes the channel is protected. The subtler discipline is *internal* TLS: the old model that terminated TLS at the edge and let plaintext flow across a "trusted" LAN is exactly how one foothold becomes lateral movement, because **the network is not a trust boundary**. Encrypt service-to-service hops too, use **mTLS** (m17) so both ends authenticate, and remember that terminating TLS at a gateway (m23) is safe only if the hop *behind* the gateway is encrypted as well. Certificates are operational surface, not a one-time setup: **automate issuance and rotation** (ACME), enforce HTTPS with **HSTS**, and monitor expiry — an expired certificate is the most common self-inflicted outage in the whole module.',
            uk: 'Усе досі припускає, що байти на дроті прибувають конфіденційними й незміненими — **TLS** купує це припущення, і сучасне правило — *TLS усюди*, не лише на парадних дверях. **BCP 195 / RFC 9325** (2022) — актуальна настанова: **підтримуй TLS 1.3 і віддавай йому перевагу**, тримай **TLS 1.2 як підлогу** лише з загартованою конфігурацією шифрів, а SSL і ранній TLS вважай застарілими. Без TLS мережевий атакер читає токени й переписує відповіді — кожна auth-схема в m17 припускає, що канал захищений. Тонша дисципліна — *внутрішній* TLS: стара модель, що термінувала TLS на edge і пускала plaintext через «довірений» LAN, — саме те, як один плацдарм стає lateral movement, бо **мережа не є межею довіри**. Шифруй і service-to-service хопи, використовуй **mTLS** (m17), щоб обидва кінці автентифікувалися, і памʼятай, що термінувати TLS на gateway (m23) безпечно лише коли хоп *за* gateway теж шифрований. Сертифікати — операційна поверхня, не разове налаштування: **автоматизуй видачу й ротацію** (ACME), примушуй HTTPS через **HSTS** і моніторь протермінування — прострочений сертифікат це найчастіший самозаподіяний простій у всьому модулі.',
          },
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'Internal traffic is not safe traffic', uk: 'Внутрішній трафік не є безпечним трафіком' },
          md: {
            en: '"It is behind the firewall" is the assumption attackers count on. A flat network with plaintext internal hops means the first compromised pod, SSRF, or leaked credential sees everything laterally. Zero-trust flips the default: authenticate and encrypt *every* hop, authorize *every* call (m17), and let no service trust another purely because they share a subnet.',
            uk: '«Воно за фаєрволом» — припущення, на яке атакери розраховують. Плоска мережа з plaintext внутрішніми хопами означає, що перший скомпрометований pod, SSRF чи витеклий креденшел бачить усе латерально. Zero-trust перевертає дефолт: автентифікуй і шифруй *кожен* хоп, авторизуй *кожен* виклик (m17), і хай жоден сервіс не довіряє іншому лише тому, що вони в одній підмережі.',
          },
        },
      ],
    },
    // ── T8 · Secrets, replay & the verdict ────────────────────────────────────
    {
      id: 'secrets-and-replay',
      title: { en: 'Secrets, replay & the verdict', uk: 'Секрети, replay і вердикт' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Two loose ends close the module. **Secrets** — API keys, signing keys, database credentials, OAuth client secrets — must never live in source or in committed `.env` files (git history is forever; one push and the secret is public until rotated). Keep them in a **secret manager** (Vault, cloud KMS/Secrets Manager), inject at runtime, scope each to least privilege, and rotate on a schedule and immediately on any suspicion — assume a leaked secret is already used. **Replay** is the hostile twin of m21\'s legitimate duplicate: a captured-but-still-valid request re-sent to trigger its effect again, or a stolen token reused. The defences knit the whole guide together — **short token lifetimes plus refresh** (m17), **webhook signatures with a timestamp window and a nonce** so a replayed body falls outside the window (m15), **idempotency keys scoped to the authenticated principal** so a captured key cannot be replayed by a third party (m21), and **TLS** (T7) to stop the capture at all.',
            uk: 'Дві незавʼязані нитки закривають модуль. **Секрети** — API-ключі, ключі підпису, креденшели БД, OAuth client secret — ніколи не мають жити в сорсі чи в закомічених `.env` (git history назавжди; один push — і секрет публічний, доки не зротований). Тримай їх у **secret manager** (Vault, cloud KMS/Secrets Manager), інʼєкть у рантаймі, скоупни кожен на least privilege і ротуй за розкладом і негайно на будь-яку підозру — припускай, що витеклий секрет уже використаний. **Replay** — ворожий близнюк легітимного дубліката з m21: перехоплений-але-ще-валідний запит, пересланий щоб зіграти ефект знову, чи вкрадений токен, ужитий повторно. Захист сплітає весь гайд — **короткі час життя токенів плюс refresh** (m17), **webhook-підписи з вікном timestamp і nonce**, щоб відтворене тіло випало за вікно (m15), **idempotency keys, скоуплені на автентифікованого principal**, щоб перехоплений ключ не міг відтворити третя сторона (m21), і **TLS** (T7), щоб зупинити перехоплення взагалі.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: '**Use / avoid.** Treat every input as data and **parameterize** every interpreter — SQL, shell, templates; validate shape with an **allowlist** at the boundary. **Allowlist SSRF-reachable destinations** and check the *resolved* IP against private/link-local ranges; require IMDSv2. Understand **CORS is browser-only** and never reflect `Origin` with `Allow-Credentials: true`. Prefer **bearer-token-in-header** over cookies; if cookies, layer `SameSite` + a CSRF token + Origin checks and keep `GET` safe. **Budget** depth, size, and complexity and rate-limit (m20) so DoS stays symmetric. **Never deserialize** untrusted bytes into rich objects; disable XML DTDs/external entities; guard `__proto__`. **TLS everywhere** including internal hops, 1.3 preferred (BCP 195). Keep **secrets in a manager**, rotated; defend **replay** with timestamps, nonces, and principal-scoped idempotency. Avoid: trusting CORS, a WAF, or the network perimeter as sufficient; blocklists where allowlists belong; "we are internal, so it is safe"; secrets in the repo; and validation done only on the client, which the attacker never runs.',
            uk: '**Використовуй / уникай.** Сприймай кожен вхід як дані й **параметризуй** кожен інтерпретатор — SQL, shell, шаблони; валідуй форму **allowlist**-ом на межі. **Allowlist призначень, досяжних для SSRF**, і перевіряй *зарезолвлений* IP проти private/link-local діапазонів; вимагай IMDSv2. Розумій, що **CORS лише браузерний**, і ніколи не відбивай `Origin` з `Allow-Credentials: true`. Віддавай перевагу **bearer-token-in-header** над cookie; якщо cookie — шаруй `SameSite` + CSRF-токен + Origin-перевірки і тримай `GET` safe. **Бюджетуй** глибину, розмір і складність і rate-limit (m20), щоб DoS лишався симетричним. **Ніколи не десеріалізуй** недовірені байти в багаті обʼєкти; вимкни XML DTD/external entities; стережи `__proto__`. **TLS усюди**, включно з внутрішніми хопами, 1.3 переважно (BCP 195). Тримай **секрети в manager**, зротовані; захищай **replay** timestamp-ами, nonce й idempotency, скоупленою на principal. Уникай: довіри до CORS, WAF чи мережевого периметра як достатніх; блоклистів там, де місце allowlist-ам; «ми внутрішні, отже безпечно»; секретів у репо; і валідації лише на клієнті, який атакер ніколи не запускає.',
          },
        },
      ],
    },
  ],
  keyPoints: [
    {
      en: 'Every input is **data, never code**: injection is untrusted input reaching an interpreter as syntax. Parameterize (separate channels for text and values), use safe APIs over shells, and allowlist-validate at the boundary — escaping is the last resort, not the first.',
      uk: 'Кожен вхід — **дані, ніколи код**: injection це недовірений вхід, що дістається інтерпретатора як синтаксис. Параметризуй (окремі канали для тексту й значень), бери безпечні API замість shell і allowlist-валідуй на межі — екранування це останній засіб, не перший.',
    },
    {
      en: '**SSRF** (API7:2023) turns your server into a confused deputy reaching internal services and the cloud metadata endpoint (`169.254.169.254`). Allowlist destinations, validate the *resolved* IP (defeat DNS rebinding), disable redirects, require IMDSv2.',
      uk: '**SSRF** (API7:2023) робить твій сервер заплутаним депутатом, що тягнеться до внутрішніх сервісів і хмарного metadata endpoint (`169.254.169.254`). Allowlist призначень, валідуй *зарезолвлений* IP (побий DNS rebinding), вимкни редиректи, вимагай IMDSv2.',
    },
    {
      en: '**CORS is a browser relaxation of the Same-Origin Policy, not a server firewall** — it guards the user\'s cross-origin *reads*, is ignored by non-browser clients, and its real danger is reflecting `Origin` with `Allow-Credentials: true`.',
      uk: '**CORS — це браузерне послаблення Same-Origin Policy, а не серверний фаєрвол** — він стереже cross-origin *читання* користувача, ігнорується не-браузерними клієнтами, а його реальна небезпека — відбивання `Origin` з `Allow-Credentials: true`.',
    },
    {
      en: '**CSRF** weaponizes credentials the browser attaches automatically (cookies); bearer-token-in-header APIs are structurally immune. For cookie sessions, layer `SameSite` (a layer, not a complete defence) + anti-CSRF token + Origin check, and keep `GET` safe.',
      uk: '**CSRF** озброює креденшели, які браузер чіпляє автоматично (cookie); API з bearer-token-in-header структурно імунні. Для cookie-сесій шаруй `SameSite` (шар, не повний захист) + anti-CSRF токен + Origin-перевірку і тримай `GET` safe.',
    },
    {
      en: 'The dangerous DoS is **asymmetric, not volumetric**: ReDoS, GraphQL depth (m9), XML entity expansion (m7), HTTP/2 Rapid Reset (CVE-2023-44487, ~398M rps). Defend with depth/size/complexity budgets, timeouts (m21), and rate limits (m20) enforced before the work starts.',
      uk: 'Небезпечний DoS — **асиметричний, не обсяговий**: ReDoS, GraphQL depth (m9), XML entity expansion (m7), HTTP/2 Rapid Reset (CVE-2023-44487, ~398M rps). Захищайся бюджетами depth/size/complexity, timeout-ами (m21) і rate-лімітами (m20), застосованими до початку роботи.',
    },
    {
      en: '**Never deserialize untrusted bytes into rich objects** (gadget chains, pickle, prototype pollution, XXE). **TLS everywhere** incl. internal hops, 1.3 preferred (BCP 195/RFC 9325). Keep **secrets in a manager**, rotated; defend **replay** with timestamps, nonces, and principal-scoped idempotency (m15, m21).',
      uk: '**Ніколи не десеріалізуй недовірені байти в багаті обʼєкти** (gadget chains, pickle, prototype pollution, XXE). **TLS усюди**, включно з внутрішніми хопами, 1.3 переважно (BCP 195/RFC 9325). Тримай **секрети в manager**, зротовані; захищай **replay** timestamp-ами, nonce й idempotency, скоупленою на principal (m15, m21).',
    },
  ],
  pitfalls: [
    {
      title: { en: 'A blocklist where an allowlist belongs', uk: 'Блоклист там, де місце allowlist' },
      body: {
        en: 'Blocklists lose by construction: "strip `<script>`" misses `<img onerror>`, "block `169.254.169.254`" misses its octal, decimal, and IPv6-mapped spellings, "reject these SQL keywords" misses the next encoding. You cannot enumerate every bad input; you can enumerate the good ones. Assert the exact shape you accept — this integer, this enum, this resolved public IP — and reject the entire complement.',
        uk: 'Блоклисти програють за конструкцією: «виріж `<script>`» проґавить `<img onerror>`, «блокуй `169.254.169.254`» проґавить його octal, decimal та IPv6-mapped написання, «відкинь ці SQL-ключові слова» проґавить наступне кодування. Ти не перелічиш кожен поганий вхід; ти перелічиш добрі. Стверджуй точну форму, яку приймаєш — це ціле, цей enum, цей зарезолвлений публічний IP — і відкидай усе доповнення.',
      },
    },
    {
      title: { en: '"CORS secures my API"', uk: '«CORS захищає моє API»' },
      body: {
        en: 'The category error, plus its evil twin. CORS is enforced only by browsers, so it is not access control — authentication and authorization are (m17). And the "fix" people reach for when a cross-origin call fails — reflect the `Origin` header and set `Allow-Credentials: true` — tells every website that it may make credentialed reads of your API, a configuration strictly worse than having no CORS headers at all.',
        uk: 'Категорійна помилка плюс її злий близнюк. CORS застосовується лише браузерами, тож це не контроль доступу — ним є автентифікація й авторизація (m17). А «фікс», до якого тягнуться, коли cross-origin виклик падає — відбити заголовок `Origin` і поставити `Allow-Credentials: true` — каже кожному сайту, що йому можна робити credentialed-читання твого API, конфігурація строго гірша за відсутність CORS-заголовків узагалі.',
      },
    },
    {
      title: { en: '"We are behind the firewall"', uk: '«Ми за фаєрволом»' },
      body: {
        en: 'The flat-network assumption is how a single SSRF, leaked credential, or compromised pod becomes a full breach. If internal hops run plaintext and services trust each other by subnet, the first foothold reads and moves everywhere. The network is not a trust boundary: encrypt every hop (mTLS), authorize every call, and grant each service only what it needs.',
        uk: 'Припущення плоскої мережі — це те, як єдиний SSRF, витеклий креденшел чи скомпрометований pod стає повним пробоєм. Якщо внутрішні хопи йдуть plaintext-ом і сервіси довіряють одне одному за підмережею, перший плацдарм читає й рухається всюди. Мережа не є межею довіри: шифруй кожен хоп (mTLS), авторизуй кожен виклик і давай кожному сервісу лише те, що йому треба.',
      },
    },
  ],
  interview: [
    {
      q: {
        en: 'Your API has an "import from URL" feature — it fetches a URL the user supplies. Someone reports they can point it at internal addresses. Walk me through the risk and a defence that actually holds.',
        uk: 'Твоє API має фічу «імпорт з URL» — воно фетчить URL, який дає користувач. Хтось повідомляє, що може націлити його на внутрішні адреси. Проведи мене через ризик і захист, що справді тримає.',
      },
      a: {
        en: 'That is textbook SSRF: the server is a confused deputy with network reach the attacker lacks, so the request goes to internal admin panels, `localhost` services, `file://`, and above all the cloud metadata endpoint `169.254.169.254`, which on a misconfigured instance hands back temporary credentials — the Capital One 2019 shape. A defence that holds is an allowlist, not a blocklist, enforced on the *resolved* address: permit only the schemes (`https`) and hosts you need; resolve DNS once, reject the result if it lands in any private, loopback, or link-local range, and pin the connection to that exact IP so a second lookup cannot rebind to `169.254.*` between check and use (the TOCTOU/DNS-rebinding trick); disable redirect-following so a `302` cannot bounce you inside; and require IMDSv2 so the metadata endpoint needs a token a forged GET does not have. Wrap it with an egress firewall so the service simply cannot open connections to internal ranges. The staff tell is naming the resolved-IP check and DNS rebinding — a hostname allowlist alone is the common broken fix.',
        uk: 'Це підручниковий SSRF: сервер — заплутаний депутат із мережевим досягом, якого атакер не має, тож запит іде до внутрішніх адмінок, `localhost`-сервісів, `file://` і передусім хмарного metadata endpoint `169.254.169.254`, що на misconfigured-інстансі віддає тимчасові креденшели — форма Capital One 2019. Захист, що тримає, — це allowlist, не блоклист, застосований на *зарезолвленій* адресі: дозволь лише схеми (`https`) і хости, які треба; зарезолв DNS раз, відкинь результат, якщо він у будь-якому private, loopback чи link-local діапазоні, і запінь зʼєднання на той самий IP, щоб другий lookup не міг ребайнднути на `169.254.*` між перевіркою й ужитком (трюк TOCTOU/DNS rebinding); вимкни слідування за редиректами, щоб `302` не відбив тебе всередину; і вимагай IMDSv2, щоб metadata endpoint потребував токен, якого підроблений GET не має. Обгорни egress-фаєрволом, щоб сервіс просто не міг відкривати зʼєднання у внутрішні діапазони. Staff-ознака — назвати перевірку зарезолвленого IP і DNS rebinding; сам по собі hostname-allowlist це поширений зламаний фікс.',
      },
      level: 'staff',
    },
    {
      q: {
        en: 'A teammate wants to drop CSRF tokens because you now set SameSite=Lax on the session cookie. Do you agree? Defend your answer.',
        uk: 'Колега хоче прибрати CSRF-токени, бо ви тепер ставите SameSite=Lax на сесійний cookie. Ти згоден? Захисти відповідь.',
      },
      a: {
        en: 'No — SameSite is a valuable layer but not a complete CSRF defence, so I would keep the token (or, better, move state-changing endpoints to a bearer-token-in-header design that is structurally immune because the browser never auto-attaches the credential). Concretely: SameSite=Lax is not the default in Safari or Firefox, so non-Chromium users are unprotected by it; Chromium keeps a roughly two-minute window in which cookies set without an explicit SameSite are still sent on top-level POST, to avoid breaking SSO; Lax still permits cross-site top-level GET, so any state-changing GET stays exposed — which is also why GET must be safe and idempotent (m5); and same-site subdomains or a subdomain takeover can sidestep it. The defensible posture is defence-in-depth: set SameSite as a baseline, verify the Origin/Referer header on state-changing requests, and keep a real anti-CSRF token — or remove the ambient-credential exposure entirely by authenticating with a header token. Retiring the token because of one partial control is trading a proven defence for a browser-and-timing-dependent one.',
        uk: 'Ні — SameSite цінний шар, але не повний CSRF-захист, тож я лишив би токен (або, краще, переніс би state-changing endpoint-и на дизайн bearer-token-in-header, структурно імунний, бо браузер ніколи не чіпляє креденшел автоматично). Конкретно: SameSite=Lax не дефолт у Safari чи Firefox, тож не-Chromium користувачі ним не захищені; Chromium тримає приблизно двохвилинне вікно, у якому cookie, поставлені без явного SameSite, усе ще шлються на top-level POST, щоб не ламати SSO; Lax усе ще пускає cross-site top-level GET, тож будь-який state-changing GET лишається вразливим — і саме тому GET має бути safe та idempotent (m5); і same-site субдомени чи захоплення субдомену можуть його обійти. Захищувана позиція — defense-in-depth: постав SameSite як базлайн, перевіряй Origin/Referer на запитах, що змінюють стан, і тримай справжній anti-CSRF токен — або прибери ambient-credential вразливість узагалі, автентифікуючись header-токеном. Списати токен через один частковий контроль — це проміняти доведений захист на залежний від браузера й таймінгу.',
      },
      level: 'staff',
    },
  ],
  seeAlso: ['m7-soap-xml', 'm9-graphql', 'm15-webhooks', 'm17-auth-identity', 'm21-idempotency'],
  sources: [
    { title: 'OWASP API Security Top 10 — 2023', url: 'https://owasp.org/API-Security/editions/2023/en/0x11-t10/' },
    { title: 'OWASP — Server-Side Request Forgery Prevention Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html' },
    { title: 'PortSwigger Web Security Academy — CORS', url: 'https://portswigger.net/web-security/cors' },
    { title: 'PortSwigger Web Security Academy — CSRF', url: 'https://portswigger.net/web-security/csrf' },
    { title: 'MDN — SameSite cookies', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite' },
    { title: 'Cloudflare — HTTP/2 Rapid Reset (CVE-2023-44487) technical breakdown', url: 'https://blog.cloudflare.com/technical-breakdown-http2-rapid-reset-ddos-attack/' },
    { title: 'CISA — HTTP/2 Rapid Reset Vulnerability (CVE-2023-44487)', url: 'https://www.cisa.gov/news-events/alerts/2023/10/10/http2-rapid-reset-vulnerability-cve-2023-44487' },
    { title: 'OWASP — Deserialization Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html' },
    { title: 'RFC 9325 (BCP 195) — Recommendations for Secure Use of TLS and DTLS', url: 'https://www.rfc-editor.org/info/rfc9325' },
  ],
};
