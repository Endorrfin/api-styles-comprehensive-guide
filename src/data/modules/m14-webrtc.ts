import type { Module } from '../types';

/*
 * m14-webrtc — peer-to-peer media & data (s3, Real-time/push/event-driven). SIGNATURE: sim
 * 'webrtc-connect' (signaling → trickle ICE → checks → DTLS → P2P data, in three NAT scenarios).
 * Figure: 'webrtc-connection-paths'. Seven curriculum topics: P2P media & data channels (figure) →
 * the signaling problem → SDP offer/answer (JSEP) → ICE candidates (sim) → STUN/TURN NAT traversal →
 * DTLS/SRTP security → data channel vs media + the verdict. Facts web-verified S8: JSEP is RFC 9429
 * (Apr 2024, obsoletes 8829); suite RFC 8825 (overview) · 8445 (ICE) · 8838 (trickle) · 8489 (STUN) ·
 * 8656 (TURN) · 8831/8832 (data channels/DCEP) · 5763/5764 (DTLS-SRTP) · 7675 (consent) · 8828 (privacy);
 * W3C WebRTC 1.0 Rec updated 2025; browsers publish host candidates as mDNS `.local` names; ~20% of
 * public-internet connections need TURN (far more in locked-down enterprise networks); WHIP is RFC 9725
 * (2025), WHEP still an IETF draft in mid-2026.
 */
