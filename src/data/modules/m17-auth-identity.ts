import type { Module } from '../types';

/*
 * m17-auth-identity — Authentication & authorization (s4-cross-cutting, order 1). The first cross-cutting
 * concern: every style must prove WHO is calling and decide WHAT they may do. Right-sized: no hero sim;
 * figure 'oauth-flow' (the Authorization Code + PKCE grant). Seven curriculum topics: api-keys →
 * oauth2-1 (figure) → oidc → jwt-and-pitfalls → mtls → scopes-consent → per-style-auth (verdict).
 *
 * Facts web-verified S11 (2026-07):
 *  - OAuth 2.1 is still an IETF DRAFT (draft-ietf-oauth-v2-1, at -15 in Mar-2026, expires Sep-2026) — NOT
 *    an RFC. It consolidates OAuth 2.0 + security BCPs: PKCE mandatory for ALL clients on the code flow,
 *    the Implicit grant and Resource-Owner-Password-Credentials grant are REMOVED, redirect URIs use exact
 *    string matching, refresh-token rotation for public clients. Bearer usage = RFC 6750.
 *  - OIDC = OpenID Connect Core 1.0, an identity layer over OAuth 2.0; the ID Token is a JWT (iss/sub/aud/
 *    exp/iat/nonce); discovery at /.well-known/openid-configuration; keys via JWKS.
 *  - JWT = RFC 7519 (claims) signed as a JWS (RFC 7515); BCP = RFC 8725. Pitfalls: `alg:none`, RS256→HS256
 *    key confusion, base64 ≠ encryption, no revocation until exp, missing aud/iss/exp validation.
 *  - Sender-constrained tokens: mTLS = RFC 8705 (cert-bound, cnf.x5t#S256, transport layer); DPoP = RFC
 *    9449 (proof-JWT per request, cnf.jkt, application layer, works in browsers). Both are in FAPI 2.0.
 *  - BOLA/IDOR (object-level authZ) is OWASP API Security Top-10 #1 — a valid token is not a yes.
 */
