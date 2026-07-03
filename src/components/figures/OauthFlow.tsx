import { useLang } from '../../i18n/lang';

/*
 * oauth-flow (m17) — the OAuth 2.1 Authorization Code + PKCE grant as a four-actor sequence:
 *   User · Client (SPA) · Authorization Server · API (resource server).
 * ① client sends /authorize with a hashed PKCE code_challenge; ② the user authenticates + consents
 * AT the auth server (the password never reaches the client); ③ a one-time code redirects back;
 * ④ the client redeems code + the original code_verifier at /token; ⑤ the AS returns an access token
 * (+ ID token); ⑥ the client calls the API with an Authorization: Bearer token; ⑦ the resource returns.
 * Role names + "PKCE" + "Bearer" stay English in both locales (they are the smoke canaries).
 * Colours: violet = client, cyan = auth server, blue = API, amber = the PKCE binding, green = the token.
 */

const BODY = 'var(--font-body)';
const MONO = 'var(--font-mono)';

// lifeline x-centres
const U = 80;
const C = 250;
const A = 460;
const P = 650;

export function OauthFlow() {
  const { t } = useLang();

  return (
    <svg
      viewBox="0 0 720 312"
      className="fig-svg"
      role="img"
      aria-label={t({
        en: 'OAuth 2.1 Authorization Code with PKCE, as a sequence across four actors: User, Client (SPA), Authorization Server, and API. Step 1: the client requests /authorize with a hashed PKCE code_challenge. Step 2: the user authenticates and consents at the Authorization Server, so the password never reaches the client. Step 3: a one-time authorization code redirects back to the client. Step 4: the client posts the code plus the original code_verifier to /token. Step 5: the Authorization Server returns an access token and an ID token. Step 6: the client calls the API with an Authorization Bearer token. Step 7: the API returns the protected resource.',
        uk: 'OAuth 2.1 Authorization Code з PKCE як послідовність між чотирма акторами: User, Client (SPA), Authorization Server і API. Крок 1: client робить запит /authorize з хешованим PKCE code_challenge. Крок 2: користувач автентифікується й дає consent на Authorization Server, тож пароль ніколи не доходить до client-а. Крок 3: одноразовий authorization code редіректить назад до client-а. Крок 4: client постить code плюс початковий code_verifier на /token. Крок 5: Authorization Server повертає access token та ID token. Крок 6: client кличе API з Authorization Bearer токеном. Крок 7: API повертає захищений ресурс.',
      })}
    >
      {/* ── actor boxes ── */}
      {[
        { x: U, w: 88, label: 'User', color: 'var(--tx2)' },
        { x: C, w: 108, label: 'Client (SPA)', color: 'var(--accent)' },
        { x: A, w: 128, label: 'Auth Server', color: 'var(--accent-2)' },
        { x: P, w: 92, label: 'API', color: 'var(--c-query)' },
      ].map((a) => (
        <g key={a.label}>
          <rect x={a.x - a.w / 2} y={26} width={a.w} height={28} rx={7} fill="var(--s2)" stroke={a.color} strokeWidth={1.3} />
          <text x={a.x} y={44} textAnchor="middle" fill="var(--tx)" fontSize={11} fontFamily={MONO} fontWeight={700}>{a.label}</text>
          {/* lifeline */}
          <line x1={a.x} y1={54} x2={a.x} y2={300} stroke="var(--line2)" strokeWidth={1} strokeDasharray="4 5" />
        </g>
      ))}

      {/* ── ① Client → Auth: /authorize + code_challenge (PKCE) ── */}
      <line x1={C} y1={92} x2={A - 8} y2={92} stroke="var(--accent)" strokeWidth={1.6} />
      <polygon points={`${A},92 ${A - 9},88 ${A - 9},96`} fill="var(--accent)" />
      <circle cx={C} cy={92} r={8.5} fill="var(--surface)" stroke="var(--accent)" strokeWidth={1.2} />
      <text x={C} y={95.5} textAnchor="middle" fill="var(--tx)" fontSize={9} fontFamily={MONO} fontWeight={700}>1</text>
      <text x={358} y={86} textAnchor="middle" fill="var(--tx2)" fontSize={9} fontFamily={BODY}>
        GET /authorize · code_challenge
      </text>
      <text x={358} y={106} textAnchor="middle" fill="var(--c-analytics)" fontSize={8.5} fontFamily={MONO} fontWeight={700}>PKCE</text>

      {/* ── ② User → Auth: authenticate + consent (password stays at AS) ── */}
      <line x1={U} y1={132} x2={A - 8} y2={132} stroke="var(--tx2)" strokeWidth={1.4} />
      <polygon points={`${A},132 ${A - 9},128 ${A - 9},136`} fill="var(--tx2)" />
      <circle cx={U} cy={132} r={8.5} fill="var(--surface)" stroke="var(--tx2)" strokeWidth={1.2} />
      <text x={U} y={135.5} textAnchor="middle" fill="var(--tx)" fontSize={9} fontFamily={MONO} fontWeight={700}>2</text>
      <text x={250} y={126} textAnchor="middle" fill="var(--tx2)" fontSize={9} fontFamily={BODY}>
        {t({ en: 'authenticate + consent', uk: 'authenticate + consent' })}
      </text>
      <text x={250} y={146} textAnchor="middle" fill="var(--c-analytics)" fontSize={8} fontFamily={BODY} fontStyle="italic">
        {t({ en: 'password stays at the AS', uk: 'пароль лишається на AS' })}
      </text>

      {/* ── ③ Auth → Client: one-time code ── */}
      <line x1={A} y1={172} x2={C + 8} y2={172} stroke="var(--accent-2)" strokeWidth={1.6} />
      <polygon points={`${C},172 ${C + 9},168 ${C + 9},176`} fill="var(--accent-2)" />
      <circle cx={A} cy={172} r={8.5} fill="var(--surface)" stroke="var(--accent-2)" strokeWidth={1.2} />
      <text x={A} y={175.5} textAnchor="middle" fill="var(--tx)" fontSize={9} fontFamily={MONO} fontWeight={700}>3</text>
      <text x={358} y={166} textAnchor="middle" fill="var(--tx2)" fontSize={9} fontFamily={BODY}>
        {t({ en: 'redirect · one-time code', uk: 'редірект · одноразовий code' })}
      </text>

      {/* ── ④ Client → Auth: code + code_verifier → /token ── */}
      <line x1={C} y1={210} x2={A - 8} y2={210} stroke="var(--accent)" strokeWidth={1.6} />
      <polygon points={`${A},210 ${A - 9},206 ${A - 9},214`} fill="var(--accent)" />
      <circle cx={C} cy={210} r={8.5} fill="var(--surface)" stroke="var(--accent)" strokeWidth={1.2} />
      <text x={C} y={213.5} textAnchor="middle" fill="var(--tx)" fontSize={9} fontFamily={MONO} fontWeight={700}>4</text>
      <text x={358} y={204} textAnchor="middle" fill="var(--tx2)" fontSize={9} fontFamily={BODY}>
        POST /token · code + code_verifier
      </text>

      {/* ── ⑤ Auth → Client: access token (+ ID token) ── */}
      <line x1={A} y1={248} x2={C + 8} y2={248} stroke="var(--c-commit)" strokeWidth={1.8} />
      <polygon points={`${C},248 ${C + 9},244 ${C + 9},252`} fill="var(--c-commit)" />
      <circle cx={A} cy={248} r={8.5} fill="var(--surface)" stroke="var(--c-commit)" strokeWidth={1.2} />
      <text x={A} y={251.5} textAnchor="middle" fill="var(--tx)" fontSize={9} fontFamily={MONO} fontWeight={700}>5</text>
      <text x={358} y={242} textAnchor="middle" fill="var(--c-commit)" fontSize={9} fontFamily={BODY} fontWeight={600}>
        {t({ en: 'access token (+ ID token)', uk: 'access token (+ ID token)' })}
      </text>

      {/* ── ⑥ Client → API: Authorization: Bearer <token> ── */}
      <line x1={C} y1={280} x2={P - 8} y2={280} stroke="var(--c-commit)" strokeWidth={1.8} />
      <polygon points={`${P},280 ${P - 9},276 ${P - 9},284`} fill="var(--c-commit)" />
      <circle cx={C} cy={280} r={8.5} fill="var(--surface)" stroke="var(--c-commit)" strokeWidth={1.2} />
      <text x={C} y={283.5} textAnchor="middle" fill="var(--tx)" fontSize={9} fontFamily={MONO} fontWeight={700}>6</text>
      <text x={452} y={274} textAnchor="middle" fill="var(--tx)" fontSize={9} fontFamily={MONO} fontWeight={700}>Authorization: Bearer</text>

      {/* ── ⑦ API → Client: protected resource ── */}
      <line x1={P} y1={300} x2={C + 8} y2={300} stroke="var(--tx3)" strokeWidth={1.3} strokeDasharray="4 3" />
      <polygon points={`${C},300 ${C + 9},296 ${C + 9},304`} fill="var(--tx3)" />
      <circle cx={P} cy={300} r={8.5} fill="var(--surface)" stroke="var(--tx3)" strokeWidth={1.2} />
      <text x={P} y={303.5} textAnchor="middle" fill="var(--tx)" fontSize={9} fontFamily={MONO} fontWeight={700}>7</text>
      <text x={452} y={294} textAnchor="middle" fill="var(--tx3)" fontSize={9} fontFamily={BODY}>
        {t({ en: 'protected resource', uk: 'захищений ресурс' })}
      </text>
    </svg>
  );
}
