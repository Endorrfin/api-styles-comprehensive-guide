import { useLang } from '../../i18n/lang';

/*
 * trust-boundaries (m22) — the membrane is the whole subject. Three zones:
 *   LEFT  · UNTRUSTED — the internet: a browser, an attacker, a non-browser client (curl).
 *   MID   · the EDGE membrane — validate · authenticate · authorize (the only place trust is granted).
 *   RIGHT · TRUSTED — the service, its interpreter (DB), the metadata endpoint (169.254.169.254),
 *           the secret store.
 * Three threats are drawn by the line they cross:
 *   injection — untrusted data rides straight through the edge into the interpreter (Browser → DB).
 *   CSRF      — the browser auto-attaches the session cookie (Attacker → Service, ambient authority).
 *   SSRF      — the server is turned into a confused deputy reaching the metadata endpoint (Service → IMDS).
 * Technical tokens (CORS, CSRF, SSRF, 169.254.169.254, authn/authz) stay English in both locales — the
 * smoke canaries. Colours: danger = the threat crossings + the untrusted zone; accent (violet) = the
 * edge; commit (green) = the trusted zone; cyan = the metadata/secret jewels.
 * Ref: OWASP API Security Top 10 (2023) — SSRF = API7; CORS = Fetch/SOP relaxation.
 */

const BODY = 'var(--font-body)';
const MONO = 'var(--font-mono)';