export const m17: Module = {
  id: 'm17-auth-identity',
  num: 17,
  section: 's4-cross-cutting',
  order: 1,
  level: 'senior',
  title: { en: 'Authentication & authorization', uk: 'Автентифікація та авторизація' },
  tagline: {
    en: 'API keys, OAuth 2.1, OIDC, JWT, mTLS — carried per style.',
    uk: 'API keys, OAuth 2.1, OIDC, JWT, mTLS — по-різному в кожному стилі.',
  },
  readMins: 16,
  mentalModel: {
    en: '**AuthN proves who you are; AuthZ decides what you may do** — two separate questions, never one. Every API carries the *proof* the same way in principle: a credential is presented at the boundary, validated, and mapped to an identity plus a set of permissions. Only the *carrier* differs by style — a header (REST/GraphQL), call metadata (gRPC), a first message or ticket (WebSockets), or a signature the sender computes (Webhooks). The whole field is one long move away from **long-lived shared secrets** (an API key that is a password in disguise) toward **short-lived, scoped, delegated tokens** (OAuth/OIDC/JWT), and then toward **sender-constrained tokens** (mTLS/DPoP) that are useless to a thief because they are bound to a key only the real caller holds. And the trap that outlives every mechanism: a valid token proves *who*, never that *this* user may touch *this* object.',
    uk: '**AuthN доводить, хто ти; AuthZ вирішує, що тобі можна** — два окремі питання, ніколи не одне. Кожен API несе *доказ* у принципі однаково: креденшел подається на межі, валідується й мапиться на ідентичність плюс набір дозволів. Різниться лише *носій* залежно від стилю — header (REST/GraphQL), metadata виклику (gRPC), перше повідомлення чи ticket (WebSockets) або підпис, який обчислює відправник (Webhooks). Уся галузь — це один довгий рух від **довгоживучих спільних секретів** (API key, що є паролем у масці) до **короткоживучих, scoped, делегованих токенів** (OAuth/OIDC/JWT), а потім до **sender-constrained токенів** (mTLS/DPoP), безкорисних для злодія, бо привʼязані до ключа, який має лише справжній викликач. І пастка, що переживає будь-який механізм: валідний токен доводить *хто*, а не що *цей* користувач може чіпати *цей* обʼєкт.',
  },
  topics: [
    // ── T1 · API keys ─────────────────────────────────────────────────────────
    {
      id: 'api-keys',
      title: { en: 'API keys: the shared secret', uk: 'API keys: спільний секрет' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The simplest credential: a single opaque string the caller sends on every request, usually in a header (`Authorization: Bearer <key>` or a custom `X-API-Key`). An API key **identifies the calling application, not a user**, and answers exactly one question — *is some registered app making this call?* That is enough for server-to-server integrations, usage metering, and public read APIs, and it is trivial to adopt. The cost is everything a key does **not** do: no standard expiry, no user context, no delegation, and usually coarse or no scoping. Because it is a bearer secret, whoever reads it can use it — and keys leak constantly: committed to git, pasted into logs, embedded in a mobile app, or (worst) put in a URL query string, where every proxy and access log records it. Treat a key like a password: **hash it at rest**, send it only over TLS, make it **rotatable** and revocable, and **scope + rate-limit per key** so one leak is contained.',
            uk: 'Найпростіший креденшел: один непрозорий рядок, який викликач шле в кожному запиті, зазвичай у header (`Authorization: Bearer <key>` чи власний `X-API-Key`). API key **ідентифікує застосунок, що викликає, а не користувача**, і відповідає рівно на одне питання — *чи якийсь зареєстрований застосунок робить цей виклик?* Цього досить для server-to-server інтеграцій, обліку використання й публічних read-API, і його тривіально впровадити. Ціна — усе, чого key **не** робить: немає стандартного expiry, немає контексту користувача, немає делегування й зазвичай грубий scoping або жодного. Оскільки це bearer-секрет, хто його прочитав — той і використає, а keys течуть постійно: закомічені в git, вставлені в логи, вшиті в мобільний застосунок або (найгірше) в query string URL, де їх пише кожен proxy й access log. Стався до key як до пароля: **хешуй at rest**, шли лише через TLS, роби **ротовним** і відкличним, і **scope + rate-limit на кожен key**, щоб один витік був локалізований.',
          },
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'A key is authentication, not authorization', uk: 'Key — це автентифікація, а не авторизація' },
          md: {
            en: 'An API key says *“a valid app is calling.”* It does **not** say *“this caller may perform this action on this record.”* Two common failures follow: putting a key in a URL (logged everywhere → treat any key that ever hit a query string as compromised), and treating key presence as permission. The key gets you past the door; a policy check — scopes, ownership, rate limits — decides what happens inside.',
            uk: 'API key каже *«валідний застосунок викликає».* Він **не** каже *«цей викликач може виконати цю дію над цим записом».* Звідси два поширені провали: key у URL (пишеться всюди → вважай будь-який key, що колись потрапив у query string, скомпрометованим) і трактування наявності key як дозволу. Key проводить крізь двері; перевірка політики — scopes, власність, rate limits — вирішує, що станеться всередині.',
          },
        },
      ],
    },
    // ── T2 · OAuth 2.1 (figure) ───────────────────────────────────────────────
    {
      id: 'oauth2-1',
      title: { en: 'OAuth 2.1: delegated authorization', uk: 'OAuth 2.1: делегована авторизація' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'OAuth exists to solve one problem: **let a user grant a third-party app limited access to their data without handing over their password.** Four roles: the **resource owner** (the user), the **client** (the app acting on their behalf), the **authorization server** (authenticates the user, gets consent, issues tokens), and the **resource server** (the API that accepts the token). The one grant you should use today is the **Authorization Code flow with PKCE**: the client redirects the user to the authorization server, the user logs in and consents, the server hands back a **single-use code**, and the client exchanges that code — proving it started the flow via **PKCE** — for an **access token** (and usually a refresh token). The client then calls the API with `Authorization: Bearer <access-token>`. **OAuth 2.1** is an in-progress IETF draft (mid-2026) that folds a decade of security BCPs into one document: **PKCE is mandatory for every client**, the browser-unsafe **Implicit** grant and the password-sharing **ROPC** grant are **removed**, redirect URIs must match by **exact string**, and refresh tokens rotate for public clients.',
            uk: 'OAuth існує, щоб розвʼязати одну проблему: **дати користувачу надати сторонньому застосунку обмежений доступ до своїх даних без передачі пароля.** Чотири ролі: **resource owner** (користувач), **client** (застосунок, що діє від його імені), **authorization server** (автентифікує користувача, отримує consent, видає токени) і **resource server** (API, що приймає токен). Єдиний grant, який слід брати сьогодні — **Authorization Code flow з PKCE**: client перенаправляє користувача на authorization server, той логіниться й дає consent, сервер повертає **одноразовий code**, а client обмінює цей code — доводячи, що саме він почав flow, через **PKCE** — на **access token** (і зазвичай refresh token). Далі client кличе API з `Authorization: Bearer <access-token>`. **OAuth 2.1** — це IETF-чернетка в роботі (середина 2026), що зводить десятиліття security BCP в один документ: **PKCE обовʼязковий для кожного client-а**, небезпечний для браузера grant **Implicit** і grant **ROPC** з передачею пароля **прибрані**, redirect URI мають збігатися **точним рядком**, а refresh-токени ротуються для публічних client-ів.',
          },
        },
        {
          kind: 'figure',
          fig: 'oauth-flow',
          caption: {
            en: 'The Authorization Code + PKCE grant. The client sends a hashed PKCE challenge with the redirect; the user authenticates and consents at the authorization server; a single-use code comes back; the client redeems code + the original PKCE verifier at the token endpoint for an access token, then calls the API with a Bearer token. The user’s password never reaches the client.',
            uk: 'Grant Authorization Code + PKCE. Client шле хешований PKCE challenge з редіректом; користувач автентифікується й дає consent на authorization server; повертається одноразовий code; client викуповує code + початковий PKCE verifier на token endpoint за access token, далі кличе API з Bearer-токеном. Пароль користувача ніколи не доходить до client-а.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'OAuth is authorization, not login', uk: 'OAuth — це авторизація, а не логін' },
          md: {
            en: 'The most common OAuth mistake is using an **access token as proof of identity** — “the token came back, so the user is logged in.” An access token is opaque to the client and addressed to the *resource server*; it says nothing reliable about *who* the user is, and using it as a login signal enables real attacks (token substitution). Authentication — *who logged in* — is exactly what **OIDC** (next topic) adds on top. Rule of thumb: access token → call the API; ID token → know who the user is.',
            uk: 'Найпоширеніша помилка OAuth — використати **access token як доказ ідентичності**: «токен повернувся, отже користувач залогінений». Access token непрозорий для client-а й адресований *resource server*-у; він нічого надійного не каже про те, *хто* користувач, і використання його як сигналу логіну вмикає реальні атаки (token substitution). Автентифікація — *хто залогінився* — це саме те, що додає зверху **OIDC** (наступна тема). Правило: access token → клич API; ID token → дізнайся, хто користувач.',
          },
        },
      ],
    },
    // ── T3 · OIDC ─────────────────────────────────────────────────────────────
    {
      id: 'oidc',
      title: { en: 'OIDC: the identity layer', uk: 'OIDC: шар ідентичності' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: '**OpenID Connect (OIDC)** is a thin standard layer *on top of* OAuth 2.0 that answers the question OAuth deliberately does not: **who is this user?** It reuses the Authorization Code flow but adds an **ID Token** — a **JWT** the authorization server signs, asserting the user’s identity with standard claims (`iss` issuer, `sub` the stable user id, `aud` the client it was minted for, `exp`, `iat`, and a `nonce` binding it to this login). It standardises a `userinfo` endpoint for profile data, **discovery** at `/.well-known/openid-configuration`, and a **JWKS** endpoint publishing the public keys clients use to verify signatures. The clean split: OAuth’s **access token** is for the *resource server* (it authorises API calls and is opaque to the client); OIDC’s **ID token** is for the *client* (it authenticates the user and is **never sent to your API**). This is what powers “Sign in with Google/Apple/Microsoft” — SSO without every app implementing passwords.',
            uk: '**OpenID Connect (OIDC)** — тонкий стандартний шар *поверх* OAuth 2.0, що відповідає на питання, яке OAuth свідомо оминає: **хто цей користувач?** Він переюзовує Authorization Code flow, але додає **ID Token** — **JWT**, який підписує authorization server, стверджуючи ідентичність користувача стандартними claims (`iss` issuer, `sub` стабільний user id, `aud` client, для якого викарбувано, `exp`, `iat` і `nonce`, що привʼязує його до цього логіну). Він стандартизує `userinfo` endpoint для профільних даних, **discovery** на `/.well-known/openid-configuration` і **JWKS** endpoint, що публікує публічні ключі, якими client-и перевіряють підписи. Чистий розподіл: **access token** OAuth — для *resource server* (авторизує API-виклики, непрозорий для client-а); **ID token** OIDC — для *client-а* (автентифікує користувача й **ніколи не шлеться в твій API**). Саме це живить «Sign in with Google/Apple/Microsoft» — SSO без того, щоб кожен застосунок робив паролі.',
          },
        },
        {
          kind: 'compare',
          a: { en: 'Access token (OAuth)', uk: 'Access token (OAuth)' },
          b: { en: 'ID token (OIDC)', uk: 'ID token (OIDC)' },
          rows: [
            [
              { en: 'Answers', uk: 'Відповідає' },
              { en: 'What may this app do?', uk: 'Що може робити цей застосунок?' },
              { en: 'Who logged in?', uk: 'Хто залогінився?' },
            ],
            [
              { en: 'Audience', uk: 'Audience' },
              { en: 'The resource server (API)', uk: 'Resource server (API)' },
              { en: 'The client app', uk: 'Client-застосунок' },
            ],
            [
              { en: 'Sent to your API?', uk: 'Шлеться у твій API?' },
              { en: 'Yes — as Bearer', uk: 'Так — як Bearer' },
              { en: 'No — the client consumes it', uk: 'Ні — його споживає client' },
            ],
            [
              { en: 'Opaque or readable?', uk: 'Непрозорий чи читабельний?' },
              { en: 'Opaque to the client', uk: 'Непрозорий для client-а' },
              { en: 'A JWT the client verifies', uk: 'JWT, який перевіряє client' },
            ],
          ],
        },
      ],
    },
    // ── T4 · JWT & pitfalls ───────────────────────────────────────────────────
    {
      id: 'jwt-and-pitfalls',
      title: { en: 'JWT & its pitfalls', uk: 'JWT і його пастки' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'A **JWT** (JSON Web Token, RFC 7519) is a URL-safe, self-contained token — `header.payload.signature`, each part base64url — signed as a **JWS** (RFC 7515). Its superpower is **stateless validation**: a resource server verifies the signature against the issuer’s public key (fetched once from JWKS) and checks the claims **locally**, with no call back to the auth server on every request. That is why JWTs dominate access tokens and ID tokens. The same self-containment is the source of every footgun: the token is validated by rules the *server* must get exactly right, and a JWT you have issued is **valid until it expires** — there is no natural “log out.” The senior discipline is a short, fixed validation checklist applied on every request: verify the signature with a **pinned algorithm**, and check `exp` (not expired), `iss` (from whom I trust), and `aud` (**minted for me** — skipping this lets a token meant for service A be replayed at service B).',
            uk: '**JWT** (JSON Web Token, RFC 7519) — URL-safe, самодостатній токен — `header.payload.signature`, кожна частина base64url — підписаний як **JWS** (RFC 7515). Його суперсила — **stateless-валідація**: resource server перевіряє підпис публічним ключем issuer-а (взятим раз із JWKS) і перевіряє claims **локально**, без звернення до auth-сервера на кожен запит. Тому JWT домінують серед access-токенів та ID-токенів. Та сама самодостатність — джерело кожного footgun-а: токен валідується правилами, які *сервер* мусить виконати точно, а виданий тобою JWT **валідний до свого закінчення** — природного «log out» немає. Senior-дисципліна — короткий фіксований чекліст валідації на кожен запит: перевір підпис **закріпленим алгоритмом** і перевір `exp` (не прострочено), `iss` (від кого довіряю) і `aud` (**викарбувано для мене** — пропуск дозволяє токену для сервісу A бути реплейнутим у сервісі B).',
          },
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'The two classic JWT forgeries — pin the algorithm', uk: 'Дві класичні підробки JWT — закріплюй алгоритм' },
          md: {
            en: '**`alg: none`** — the attacker sets the header algorithm to `none` and strips the signature; a verifier that trusts the token’s own `alg` accepts an unsigned token. **RS256 → HS256 confusion** — the server holds an RSA *public* key to verify RS256; the attacker flips `alg` to HS256 (HMAC) and signs with that public key as the shared secret, and a verifier that reads `alg` from the token validates the forgery. Both have the same root cause and the same fix: **never read the algorithm from the token** — pin the expected algorithm(s) server-side and reject anything else. Also remember the payload is base64, **not encryption** (never put secrets in it), and that a long-lived JWT is a long-lived risk: keep TTLs short and use refresh tokens (RFC 8725 collects these best practices).',
            uk: '**`alg: none`** — атакувальник ставить алгоритм у header на `none` і зрізає підпис; верифікатор, що довіряє власному `alg` токена, приймає непідписаний токен. **RS256 → HS256 confusion** — сервер тримає RSA *публічний* ключ, щоб перевіряти RS256; атакувальник перемикає `alg` на HS256 (HMAC) і підписує цим публічним ключем як спільним секретом, а верифікатор, що читає `alg` із токена, валідує підробку. У обох одна причина й один фікс: **ніколи не читай алгоритм із токена** — закріпи очікуваний алгоритм(и) на сервері й відкидай решту. Памʼятай також, що payload — це base64, **а не шифрування** (не клади туди секрети), і що довгоживучий JWT — довгоживучий ризик: тримай TTL короткими й використовуй refresh-токени (RFC 8725 збирає ці практики).',
          },
        },
      ],
    },
    // ── T5 · mTLS & sender-constrained tokens ─────────────────────────────────
    {
      id: 'mtls',
      title: { en: 'mTLS & sender-constrained tokens', uk: 'mTLS і sender-constrained токени' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'A **bearer** token has one fatal property: *whoever holds it can use it*, so a token stolen from a log, a proxy, or memory is immediately replayable. Two mechanisms remove that property by **binding the token to a key only the real caller holds** — sender-constraining it. **mTLS** (mutual TLS, RFC 8705) authenticates the client with an **X.509 certificate** during the TLS handshake and can bind the access token to that certificate (the auth server records a hash in the `cnf.x5t#S256` claim); a stolen token is useless without the client’s private key. It is a *transport-layer* mechanism — excellent for **service-to-service** and high-assurance finance (FAPI), but it needs certificate issuance/rotation and TLS you control, and is impractical in browsers. **DPoP** (RFC 9449) achieves the same at the *application layer*: the client sends a per-request **proof JWT** signed by its own key, and the token is bound to that key (`cnf.jkt`) — which works where mTLS cannot, including browsers and mobile. Both appear side by side in FAPI 2.0; they are peers solving one problem at different layers.',
            uk: '**Bearer**-токен має одну фатальну властивість: *хто його тримає, той його й використає*, тож токен, вкрадений із логу, proxy чи памʼяті, одразу реплейовний. Два механізми прибирають цю властивість, **привʼязуючи токен до ключа, який має лише справжній викликач** — sender-constraining. **mTLS** (mutual TLS, RFC 8705) автентифікує client-а **X.509-сертифікатом** під час TLS-рукостискання й може привʼязати access token до цього сертифіката (auth server пише хеш у claim `cnf.x5t#S256`); украдений токен безкорисний без приватного ключа client-а. Це механізм *транспортного рівня* — чудовий для **service-to-service** і високонадійних фінансів (FAPI), але потребує видачі/ротації сертифікатів і TLS під твоїм контролем, і непрактичний у браузерах. **DPoP** (RFC 9449) досягає того самого на *рівні застосунку*: client шле per-request **proof JWT**, підписаний власним ключем, і токен привʼязується до цього ключа (`cnf.jkt`) — що працює там, де mTLS не може, включно з браузерами й мобільними. Обидва стоять поруч у FAPI 2.0; це рівні, що розвʼязують одну проблему на різних рівнях.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Inside the mesh, an identity can beat a token', uk: 'Усередині mesh ідентичність може бити токен' },
          md: {
            en: 'For internal service-to-service traffic, minting and validating a bearer JWT on every hop is often more moving parts than **mTLS in a service mesh**, where each workload gets a rotating certificate and mutual identity + encryption come for free at the transport. Reserve user-facing OAuth/OIDC tokens for the edge (where a human delegates access) and lean on mTLS identities between your own services — you get non-replayable, mutually-authenticated calls without a token-validation path in every service.',
            uk: 'Для внутрішнього service-to-service трафіку карбувати й валідувати bearer-JWT на кожному хопі — часто більше рухомих частин, ніж **mTLS у service mesh**, де кожен workload отримує ротаційний сертифікат, а взаємна ідентичність + шифрування дістаються безкоштовно на транспорті. Лиши користувацькі OAuth/OIDC-токени для edge (де людина делегує доступ) і спирайся на mTLS-ідентичності між власними сервісами — матимеш нереплейовні, взаємно автентифіковані виклики без шляху валідації токена в кожному сервісі.',
          },
        },
      ],
    },
    // ── T6 · Scopes & consent ─────────────────────────────────────────────────
    {
      id: 'scopes-consent',
      title: { en: 'Scopes, consent & authorization', uk: 'Scopes, consent та авторизація' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: '**Scopes** are the coarse permissions a token carries (`read:articles`, `write:orders`); **consent** is the user approving which scopes an app receives (the “App X wants to read your profile” screen). Two things senior engineers keep straight. First, **a scope is not authorization** — `write:orders` says the token is *allowed to attempt* order writes; it does **not** say this user owns *this* order. Object-level authorization (does the caller own the record?) is a **separate check the resource server always runs** — skipping it is BOLA/IDOR, the #1 API security risk. Second, the token proves *identity + scopes*; the *policy* behind them is your **authorization model** — **RBAC** (permissions via roles), **ABAC** (rules over attributes), or **ReBAC** (relationships, e.g. Google Zanzibar “user X is editor of doc Y”). Least privilege ties it together: request the **narrowest** scopes, keep tokens **short-lived**, and **audience-restrict** them so a token for one API cannot be replayed at another.',
            uk: '**Scopes** — грубі дозволи, які несе токен (`read:articles`, `write:orders`); **consent** — користувач схвалює, які scopes отримує застосунок (екран «Застосунок X хоче читати ваш профіль»). Дві речі, які senior тримає окремо. Перше: **scope — це не авторизація** — `write:orders` каже, що токену *дозволено спробувати* запис замовлень; він **не** каже, що цей користувач володіє *цим* замовленням. Обʼєктна авторизація (чи володіє викликач записом?) — це **окрема перевірка, яку resource server завжди робить**; пропуск — це BOLA/IDOR, ризик API безпеки №1. Друге: токен доводить *ідентичність + scopes*; *політика* за ними — це твоя **модель авторизації** — **RBAC** (дозволи через ролі), **ABAC** (правила над атрибутами) чи **ReBAC** (звʼязки, напр. Google Zanzibar «user X — editor doc Y»). Least privilege звʼязує все: проси **найвужчі** scopes, тримай токени **короткоживучими** й **audience-restrict**, щоб токен для одного API не реплеївся в іншому.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'Never enforce scope on the client', uk: 'Ніколи не примушуй scope на клієнті' },
          md: {
            en: 'Hiding a button because the token lacks `write:orders` is UX, not security — the client can call the endpoint anyway. **Enforcement lives at the resource server:** validate the token’s scopes *and* run the object-level ownership check on every request. A valid, correctly-scoped token that skips the ownership check still lets user A fetch user B’s invoice by changing an id in the path.',
            uk: 'Сховати кнопку, бо токен не має `write:orders` — це UX, а не безпека: client усе одно може викликати endpoint. **Примус живе на resource server:** валідуй scopes токена *і* виконуй перевірку власності обʼєкта на кожен запит. Валідний, коректно-scoped токен, що оминає перевірку власності, усе одно дасть користувачу A витягти інвойс користувача B, змінивши id у шляху.',
          },
        },
      ],
    },
    // ── T7 · Per-style auth + verdict ─────────────────────────────────────────
    {
      id: 'per-style-auth',
      title: { en: 'Auth per style & the verdict', uk: 'Auth у кожному стилі та вердикт' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The mechanisms are shared; only the **carrier** changes per style. **REST, GraphQL, SSE** (all HTTP request/response): `Authorization: Bearer <token>` — or a browser session **cookie**, which then drags in CSRF (m22). **gRPC**: per-call credentials in **metadata** (an `authorization` key), and/or **channel-level mTLS**; call-credentials and channel-credentials compose. **WebSockets**: the browser cannot set custom headers on the upgrade, so you pass a **short-lived ticket** as a query param or subprotocol, or authenticate in the **first message** — and you must validate `Origin` (CSWSH, m12). **Webhooks**: auth is *inverted* — the **provider** authenticates to **you** by **signing** the payload (HMAC, m15); you verify the signature, there is no bearer token. **Message brokers**: broker-level auth (SASL / mTLS) plus per-topic ACLs. Same identity model, four different envelopes.',
            uk: 'Механізми спільні; змінюється лише **носій** залежно від стилю. **REST, GraphQL, SSE** (усі HTTP request/response): `Authorization: Bearer <token>` — або браузерна session-**cookie**, що тягне за собою CSRF (m22). **gRPC**: per-call креденшели в **metadata** (ключ `authorization`) та/або **channel-level mTLS**; call-credentials і channel-credentials компонуються. **WebSockets**: браузер не може ставити власні headers на upgrade, тож ти передаєш **короткоживучий ticket** як query-параметр чи subprotocol або автентифікуєш у **першому повідомленні** — і мусиш валідувати `Origin` (CSWSH, m12). **Webhooks**: auth *інвертований* — **provider** автентифікується до **тебе**, **підписуючи** payload (HMAC, m15); ти перевіряєш підпис, bearer-токена немає. **Message brokers**: auth на рівні брокера (SASL / mTLS) плюс per-topic ACL. Та сама модель ідентичності, чотири різні конверти.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'The verdict', uk: 'Вердикт' },
          md: {
            en: 'Default to **short-lived, scoped, audience-bound tokens** over long-lived API keys; keys are fine for simple server-to-server and metering, but hash, scope, and rotate them. Use **OIDC** for user login and OAuth **access tokens** for API calls — never the reverse, and never an ID token at your API. Validate every **JWT** with a pinned algorithm and `exp`/`iss`/`aud` checks; keep TTLs short because you cannot revoke one mid-life. **Sender-constrain** high-value tokens with **mTLS or DPoP** so theft is not replay, and prefer **mTLS identities** between your own services. And above all: a valid token authenticates — it never authorizes. **Enforce object-level access at the resource server, every time.**',
            uk: 'За замовчуванням бери **короткоживучі, scoped, audience-bound токени** замість довгоживучих API keys; keys годяться для простого server-to-server і обліку, але хешуй, scope-уй і ротуй їх. Використовуй **OIDC** для логіну користувача й OAuth **access-токени** для API-викликів — ніколи навпаки, і ніколи ID-токен у своєму API. Валідуй кожен **JWT** закріпленим алгоритмом і перевірками `exp`/`iss`/`aud`; тримай TTL короткими, бо відкликати токен посеред життя не можна. **Sender-constrain** цінні токени через **mTLS чи DPoP**, щоб крадіжка не була реплеєм, і надавай перевагу **mTLS-ідентичностям** між власними сервісами. І головне: валідний токен автентифікує — він ніколи не авторизує. **Примушуй обʼєктний доступ на resource server, щоразу.**',
          },
        },
      ],
    },
  ],
  keyPoints: [
    { en: 'AuthN (who) and AuthZ (what) are separate: a valid token proves identity + scopes, never that this user may act on this specific object — object-level checks (BOLA/IDOR is #1) always run at the resource server.', uk: 'AuthN (хто) і AuthZ (що) — окремі: валідний токен доводить ідентичність + scopes, а не що цей користувач може діяти над цим конкретним обʼєктом — обʼєктні перевірки (BOLA/IDOR — №1) завжди на resource server.' },
    { en: 'API keys identify an app, not a user — simple for server-to-server and metering, but coarse, leak-prone, and without standard expiry; treat like a password (hash, scope, rotate) and keep them out of URLs.', uk: 'API keys ідентифікують застосунок, а не користувача — прості для server-to-server і обліку, але грубі, схильні до витоку й без стандартного expiry; стався як до пароля (хешуй, scope, ротуй) і тримай подалі від URL.' },
    { en: 'OAuth 2.1 (an in-progress IETF draft) = delegated authorization: use Authorization Code + PKCE (now mandatory); Implicit and ROPC are removed; Bearer tokens (RFC 6750) are holder-of-key → TLS-only, short-lived.', uk: 'OAuth 2.1 (IETF-чернетка в роботі) = делегована авторизація: бери Authorization Code + PKCE (тепер обовʼязковий); Implicit і ROPC прибрані; Bearer-токени (RFC 6750) — holder-of-key → лише TLS, короткоживучі.' },
    { en: 'OIDC adds authentication over OAuth: an ID token (a JWT) says who logged in and is for the client; the access token is for the API. Never use an access token as identity or send an ID token to your API.', uk: 'OIDC додає автентифікацію поверх OAuth: ID-токен (JWT) каже, хто залогінився, і призначений client-у; access-токен — для API. Ніколи не використовуй access-токен як ідентичність і не шли ID-токен у свій API.' },
    { en: 'A JWT is stateless and self-contained but unrevocable until exp — pin the algorithm (reject alg:none and RS256→HS256 confusion), validate aud/iss/exp, never store secrets in the base64 payload, keep TTLs short.', uk: 'JWT — stateless і самодостатній, але невідкличний до exp — закріпи алгоритм (відкидай alg:none і RS256→HS256 confusion), валідуй aud/iss/exp, ніколи не зберігай секрети в base64-payload, тримай TTL короткими.' },
    { en: 'Sender-constrain high-value tokens so theft ≠ replay: mTLS (RFC 8705, transport, cert-bound) or DPoP (RFC 9449, application layer, works in browsers). Carry auth per style — header, gRPC metadata, WS ticket/first message, or a signed webhook.', uk: 'Sender-constrain цінні токени, щоб крадіжка ≠ реплей: mTLS (RFC 8705, транспорт, cert-bound) чи DPoP (RFC 9449, рівень застосунку, працює в браузерах). Неси auth за стилем — header, gRPC metadata, WS ticket/перше повідомлення чи підписаний webhook.' },
  ],
  pitfalls: [
    {
      title: { en: 'Treating a valid token as authorization (BOLA/IDOR)', uk: 'Трактувати валідний токен як авторизацію (BOLA/IDOR)' },
      body: {
        en: 'A token proves who is calling and what scopes they hold — not that they own the object they are addressing. Skipping the object-level ownership check lets user A read user B’s record by changing an id in the path or body; this is Broken Object-Level Authorization, the OWASP API #1. Always validate scopes AND run the ownership/tenancy check at the resource server on every request.',
        uk: 'Токен доводить, хто викликає й які scopes має — а не що він володіє обʼєктом, до якого звертається. Пропуск перевірки власності обʼєкта дає користувачу A прочитати запис користувача B, змінивши id у шляху чи тілі; це Broken Object-Level Authorization, OWASP API №1. Завжди валідуй scopes І виконуй перевірку власності/tenancy на resource server на кожен запит.',
      },
    },
    {
      title: { en: 'JWT footguns: trusting the token’s own algorithm', uk: 'JWT-footgun-и: довіра власному алгоритму токена' },
      body: {
        en: 'Reading `alg` from the token enables alg:none (unsigned tokens accepted) and RS256→HS256 confusion (the public key used as an HMAC secret). Pin the expected algorithm server-side. Equally: validate aud (or a token for another service is accepted here), iss, and exp; do not put secrets in the readable payload; and do not assume a JWT can be revoked — it is valid until it expires.',
        uk: 'Читання `alg` із токена вмикає alg:none (приймаються непідписані токени) і RS256→HS256 confusion (публічний ключ як HMAC-секрет). Закріпи очікуваний алгоритм на сервері. Так само: валідуй aud (інакше токен для іншого сервісу приймається тут), iss і exp; не клади секрети в читабельний payload; і не думай, що JWT можна відкликати — він валідний до закінчення.',
      },
    },
    {
      title: { en: 'Long-lived, over-scoped, unbound secrets', uk: 'Довгоживучі, over-scoped, непривʼязані секрети' },
      body: {
        en: 'API keys in URLs and logs, access tokens that never expire, and one god-scope turn a single leak into full compromise. Prefer short-lived, least-privilege, audience-bound tokens; rotate keys and signing keys (via kid + JWKS); and sender-constrain (mTLS/DPoP) anything high-value so a stolen token cannot be replayed.',
        uk: 'API keys у URL і логах, access-токени, що ніколи не спливають, і один god-scope перетворюють один витік на повну компрометацію. Надавай перевагу короткоживучим, least-privilege, audience-bound токенам; ротуй keys і ключі підпису (через kid + JWKS); і sender-constrain (mTLS/DPoP) усе цінне, щоб украдений токен не реплеївся.',
      },
    },
  ],
  interview: [
    {
      q: {
        en: 'A single-page app must call your API on behalf of a logged-in user. Walk the flow from login to an authorized API call, and name each token and where it goes.',
        uk: 'SPA має викликати твій API від імені залогіненого користувача. Пройди flow від логіну до авторизованого API-виклику й назви кожен токен і куди він іде.',
      },
      a: {
        en: 'Login is OIDC over the Authorization Code flow with PKCE — never Implicit, which OAuth 2.1 removes. The SPA redirects the user to the authorization server with a PKCE code_challenge; the user authenticates and consents; the server returns a single-use code to an exact-match redirect URI; the SPA exchanges code + code_verifier at the token endpoint and gets back an ID token, an access token, and usually a refresh token. The ID token is a JWT for the SPA — it tells the app who logged in (sub, name) and is never sent to the API. The access token is for the API: the SPA calls with Authorization: Bearer <access-token>, and the resource server validates the signature against the issuer’s JWKS with a pinned algorithm, then checks exp, iss, and aud (is this token minted for me?) and the required scopes — and then runs the object-level authorization check that the user owns the resource. I would keep the access token in memory (or use a BFF that holds tokens server-side) rather than localStorage to limit XSS exposure, keep TTLs short, and rotate refresh tokens. The one-line summary: ID token to know who, access token to call the API, and a valid token still isn’t a yes until the ownership check passes.',
        uk: 'Логін — це OIDC поверх Authorization Code flow з PKCE — ніколи Implicit, який OAuth 2.1 прибирає. SPA перенаправляє користувача на authorization server із PKCE code_challenge; користувач автентифікується й дає consent; сервер повертає одноразовий code на redirect URI з точним збігом; SPA обмінює code + code_verifier на token endpoint і отримує ID-токен, access-токен і зазвичай refresh-токен. ID-токен — це JWT для SPA: він каже застосунку, хто залогінився (sub, name), і ніколи не шлеться в API. Access-токен — для API: SPA кличе з Authorization: Bearer <access-token>, а resource server валідує підпис проти JWKS issuer-а закріпленим алгоритмом, тоді перевіряє exp, iss і aud (чи для мене викарбувано токен?) і потрібні scopes — і далі виконує обʼєктну авторизацію, що користувач володіє ресурсом. Я тримав би access-токен у памʼяті (або через BFF, що тримає токени на сервері), а не в localStorage, щоб обмежити XSS-експозицію, тримав би TTL короткими й ротував refresh-токени. Підсумок у рядок: ID-токен, щоб знати хто, access-токен, щоб кликати API, і валідний токен усе одно не «так», доки не пройде перевірка власності.',
      },
      level: 'senior',
    },
    {
      q: {
        en: 'A security review of your JWT-based service auth flags “tokens can’t be revoked.” Is that a real problem, and what would you change?',
        uk: 'Security-review вашого JWT-based service-auth позначає «токени не можна відкликати». Це реальна проблема, і що б ти змінив?',
      },
      a: {
        en: 'It is real, and the reviewer is right: a JWT is self-contained and valid until exp, so if one leaks you cannot pull it back — a 24-hour token is a 24-hour window. But the answer is trade-off, not panic. First, shrink the window: short access-token TTLs (minutes) plus refresh tokens, so the blast radius is small and refresh rotation lets me detect reuse. Second, add revocation where it matters: a denylist keyed by jti for high-value operations, or switch those endpoints to token introspection (paying a call to the auth server) instead of purely local validation — you trade the stateless benefit for revocability exactly where you need it. Third, key rotation: signing keys carry a kid and are published via JWKS, so rotating the key invalidates every token signed with the old one — a blunt but effective mass revoke. Fourth, sender-constrain with mTLS or DPoP so a stolen token is not replayable in the first place. And for internal service-to-service, I would question whether bearer JWTs are even the right tool — mTLS identities in a mesh give mutually authenticated, non-replayable calls without a revocation problem to solve. The design axis is statelessness versus revocability; pick per operation by its value.',
        uk: 'Це реально, і рецензент має рацію: JWT самодостатній і валідний до exp, тож якщо він витече, повернути його не можна — токен на 24 години це вікно на 24 години. Але відповідь — це trade-off, а не паніка. Перше, зменш вікно: короткі TTL access-токенів (хвилини) плюс refresh-токени, щоб радіус ураження був малим, а ротація refresh давала виявити повторне використання. Друге, додай відкликання там, де воно важить: denylist за jti для цінних операцій або перемкни ці endpoint-и на token introspection (ціною виклику до auth-сервера) замість суто локальної валідації — ти міняєш stateless-вигоду на відкличність саме там, де треба. Третє, ротація ключів: ключі підпису несуть kid і публікуються через JWKS, тож ротація ключа інвалідує кожен токен, підписаний старим — грубий, але дієвий масовий revoke. Четверте, sender-constrain через mTLS чи DPoP, щоб украдений токен узагалі не реплеївся. А для внутрішнього service-to-service я б спитав, чи bearer-JWT взагалі правильний інструмент — mTLS-ідентичності в mesh дають взаємно автентифіковані, нереплейовні виклики без проблеми відкликання. Вісь дизайну — statelessness проти revocability; обирай на операцію за її цінністю.',
      },
      level: 'senior',
    },
  ],
  seeAlso: ['m22-security-threats', 'm15-webhooks', 'm12-websockets', 'm10-grpc', 'm5-rest'],
  sources: [
    { title: 'IETF — The OAuth 2.1 Authorization Framework (draft-ietf-oauth-v2-1)', url: 'https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/' },
    { title: 'RFC 6749 — The OAuth 2.0 Authorization Framework', url: 'https://www.rfc-editor.org/rfc/rfc6749.html' },
    { title: 'RFC 6750 — OAuth 2.0 Bearer Token Usage', url: 'https://www.rfc-editor.org/rfc/rfc6750.html' },
    { title: 'OpenID Connect Core 1.0 (incorporating errata set 2)', url: 'https://openid.net/specs/openid-connect-core-1_0.html' },
    { title: 'RFC 7519 — JSON Web Token (JWT)', url: 'https://www.rfc-editor.org/rfc/rfc7519.html' },
    { title: 'RFC 8725 — JSON Web Token Best Current Practices', url: 'https://www.rfc-editor.org/rfc/rfc8725.html' },
    { title: 'RFC 8705 — OAuth 2.0 Mutual-TLS Client Authentication & Certificate-Bound Access Tokens', url: 'https://www.rfc-editor.org/rfc/rfc8705.html' },
    { title: 'RFC 9449 — OAuth 2.0 Demonstrating Proof of Possession (DPoP)', url: 'https://www.rfc-editor.org/rfc/rfc9449.html' },
    { title: 'OWASP API Security Top 10 — API1:2023 Broken Object Level Authorization', url: 'https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/' },
  ],
};