export const m14: Module = {
  id: 'm14-webrtc',
  num: 14,
  section: 's3-realtime-events',
  order: 3,
  level: 'staff',
  signature: true,
  title: { en: 'WebRTC', uk: 'WebRTC' },
  tagline: {
    en: 'Peer-to-peer media & data — the hard one.',
    uk: 'Peer-to-peer медіа та дані — складний варіант.',
  },
  readMins: 19,
  mentalModel: {
    en: 'Every other style in this guide connects a client to a server. WebRTC connects two **peers** directly: a **signaling** channel you provide introduces them (SDP offer/answer), **ICE** with STUN/TURN punches a path through NATs, **DTLS** keys the encryption, and then media (**SRTP**) and data (**SCTP**) flow browser↔browser — your server drops out of the data path entirely.',
    uk: 'Кожен інший стиль у цьому гіді зʼєднує клієнта з сервером. WebRTC зʼєднує два **peers** напряму: **signaling**-канал, який даєш ти, знайомить їх (SDP offer/answer), **ICE** зі STUN/TURN пробиває шлях крізь NAT-и, **DTLS** видає ключі шифрування — і далі медіа (**SRTP**) та дані (**SCTP**) течуть браузер↔браузер: твій сервер повністю випадає зі шляху даних.',
  },
  topics: [
    // ── T1 · P2P media & data channels (figure) ───────────────────────────────
    {
      id: 'p2p-media-and-data-channels',
      title: { en: 'Peer-to-peer media & data channels', uk: 'Peer-to-peer медіа та data channels' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'WebRTC changes the topology, not just the protocol. It carries two payload families over one peer connection: **media tracks** — audio/video as SRTP packet streams with codecs, jitter buffers, and loss concealment — and **data channels** (`RTCDataChannel`) — arbitrary bytes with configurable reliability. Going direct buys three things a server-relayed design can’t match: **latency** (one network hop, no round trip through your infrastructure — decisive for calls and games), **cost** (media bytes are the most expensive bytes you can proxy; P2P keeps them off your servers), and **confidentiality** (packets are end-to-end encrypted between the peers). The price is this module: between two browsers sit NATs and firewalls, and nothing about “connect directly” is simple.',
            uk: 'WebRTC змінює топологію, а не лише протокол. Через одне peer-зʼєднання він несе дві родини payload: **media tracks** — аудіо/відео як потоки SRTP-пакетів із кодеками, jitter buffer-ами й приховуванням втрат — та **data channels** (`RTCDataChannel`) — довільні байти з налаштовуваною надійністю. Прямий шлях купує три речі, недосяжні для дизайну з ретрансляцією через сервер: **latency** (один мережевий стрибок, без round trip через твою інфраструктуру — вирішально для дзвінків та ігор), **вартість** (медіа-байти — найдорожчі байти для проксіювання; P2P тримає їх поза твоїми серверами) і **конфіденційність** (пакети шифруються end-to-end між peers). Ціна — цей модуль: між двома браузерами стоять NAT-и й фаєрволи, і в «зʼєднатися напряму» немає нічого простого.',
          },
        },
        {
          kind: 'figure',
          fig: 'webrtc-connection-paths',
          caption: {
            en: 'The WebRTC triangle: your signaling server (violet, dashed) carries only SDP + ICE candidates; STUN answers “what’s my public address?”; media and data run peer↔peer over DTLS (cyan) — or through a TURN relay (amber) when NAT wins.',
            uk: 'Трикутник WebRTC: твій signaling-сервер (фіолетовий, пунктир) несе лише SDP + ICE candidates; STUN відповідає «яка моя публічна адреса?»; медіа й дані йдуть peer↔peer через DTLS (блакитний) — або крізь TURN relay (бурштиновий), коли перемагає NAT.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'P2P does not mean serverless', uk: 'P2P не означає serverless' },
          md: {
            en: 'A production WebRTC system still runs servers: a **signaling** service to introduce peers, a **STUN** server for address discovery, a **TURN** relay fleet for the connections that can’t go direct — and, for group calls, usually an **SFU** (Selective Forwarding Unit) that every peer connects to instead of meshing with each other. What disappears is the server *in the media path* for 1:1 — not your infrastructure.',
            uk: 'Продакшен-система WebRTC все одно тримає сервери: **signaling**-сервіс, щоб знайомити peers, **STUN**-сервер для виявлення адрес, флот **TURN**-relay для зʼєднань, які не можуть піти напряму, — а для групових дзвінків зазвичай ще й **SFU** (Selective Forwarding Unit), до якого підключається кожен peer замість mesh-у одне з одним. Зникає сервер *у медіа-шляху* для 1:1 — а не твоя інфраструктура.',
          },
        },
      ],
    },
    // ── T2 · The signaling problem ────────────────────────────────────────────
    {
      id: 'the-signaling-problem',
      title: { en: 'The signaling problem: WebRTC ships without it', uk: 'Проблема signaling: WebRTC іде без нього' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Here is the part that surprises everyone: **WebRTC standardizes everything except how peers find each other.** Two browsers can’t discover one another out of thin air — someone must carry the first messages between them: the session descriptions and the connection candidates. That carrier is **signaling**, and the standard (JSEP, RFC 9429) deliberately leaves it to you. Any full-duplex-ish channel works: a WebSocket (m12) is the usual choice, SSE + POST works, and nothing stops copy-paste over email — the peers only need an opaque envelope service. Your signaling server never parses SDP; it forwards blobs between two identities it has authenticated.',
            uk: 'Ось частина, що дивує всіх: **WebRTC стандартизує все, крім того, як peers знаходять одне одного.** Два браузери не можуть виявити одне одного з повітря — хтось мусить пронести між ними перші повідомлення: session descriptions і candidates зʼєднання. Цей носій — **signaling**, і стандарт (JSEP, RFC 9429) свідомо лишає його тобі. Підійде будь-який більш-менш full-duplex канал: WebSocket (m12) — звичний вибір, SSE + POST працює, і ніщо не заважає copy-paste через email — peers потрібен лише сервіс непрозорих конвертів. Твій signaling-сервер ніколи не парсить SDP; він пересилає blob-и між двома автентифікованими ідентичностями.',
          },
        },
        {
          kind: 'code',
          lang: 'js',
          code: `// The entire "signaling protocol": relay opaque blobs between the peers in a room.
wss.on('connection', (sock, req) => {
  const room = authenticate(req); // auth like any API (m17) — this IS your security boundary
  sock.on('message', (blob) => {
    // blob = an SDP offer/answer or an ICE candidate; the server never looks inside
    for (const peer of peersIn(room)) if (peer !== sock) peer.send(blob);
  });
});`,
          note: {
            en: 'Signaling is application logic, not a protocol: rooms, identity, and authorization are yours to design — and to secure (T6 explains why its integrity is the whole game).',
            uk: 'Signaling — це прикладна логіка, а не протокол: кімнати, ідентичність і авторизація — твої для дизайну — і для захисту (T6 пояснює, чому його цілісність вирішує все).',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'Glare: both sides call at once', uk: 'Glare: обидві сторони дзвонять водночас' },
          md: {
            en: 'If both peers create an offer simultaneously (“glare”), each rejects the other’s and the session wedges. The standard fix is MDN’s **perfect negotiation** pattern: designate one peer *polite* (rolls back its own offer on collision) and one *impolite* (ignores the incoming one). Bake it in from the start — renegotiation (adding a screen-share track, say) reopens the race every time.',
            uk: 'Якщо обидва peers створюють offer одночасно («glare»), кожен відкидає чужий, і сесія клинить. Стандартне виправлення — патерн **perfect negotiation** з MDN: признач одного peer-а *polite* (відкочує власний offer при колізії), іншого — *impolite* (ігнорує вхідний). Заклади це від початку — renegotiation (скажімо, додавання track-а screen-share) щоразу відкриває гонку знову.',
          },
        },
      ],
    },
    // ── T3 · SDP offer/answer (JSEP) ──────────────────────────────────────────
    {
      id: 'sdp-offer-answer',
      title: { en: 'SDP offer / answer: the JSEP dance', uk: 'SDP offer / answer: танець JSEP' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The messages signaling carries follow the **offer/answer** model (JSEP, RFC 9429). The caller runs `createOffer()` → `setLocalDescription()` and sends the resulting **SDP** blob; the callee runs `setRemoteDescription()` → `createAnswer()` → `setLocalDescription()` and sends the answer back. An SDP (Session Description Protocol, RFC 8866) is a line-oriented text format from the 90s describing *what* each side proposes: media sections (`m=` lines) with codecs and directions, **ICE credentials** (`ice-ufrag`/`ice-pwd`) that authenticate the upcoming connectivity checks, and the **DTLS certificate fingerprint** that will anchor encryption (T6). Treat it as an opaque token you move, not a document you edit — SDP munging is fragile and mostly a smell.',
            uk: 'Повідомлення, які несе signaling, слідують моделі **offer/answer** (JSEP, RFC 9429). Той, хто дзвонить, виконує `createOffer()` → `setLocalDescription()` і шле отриманий **SDP**-blob; той, кому дзвонять, — `setRemoteDescription()` → `createAnswer()` → `setLocalDescription()` і шле answer назад. SDP (Session Description Protocol, RFC 8866) — рядковий текстовий формат із 90-х, що описує, *що* пропонує кожна сторона: медіа-секції (рядки `m=`) з кодеками й напрямками, **ICE-креденшели** (`ice-ufrag`/`ice-pwd`), які автентифікують майбутні перевірки звʼязності, та **fingerprint DTLS-сертифіката**, що заякорить шифрування (T6). Стався до нього як до непрозорого токена, який ти переносиш, а не документа, який редагуєш, — SDP munging крихкий і здебільшого code smell.',
          },
        },
        {
          kind: 'code',
          lang: 'text',
          code: `v=0
o=- 4611731400430051336 2 IN IP4 127.0.0.1
…
m=application 9 UDP/DTLS/SCTP webrtc-datachannel   ← a data-channel media section
a=ice-ufrag:EsAw                                   ← ICE username fragment …
a=ice-pwd:P2uYro0UCOQ4zxjKXaWCBui1                 ← … and password: authenticate the checks
a=fingerprint:sha-256 D2:FA:0E:C3:22:59:5E:14:…    ← pins the DTLS certificate (T6)
a=setup:actpass                                    ← who plays DTLS client/server
a=sctp-port:5000                                   ← SCTP for data channels (T7)`,
          note: {
            en: 'A trimmed real offer. The answer mirrors it with concrete choices. Candidates may ride inside the SDP — but with trickle ICE (next topic) they usually arrive separately, later.',
            uk: 'Обрізаний реальний offer. Answer віддзеркалює його з конкретними виборами. Candidates можуть їхати всередині SDP — але з trickle ICE (наступна тема) вони зазвичай прибувають окремо, пізніше.',
          },
        },
      ],
    },
    // ── T4 · ICE candidates (the sim) ─────────────────────────────────────────
    {
      id: 'ice-candidates',
      title: { en: 'ICE: candidates, checks, and the winning pair', uk: 'ICE: candidates, перевірки й переможна пара' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'While SDP describes *what* to send, **ICE** (RFC 8445) figures out *where*. Each peer gathers **candidates** — addresses it might be reachable at: a **host** candidate (its own interface), a **server-reflexive** (`srflx`) candidate (its public address as seen by a STUN server), and a **relay** candidate (a TURN address, T5). With **trickle ICE** (RFC 8838) candidates stream to the other peer via signaling *as they’re discovered*, in parallel with the offer/answer, cutting seconds off setup. Then ICE pairs local×remote candidates and runs **connectivity checks** — STUN probes sent peer↔peer, authenticated with the SDP’s `ice-ufrag`/`ice-pwd` — and **nominates** the best pair that answers. Step the simulator through all three network scenarios and watch which pair wins each time.',
            uk: 'SDP описує, *що* слати, а **ICE** (RFC 8445) зʼясовує *куди*. Кожен peer збирає **candidates** — адреси, за якими він може бути досяжним: **host** candidate (власний інтерфейс), **server-reflexive** (`srflx`) candidate (його публічна адреса очима STUN-сервера) та **relay** candidate (TURN-адреса, T5). З **trickle ICE** (RFC 8838) candidates течуть до іншого peer-а через signaling *у міру виявлення*, паралельно з offer/answer, зрізаючи секунди з установлення. Далі ICE парує local×remote candidates і жене **перевірки звʼязності** — STUN-проби peer↔peer, автентифіковані `ice-ufrag`/`ice-pwd` з SDP, — і **номінує** найкращу пару, що відповіла. Проведи симулятор крізь усі три мережеві сценарії й подивися, яка пара перемагає щоразу.',
          },
        },
        {
          kind: 'sim',
          sim: 'webrtc-connect',
          caption: {
            en: 'Pick a scenario, then step the clock: offer/answer and candidates ride the signaling lane (dashed), checks probe pairs peer↔peer (✖ = the NAT ate it), the surviving pair is nominated, DTLS keys the pipe — and data flows without touching your server. Watch the sig/p2p counters.',
            uk: 'Обери сценарій і крокуй годинником: offer/answer та candidates їдуть смугою signaling (пунктир), перевірки пробують пари peer↔peer (✖ = NAT зʼїв), пара, що вижила, номінується, DTLS видає ключі — і дані течуть, не торкаючись твого сервера. Стеж за лічильниками sig/p2p.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Host candidates are mDNS names now', uk: 'Host candidates тепер — mDNS-імена' },
          md: {
            en: 'Host candidates used to leak your LAN IP to any page that opened an `RTCPeerConnection` — a fingerprinting classic. Today every major browser publishes host candidates as random **mDNS `.local` names** (resolved only on the local network) instead of raw private IPs, per the W3C/IETF privacy work around RFC 8828. Two consequences: the leak is largely closed, and LAN-only P2P still works — but if your candidate logs show `a1b2c3d4.local`, that’s a feature, not a bug.',
            uk: 'Host candidates колись зливали твій LAN IP будь-якій сторінці, що відкрила `RTCPeerConnection`, — класика fingerprinting-у. Сьогодні кожен великий браузер публікує host candidates як випадкові **mDNS-імена `.local`** (розвʼязуються лише в локальній мережі) замість сирих приватних IP — за privacy-роботою W3C/IETF довкола RFC 8828. Два наслідки: витік здебільшого закритий, а LAN-only P2P далі працює — тож якщо в логах candidates видно `a1b2c3d4.local`, це фіча, а не баг.',
          },
        },
      ],
    },
    // ── T5 · STUN / TURN / NAT traversal ──────────────────────────────────────
    {
      id: 'stun-turn-nat-traversal',
      title: { en: 'STUN, TURN & NAT traversal', uk: 'STUN, TURN і проходження NAT' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'NAT is why this is hard: your machine’s address is not what the internet sees, and inbound packets are dropped unless the NAT has a matching outbound mapping. **STUN** (RFC 8489) is the cheap fix — a tiny “what address do you see me as?” service. When both NATs reuse the same public mapping regardless of destination, the STUN-learned `srflx` addresses work: each peer’s outbound checks open its own NAT, the other’s packets arrive through the hole, and traffic flows direct. A **symmetric NAT** breaks this: it allocates a *different* port per destination, so the mapping the STUN server saw is useless to the peer — direct checks almost always fail (peer-reflexive discoveries occasionally rescue a symmetric-vs-cone pairing). The last resort is **TURN** (RFC 8656): a public relay the peer *allocates* an address on; both sides send through it. It always works — at the price of your bandwidth bill and an extra hop. Run TURN over TCP/TLS on **port 443** too, or UDP-blocking corporate firewalls will still strand users.',
            uk: 'NAT — причина, чому це складно: адреса твоєї машини — не та, яку бачить інтернет, а вхідні пакети відкидаються, якщо в NAT немає відповідного вихідного мапінгу. **STUN** (RFC 8489) — дешеве виправлення: крихітний сервіс «якою адресою ти мене бачиш?». Коли обидва NAT-и повторно використовують той самий публічний мапінг незалежно від призначення, вивчені через STUN `srflx`-адреси працюють: вихідні перевірки кожного peer-а відкривають його власний NAT, пакети іншого заходять крізь дірку — трафік тече напряму. **Симетричний NAT** це ламає: він виділяє *інший* порт на кожне призначення, тож мапінг, який бачив STUN-сервер, марний для peer-а — прямі перевірки майже завжди падають (peer-reflexive знахідки зрідка рятують пару symmetric-проти-cone). Останній засіб — **TURN** (RFC 8656): публічний relay, на якому peer *алокує* адресу; обидві сторони шлють через нього. Він працює завжди — ціною твого рахунку за трафік і зайвого стрибка. Запусти TURN також через TCP/TLS на **порту 443**, інакше корпоративні фаєрволи, що блокують UDP, все одно лишать користувачів за бортом.',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Candidate', uk: 'Candidate' },
            { en: 'Discovered via', uk: 'Виявляється через' },
            { en: 'Cost', uk: 'Вартість' },
            { en: 'When it wins', uk: 'Коли перемагає' },
          ],
          rows: [
            [
              { en: 'host', uk: 'host' },
              { en: 'local interfaces (as mDNS .local)', uk: 'локальні інтерфейси (як mDNS .local)' },
              { en: 'free', uk: 'безплатно' },
              { en: 'same LAN / open internet', uk: 'та сама LAN / відкритий інтернет' },
            ],
            [
              { en: 'srflx', uk: 'srflx' },
              { en: 'STUN Binding (RFC 8489)', uk: 'STUN Binding (RFC 8489)' },
              { en: 'a tiny query', uk: 'крихітний запит' },
              { en: 'ordinary NATs on both sides', uk: 'звичайні NAT-и з обох боків' },
            ],
            [
              { en: 'relay', uk: 'relay' },
              { en: 'TURN Allocate (RFC 8656)', uk: 'TURN Allocate (RFC 8656)' },
              { en: 'your bandwidth + a hop', uk: 'твій трафік + стрибок' },
              { en: 'symmetric NAT / strict firewalls', uk: 'симетричний NAT / суворі фаєрволи' },
            ],
          ],
          caption: {
            en: 'ICE prefers the cheapest pair that actually answers: host, then srflx, then relay.',
            uk: 'ICE віддає перевагу найдешевшій парі, що справді відповідає: host, потім srflx, потім relay.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'No TURN = no product for ~1 in 5 users', uk: 'Без TURN = нема продукту для ~1 з 5 користувачів' },
          md: {
            en: 'Commonly cited industry numbers put **roughly 20% of public-internet WebRTC connections** on TURN — and far more inside locked-down enterprise networks (symmetric NATs, UDP blocked). A demo without TURN works on your Wi-Fi and dies in exactly the networks your enterprise customers live in. Budget TURN (or a managed service) from day one, and monitor your relay ratio — it’s also a canary for network regressions.',
            uk: 'Загальновживані галузеві цифри ставлять **приблизно 20% WebRTC-зʼєднань публічного інтернету** на TURN — і значно більше всередині закручених корпоративних мереж (симетричні NAT-и, заблокований UDP). Демо без TURN працює на твоєму Wi-Fi і вмирає рівно в тих мережах, де живуть твої enterprise-клієнти. Закладай TURN (чи managed-сервіс) із першого дня й моніторь частку relay — це ще й канарка мережевих регресій.',
          },
        },
      ],
    },
    // ── T6 · DTLS / SRTP security ─────────────────────────────────────────────
    {
      id: 'dtls-srtp-security',
      title: { en: 'DTLS & SRTP: security you can’t turn off', uk: 'DTLS і SRTP: безпека, яку не вимкнеш' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Unlike HTTP, where TLS is a deployment choice, **WebRTC encryption is mandatory by spec**. Once ICE nominates a pair, the peers run a **DTLS** handshake over it (TLS for datagrams). Data channels are SCTP *inside* that DTLS session (T7); media keys for **SRTP** are derived from the same handshake via **DTLS-SRTP** (RFC 5763/5764). The certificates are self-signed and generated per-connection — so what stops a man-in-the-middle? The **`a=fingerprint`** line: each side’s certificate hash travels in the SDP, and the DTLS handshake fails unless the presented certificate matches it. Follow the chain: the fingerprint rode your **signaling** channel — so the confidentiality of the P2P link reduces to the **integrity of signaling**. Two operational notes: **consent freshness** (RFC 7675) keeps sending only while periodic STUN checks still get answers — when a peer vanishes, transmission to it ceases within ~30 seconds; and a TURN relay forwards **ciphertext it cannot read**, so using one concedes bandwidth, not confidentiality.',
            uk: 'На відміну від HTTP, де TLS — вибір деплою, **шифрування WebRTC обовʼязкове за специфікацією**. Щойно ICE номінує пару, peers женуть по ній **DTLS**-рукостискання (TLS для датаграм). Data channels — це SCTP *всередині* тієї DTLS-сесії (T7); ключі медіа для **SRTP** виводяться з того самого рукостискання через **DTLS-SRTP** (RFC 5763/5764). Сертифікати самопідписані й генеруються на зʼєднання — то що спиняє man-in-the-middle? Рядок **`a=fingerprint`**: хеш сертифіката кожної сторони їде в SDP, і DTLS-рукостискання падає, якщо предʼявлений сертифікат йому не відповідає. Простеж ланцюг: fingerprint їхав твоїм **signaling**-каналом — тож конфіденційність P2P-лінка зводиться до **цілісності signaling**. Дві операційні нотатки: **consent freshness** (RFC 7675) дозволяє слати лише поки періодичні STUN-перевірки отримують відповіді — коли peer зникає, передача до нього припиняється за ~30 секунд; а TURN relay пересилає **шифротекст, який не може прочитати**, тож relay коштує трафіку, не конфіденційності.',
          },
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'Your signaling server is the trust anchor', uk: 'Твій signaling-сервер — якір довіри' },
          md: {
            en: 'A compromised signaling server doesn’t need to break DTLS — it can **swap fingerprints and candidates** and quietly become both endpoints (a full MITM), or join the room as a silent extra peer. Defend it like the crown jewels: WSS/HTTPS only, authenticate every participant (m17), authorize room membership, and log SDP exchanges. For threat models that distrust even the signaling operator, end-to-end payload encryption on top (e.g. insertable streams / SFrame-style) is the remaining tool.',
            uk: 'Скомпрометованому signaling-серверу не треба ламати DTLS — він може **підмінити fingerprints і candidates** і тихо стати обома кінцями (повний MITM) або зайти в кімнату тихим зайвим peer-ом. Захищай його як коштовності корони: лише WSS/HTTPS, автентифікуй кожного учасника (m17), авторизуй членство в кімнаті, логуй обміни SDP. Для моделей загроз, що не довіряють навіть оператору signaling, лишається end-to-end шифрування payload зверху (напр., insertable streams / у стилі SFrame).',
          },
        },
      ],
    },
    // ── T7 · Data channel vs media + the verdict ──────────────────────────────
    {
      id: 'data-channel-vs-media',
      title: { en: 'Data channel vs media — and when to use WebRTC', uk: 'Data channel проти медіа — і коли брати WebRTC' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: '**Data channels** (RFC 8831) run SCTP over the DTLS session, with channels opened in-band by a tiny protocol (DCEP, RFC 8832). Their superpower is per-channel delivery semantics: the defaults give you an ordered, reliable, message-oriented stream (TCP-ish), while two knobs — `ordered:false` and `maxRetransmits`/`maxPacketLifeTime` — dial it down to UDP-ish. That makes one connection carry, say, a reliable chat channel *and* a lossy 60 Hz game-state channel, each with the right semantics. **Media tracks** are the other family: SRTP packet streams where the browser owns codecs, jitter buffers, loss concealment, and congestion control — you operate them via tracks and stats, not bytes.',
            uk: '**Data channels** (RFC 8831) женуть SCTP через DTLS-сесію, а канали відкриваються in-band крихітним протоколом (DCEP, RFC 8832). Їхня суперсила — семантика доставки на канал: дефолти дають упорядкований, надійний, message-oriented потік (TCP-подібно), а дві ручки — `ordered:false` і `maxRetransmits`/`maxPacketLifeTime` — скручують його до UDP-подібного. Тож одне зʼєднання несе, скажімо, надійний канал чату *і* lossy-канал ігрового стану на 60 Гц, кожен із правильною семантикою. **Media tracks** — інша родина: потоки SRTP-пакетів, де браузер володіє кодеками, jitter buffer-ами, приховуванням втрат і congestion control — ти керуєш ними через tracks і статистику, а не байти.',
          },
        },
        {
          kind: 'code',
          lang: 'js',
          code: `// One peer connection, two delivery semantics:
const chat  = pc.createDataChannel('chat');                    // reliable + ordered (default) — TCP-ish
const state = pc.createDataChannel('state', {
  ordered: false,                                              // late ≠ blocking
  maxRetransmits: 0,                                           // never retransmit — UDP-ish
});
state.onmessage = (e) => applyLatest(JSON.parse(e.data));      // latest snapshot beats stale delta`,
          note: {
            en: 'Semantics are chosen per channel at creation — retrofitting “make it lossy” onto one shared channel later means a protocol redesign.',
            uk: 'Семантику обирають на канал при створенні — прикрутити «зроби lossy» до одного спільного каналу потім означає редизайн протоколу.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: 'Reality check for scale: browsers talking to **media servers** is still WebRTC — that’s how large calls (SFU forwards everyone’s streams) and sub-second live streaming work. The signaling for that client↔server case is now standardized over plain HTTP: **WHIP** (ingest, RFC 9725) and **WHEP** (playback — still an IETF draft in mid-2026, though widely implemented). So the honest framing isn’t “P2P vs servers”; it’s that WebRTC is the **transport for real-time media wherever it terminates**, and pure P2P is its 1:1 special case.',
            uk: 'Перевірка реальністю для масштабу: браузери, що говорять із **медіа-серверами**, — це теж WebRTC: так працюють великі дзвінки (SFU переслає стріми всіх) і live-стримінг із затримкою менше секунди. Signaling для цього випадку клієнт↔сервер тепер стандартизований поверх звичайного HTTP: **WHIP** (інгест, RFC 9725) і **WHEP** (відтворення — у середині 2026-го досі IETF-draft, хоч і широко реалізований). Тож чесне формулювання — не «P2P проти серверів», а: WebRTC — це **транспорт для real-time медіа, де б воно не термінувалося**, і чистий P2P — його окремий випадок 1:1.',
          },
        },
        {
          kind: 'compare',
          a: { en: 'Reach for WebRTC', uk: 'Бери WebRTC' },
          b: { en: 'Prefer WebSockets / SSE / HTTP', uk: 'Обери WebSockets / SSE / HTTP' },
          rows: [
            [
              { en: 'Payload', uk: 'Payload' },
              { en: 'Live audio/video; latency-critical data', uk: 'Живе аудіо/відео; критичні до latency дані' },
              { en: 'Messages, JSON, events — WS/SSE (m12/m13)', uk: 'Повідомлення, JSON, події — WS/SSE (m12/m13)' },
            ],
            [
              { en: 'Topology', uk: 'Топологія' },
              { en: 'Peer↔peer (or peer↔SFU) media paths', uk: 'Peer↔peer (чи peer↔SFU) медіа-шляхи' },
              { en: 'Plain client↔server — no ICE needed', uk: 'Звичайний client↔server — ICE не потрібен' },
            ],
            [
              { en: 'Loss tolerance', uk: 'Толерантність до втрат' },
              { en: 'Unreliable/unordered channels beat TCP', uk: 'Unreliable/unordered канали бʼють TCP' },
              { en: 'Everything must arrive → TCP is fine', uk: 'Усе має дійти → TCP достатньо' },
            ],
            [
              { en: 'Ops budget', uk: 'Бюджет експлуатації' },
              { en: 'Signaling + STUN + TURN (+ SFU) accepted', uk: 'Signaling + STUN + TURN (+ SFU) прийнятні' },
              { en: 'One server endpoint is the whole story', uk: 'Один серверний endpoint — уся історія' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'The verdict', uk: 'Вердикт' },
          md: {
            en: 'Use WebRTC when the payload is **live media** (calls, conferencing, sub-second streaming via SFU/WHIP) or **latency-critical data between peers** (games, collaborative cursors, P2P file transfer) — nothing else moves audio/video in real time from a browser. Avoid it when a client↔server socket does the job: for chat, notifications, and dashboards, WebSockets (m12) or SSE (m13) deliver with a fraction of the moving parts. The power is the direct, encrypted, loss-tolerant pipe; the price is the connection story you just read — signaling you must build, TURN you must run, and a trust anchor you must guard.',
            uk: 'Бери WebRTC, коли payload — **живе медіа** (дзвінки, конференції, стримінг із суб-секундною затримкою через SFU/WHIP) або **критичні до latency дані між peers** (ігри, спільні курсори, P2P-передача файлів) — ніщо інше не рухає аудіо/відео в реальному часі з браузера. Уникай його, коли справу робить сокет клієнт↔сервер: для чату, нотифікацій і дашбордів WebSockets (m12) чи SSE (m13) доставляють із часткою рухомих частин. Сила — прямий, шифрований, толерантний до втрат канал; ціна — щойно прочитана історія зʼєднання: signaling, який мусиш збудувати, TURN, який мусиш тримати, і якір довіри, який мусиш стерегти.',
          },
        },
      ],
    },
  ],
  keyPoints: [
    { en: 'WebRTC connects peers directly: SRTP media + SCTP data channels over one DTLS-secured connection — the server leaves the data path.', uk: 'WebRTC зʼєднує peers напряму: SRTP-медіа + SCTP data channels через одне DTLS-захищене зʼєднання — сервер полишає шлях даних.' },
    { en: 'It ships without signaling (JSEP, RFC 9429): you carry SDP offers/answers and trickled ICE candidates over your own channel — usually a WebSocket.', uk: 'Він іде без signaling (JSEP, RFC 9429): SDP offer/answer і trickle ICE candidates ти носиш власним каналом — зазвичай WebSocket-ом.' },
    { en: 'ICE (RFC 8445) gathers host/srflx/relay candidates, checks pairs peer↔peer, and nominates the cheapest one that answers; trickle (RFC 8838) overlaps it all with signaling.', uk: 'ICE (RFC 8445) збирає host/srflx/relay candidates, перевіряє пари peer↔peer і номінує найдешевшу, що відповідає; trickle (RFC 8838) накладає це все на signaling.' },
    { en: 'STUN (RFC 8489) learns your public address and beats ordinary NATs; symmetric NAT defeats it, and TURN (RFC 8656) relays — ~20% of public-internet connections need it.', uk: 'STUN (RFC 8489) дізнається твою публічну адресу і бʼє звичайні NAT-и; симетричний NAT його перемагає, і тоді ретранслює TURN (RFC 8656) — він потрібен ~20% зʼєднань публічного інтернету.' },
    { en: 'Encryption is mandatory: DTLS keys both SCTP data and SRTP media (RFC 5763/5764); the fingerprint rides the SDP, so P2P security reduces to signaling integrity.', uk: 'Шифрування обовʼязкове: DTLS видає ключі і для SCTP-даних, і для SRTP-медіа (RFC 5763/5764); fingerprint їде в SDP, тож P2P-безпека зводиться до цілісності signaling.' },
    { en: 'P2P ≠ serverless: production WebRTC still means signaling, STUN, TURN — and usually an SFU (with WHIP/WHEP over HTTP) once calls grow past a few peers.', uk: 'P2P ≠ serverless: продакшен-WebRTC — це все одно signaling, STUN, TURN — і зазвичай SFU (з WHIP/WHEP поверх HTTP), щойно дзвінки переростають кілька peers.' },
  ],
  pitfalls: [
    {
      title: { en: 'Shipping without TURN', uk: 'Реліз без TURN' },
      body: {
        en: 'The demo connects on your office Wi-Fi, so the relay feels optional — then roughly a fifth of real-world connections (and most locked-down enterprise networks with symmetric NAT or blocked UDP) simply never connect. Deploy TURN — including TCP/TLS on 443 — from day one and watch your relay ratio.',
        uk: 'Демо зʼєднується на офісному Wi-Fi, тож relay здається необовʼязковим — а потім приблизно пʼята частина реальних зʼєднань (і більшість закручених корпоративних мереж із симетричним NAT чи заблокованим UDP) просто ніколи не зʼєднується. Розгорни TURN — включно з TCP/TLS на 443 — з першого дня і стеж за часткою relay.',
      },
    },
    {
      title: { en: 'Using WebRTC where a WebSocket belongs', uk: 'WebRTC там, де місце WebSocket-у' },
      body: {
        en: 'WebRTC’s complexity budget (signaling, ICE, STUN/TURN, DTLS) buys a peer-to-peer, loss-tolerant media pipe — not a better client↔server socket. If your payload is JSON between a browser and your backend, WebSockets or SSE deliver the same result with an order of magnitude less machinery.',
        uk: 'Бюджет складності WebRTC (signaling, ICE, STUN/TURN, DTLS) купує peer-to-peer, толерантний до втрат медіа-канал — а не кращий сокет клієнт↔сервер. Якщо твій payload — JSON між браузером і твоїм бекендом, WebSockets чи SSE дають той самий результат на порядок меншою машинерією.',
      },
    },
    {
      title: { en: 'Full mesh for group calls', uk: 'Full mesh для групових дзвінків' },
      body: {
        en: 'P2P tempts you to mesh everyone with everyone: n peers means n−1 upstream encodes per client and n(n−1)/2 connections — laptops melt around 4–6 participants. Group products use an SFU: every peer sends once, the server forwards selectively. Plan that topology change before it becomes a rewrite.',
        uk: 'P2P спокушає змешити всіх з усіма: n peers — це n−1 upstream-кодувань на клієнта й n(n−1)/2 зʼєднань — ноутбуки плавляться десь на 4–6 учасниках. Групові продукти використовують SFU: кожен peer шле раз, сервер переслає вибірково. Плануй цю зміну топології до того, як вона стане переписуванням.',
      },
    },
  ],
  interview: [
    {
      q: { en: 'A user clicks “Call”. Walk me through everything until video flows — and what changes on a hostile network.', uk: 'Користувач тисне «Подзвонити». Проведи мене через усе до потоку відео — і що змінюється у ворожій мережі.' },
      a: {
        en: 'The caller’s browser captures media, creates an RTCPeerConnection, createOffer() → setLocalDescription(), and sends the SDP offer over the app’s signaling channel (say, a WebSocket). The callee sets it as remote, createAnswer() → setLocalDescription(), and returns the answer. In parallel — trickle ICE — both sides stream candidates via signaling as they’re gathered: host (published as mDNS .local names), srflx from a STUN Binding, relay from a TURN Allocate if configured. ICE pairs candidates and runs STUN connectivity checks peer↔peer, authenticated by the SDP’s ice-ufrag/pwd, then nominates the best working pair. Over that pair the peers run DTLS; the handshake is pinned by the a=fingerprint from the SDP, and it keys SRTP for media and SCTP for data channels — then video flows directly. On a friendly network the host or srflx pair wins and the server carries nothing but signaling. On a hostile one — symmetric NAT or UDP blocked — direct and srflx checks fail, and everything relays through TURN (ideally TCP/TLS on 443), still end-to-end encrypted: the relay forwards ciphertext. That fallback is why TURN is a launch requirement, not an optimization: roughly a fifth of public-internet connections need it, more in enterprise.',
        uk: 'Браузер того, хто дзвонить, захоплює медіа, створює RTCPeerConnection, createOffer() → setLocalDescription() і шле SDP offer через signaling-канал застосунку (скажімо, WebSocket). Інша сторона ставить його як remote, createAnswer() → setLocalDescription() і повертає answer. Паралельно — trickle ICE — обидві сторони течуть candidates через signaling у міру збирання: host (опубліковані як mDNS-імена .local), srflx зі STUN Binding, relay з TURN Allocate, якщо налаштований. ICE парує candidates і жене STUN-перевірки звʼязності peer↔peer, автентифіковані ice-ufrag/pwd з SDP, і номінує найкращу робочу пару. По ній peers женуть DTLS; рукостискання запінене a=fingerprint з SDP і видає ключі SRTP для медіа та SCTP для data channels — і відео тече напряму. У дружній мережі перемагає пара host чи srflx, і сервер не несе нічого, крім signaling. У ворожій — симетричний NAT чи заблокований UDP — прямі й srflx-перевірки падають, і все ретранслюється через TURN (в ідеалі TCP/TLS на 443), досі шифроване end-to-end: relay переслає шифротекст. Цей fallback — причина, чому TURN є вимогою запуску, а не оптимізацією: він потрібен приблизно пʼятій частині зʼєднань публічного інтернету, в enterprise — більше.',
      },
      level: 'staff',
    },
    {
      q: { en: 'When would you pick WebRTC over WebSockets — and what infrastructure does that choice commit you to?', uk: 'Коли ти обереш WebRTC замість WebSockets — і до якої інфраструктури це тебе зобовʼязує?' },
      a: {
        en: 'Pick WebRTC when the payload demands it: live audio/video (it’s the only browser-native real-time media transport, with codecs, jitter buffers and congestion control built in), or peer-to-peer, loss-tolerant data — game state, collaborative cursors, file transfer — where unordered/unreliable data channels beat TCP’s head-of-line blocking. For browser↔server messaging — chat, notifications, live dashboards — WebSockets win on simplicity: one stateful socket, no ICE. The commitment: WebRTC keeps servers, it just moves them. You must build and secure signaling (it carries the DTLS fingerprints — its integrity IS the security model), run or rent STUN and TURN (TURN carries ~20% of connections and your bandwidth bill), and for group calls an SFU, since full mesh dies at a handful of peers. If the payload is JSON to your backend, that stack is pure overhead — the axes from m2 (topology: peer-to-peer vs client-server) decide it.',
        uk: 'Бери WebRTC, коли цього вимагає payload: живе аудіо/відео (це єдиний нативний для браузера real-time медіа-транспорт із вбудованими кодеками, jitter buffer-ами й congestion control) або peer-to-peer, толерантні до втрат дані — ігровий стан, спільні курсори, передача файлів — де unordered/unreliable data channels бʼють head-of-line blocking TCP. Для повідомлень браузер↔сервер — чат, нотифікації, живі дашборди — WebSockets виграють простотою: один stateful-сокет, без ICE. Зобовʼязання: WebRTC зберігає сервери, лише пересуває їх. Мусиш збудувати й захистити signaling (він несе DTLS-fingerprints — його цілісність І Є моделлю безпеки), тримати чи орендувати STUN і TURN (TURN несе ~20% зʼєднань і твій рахунок за трафік), а для групових дзвінків — SFU, бо full mesh вмирає на жмені peers. Якщо payload — це JSON до твого бекенда, той стек — чистий overhead; вирішують осі з m2 (топологія: peer-to-peer проти client-server).',
      },
      level: 'staff',
    },
  ],
  seeAlso: ['m12-websockets', 'm13-sse', 'm3-http-transport', 'm16-async-messaging', 'm22-security-threats', 'm17-auth-identity'],
  sources: [
    { title: 'RFC 8825 — Overview: Real-Time Protocols for Browser-Based Applications', url: 'https://datatracker.ietf.org/doc/html/rfc8825' },
    { title: 'RFC 9429 — JavaScript Session Establishment Protocol (JSEP)', url: 'https://datatracker.ietf.org/doc/html/rfc9429' },
    { title: 'RFC 8445 — Interactive Connectivity Establishment (ICE)', url: 'https://datatracker.ietf.org/doc/html/rfc8445' },
    { title: 'RFC 8838 — Trickle ICE', url: 'https://datatracker.ietf.org/doc/html/rfc8838' },
    { title: 'RFC 8489 — Session Traversal Utilities for NAT (STUN)', url: 'https://datatracker.ietf.org/doc/html/rfc8489' },
    { title: 'RFC 8656 — Traversal Using Relays around NAT (TURN)', url: 'https://datatracker.ietf.org/doc/html/rfc8656' },
    { title: 'RFC 8831 — WebRTC Data Channels', url: 'https://datatracker.ietf.org/doc/html/rfc8831' },
    { title: 'RFC 5764 — DTLS Extension to Establish Keys for SRTP (DTLS-SRTP)', url: 'https://datatracker.ietf.org/doc/html/rfc5764' },
    { title: 'W3C — WebRTC: Real-Time Communication in Browsers (Recommendation)', url: 'https://www.w3.org/TR/webrtc/' },
    { title: 'RFC 9725 — WebRTC-HTTP Ingestion Protocol (WHIP)', url: 'https://datatracker.ietf.org/doc/html/rfc9725' },
  ],
};