export function TrustBoundaries() {
  const { t } = useLang();

  return (
    <svg
      viewBox="0 0 720 330"
      className="fig-svg"
      role="img"
      aria-label={t({
        en: 'Three zones separated by the API edge. On the left, an untrusted zone with a browser, an attacker and a non-browser client. In the middle, the edge membrane performs validate, authenticate and authorize. On the right, a trusted zone with the service, its database interpreter, the cloud metadata endpoint 169.254.169.254 and a secret store. Three threats are drawn by the boundary line they cross: injection sends untrusted data straight through the edge into the interpreter; CSRF has the browser auto-attach the session cookie to a request to the service; SSRF turns the server into a confused deputy that fetches the internal metadata endpoint.',
        uk: 'Три зони, розділені edge API. Ліворуч недовірена зона з браузером, атакером і не-браузерним клієнтом. Посередині мембрана edge виконує validate, authenticate та authorize. Праворуч довірена зона із сервісом, його базою-інтерпретатором, хмарним metadata endpoint 169.254.169.254 і сховищем секретів. Три загрози намальовані за межею, яку вони перетинають: injection шле недовірені дані просто крізь edge в інтерпретатор; CSRF змушує браузер автоматично причепити сесійний cookie до запиту в сервіс; SSRF робить сервер заплутаним депутатом, що фетчить внутрішній metadata endpoint.',
      })}
    >
      <text x="14" y="24" fill="var(--accent)" fontSize="12" fontFamily={MONO} fontWeight={700}>
        {t({ en: 'Trust boundary — what crosses the edge?', uk: 'Межа довіри — що перетинає edge?' })}
      </text>

      {/* ── zones ─────────────────────────────────────────────────────────── */}
      {/* untrusted */}
      <rect x="12" y="40" width="248" height="250" rx="10" fill="var(--c-danger-soft)" stroke="var(--c-danger)" strokeWidth="1.1" strokeDasharray="6 5" />
      <text x="24" y="60" fill="var(--c-danger)" fontSize="10" fontFamily={BODY} fontWeight={700}>
        {t({ en: 'UNTRUSTED — the internet', uk: 'UNTRUSTED — інтернет' })}
      </text>
      {/* trusted */}
      <rect x="404" y="40" width="304" height="250" rx="10" fill="var(--c-commit-soft)" stroke="var(--c-commit)" strokeWidth="1.1" />
      <text x="416" y="60" fill="var(--c-commit)" fontSize="10" fontFamily={BODY} fontWeight={700}>
        {t({ en: 'TRUSTED — behind the edge', uk: 'TRUSTED — за edge' })}
      </text>

      {/* ── the edge membrane ─────────────────────────────────────────────── */}
      <rect x="300" y="40" width="64" height="250" rx="10" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1.6" />
      <text x="332" y="60" textAnchor="middle" fill="var(--accent)" fontSize="11" fontFamily={MONO} fontWeight={700}>EDGE</text>
      <text x="332" y="120" textAnchor="middle" fill="var(--tx2)" fontSize="9.5" fontFamily={MONO}>validate</text>
      <text x="332" y="180" textAnchor="middle" fill="var(--tx2)" fontSize="9.5" fontFamily={MONO}>authn</text>
      <text x="332" y="240" textAnchor="middle" fill="var(--tx2)" fontSize="9.5" fontFamily={MONO}>authz</text>
      <text x="332" y="282" textAnchor="middle" fill="var(--tx3)" fontSize="8" fontFamily={BODY}>m17</text>

      {/* ── untrusted callers ─────────────────────────────────────────────── */}
      <rect x="120" y="88" width="124" height="30" rx="7" fill="var(--s2)" stroke="var(--c-danger)" strokeWidth="1.2" />
      <text x="182" y="107" textAnchor="middle" fill="var(--tx)" fontSize="10" fontFamily={MONO} fontWeight={700}>Attacker</text>
      <rect x="120" y="150" width="124" height="30" rx="7" fill="var(--s2)" stroke="var(--accent)" strokeWidth="1.1" />
      <text x="182" y="169" textAnchor="middle" fill="var(--tx)" fontSize="10" fontFamily={MONO} fontWeight={700}>Browser</text>
      <rect x="120" y="212" width="124" height="30" rx="7" fill="var(--s2)" stroke="var(--line2)" strokeWidth="1" />
      <text x="182" y="231" textAnchor="middle" fill="var(--tx2)" fontSize="10" fontFamily={MONO}>curl / server</text>

      {/* ── trusted internals ─────────────────────────────────────────────── */}
      <rect x="420" y="88" width="118" height="30" rx="7" fill="var(--c-storage-soft)" stroke="var(--accent)" strokeWidth="1.2" />
      <text x="479" y="107" textAnchor="middle" fill="var(--tx)" fontSize="10" fontFamily={MONO} fontWeight={700}>Service</text>
      <rect x="420" y="150" width="118" height="30" rx="7" fill="var(--s2)" stroke="var(--accent)" strokeWidth="1.1" />
      <text x="479" y="169" textAnchor="middle" fill="var(--tx)" fontSize="9.5" fontFamily={MONO}>DB · interpreter</text>
      <rect x="560" y="88" width="134" height="30" rx="7" fill="var(--accent-2-soft)" stroke="var(--accent-2)" strokeWidth="1.1" />
      <text x="627" y="107" textAnchor="middle" fill="var(--tx)" fontSize="9.5" fontFamily={MONO}>Secrets · KMS</text>
      <rect x="470" y="228" width="224" height="34" rx="7" fill="var(--accent-2-soft)" stroke="var(--accent-2)" strokeWidth="1.3" />
      <text x="582" y="243" textAnchor="middle" fill="var(--accent-2)" fontSize="9.5" fontFamily={MONO} fontWeight={700}>169.254.169.254</text>
      <text x="582" y="255" textAnchor="middle" fill="var(--tx3)" fontSize="8" fontFamily={BODY}>{t({ en: 'metadata — hands out creds', uk: 'metadata — роздає creds' })}</text>

      {/* ── threat 2 · CSRF: Attacker → Service (ambient cookie) ───────────── */}
      <text x="120" y="80" fill="var(--c-danger)" fontSize="8.5" fontFamily={BODY} fontWeight={700}>
        {t({ en: 'CSRF — cookie auto-attached', uk: 'CSRF — cookie чіпляється сам' })}
      </text>
      <line x1="244" y1="101" x2="418" y2="101" stroke="var(--c-danger)" strokeWidth="1.4" strokeDasharray="2 3" />
      <polygon points="420,101 410,96 410,106" fill="var(--c-danger)" />

      {/* ── threat 1 · injection: Browser → (through edge) → DB ────────────── */}
      <text x="120" y="142" fill="var(--c-danger)" fontSize="8.5" fontFamily={BODY} fontWeight={700}>
        {t({ en: 'injection — data becomes syntax', uk: 'injection — дані стають синтаксисом' })}
      </text>
      <line x1="244" y1="165" x2="418" y2="165" stroke="var(--c-danger)" strokeWidth="1.5" strokeDasharray="5 4" />
      <polygon points="420,165 410,160 410,170" fill="var(--c-danger)" />

      {/* ── threat 3 · SSRF: Service → metadata (confused deputy, routed clear of the DB box) ── */}
      <line x1="532" y1="118" x2="576" y2="225" stroke="var(--c-danger)" strokeWidth="1.5" strokeDasharray="5 4" />
      <polygon points="577,228 570,218 583,216" fill="var(--c-danger)" />
      <text x="556" y="176" fill="var(--c-danger)" fontSize="8.5" fontFamily={BODY} fontWeight={700}>
        {t({ en: 'SSRF —', uk: 'SSRF —' })}
      </text>
      <text x="556" y="188" fill="var(--c-danger)" fontSize="8.5" fontFamily={BODY} fontWeight={700}>
        {t({ en: 'confused deputy', uk: 'заплутаний депутат' })}
      </text>

      {/* ── bottom takeaway ───────────────────────────────────────────────── */}
      <line x1="12" y1="300" x2="708" y2="300" stroke="var(--line2)" strokeWidth="1" strokeDasharray="2 4" />
      <text x="12" y="318" fill="var(--tx2)" fontSize="9" fontFamily={BODY}>
        {t({
          en: 'CORS is a guard on the browser (left) — it never protects the server (right); a non-browser client ignores it.',
          uk: 'CORS — вартовий на браузері (ліворуч); він ніколи не захищає сервер (праворуч); не-браузерний клієнт його ігнорує.',
        })}
      </text>
    </svg>
  );
}
