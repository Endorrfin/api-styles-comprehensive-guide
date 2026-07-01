import { useLang } from '../../i18n/lang';

/*
 * graphql-over-under-fetching (m9) — the REST delta that motivates GraphQL. LEFT (REST, neutral/violet):
 * fixed endpoints return fixed payloads, so a screen over-fetches unused fields AND needs several round
 * trips (under-fetch). RIGHT (GraphQL, accent-2 cyan): one endpoint, the client's query shape IS the
 * response shape — exactly the fields asked for, in one request.
 */
export function GraphqlOverUnderFetching() {
  const { t } = useLang();
  return (
    <svg
      viewBox="0 0 720 292"
      className="fig-svg"
      role="img"
      aria-label={t({
        en: 'REST versus GraphQL fetching: REST needs several endpoints and returns unused fields (over- and under-fetching); GraphQL uses one endpoint and returns exactly the requested fields.',
        uk: 'REST проти GraphQL: REST потребує кількох endpoint-ів і повертає невикористані поля (over- та under-fetching); GraphQL використовує один endpoint і повертає саме запитані поля.',
      })}
    >
      <defs>
        <marker id="nq-fig-down" markerWidth="8" markerHeight="8" refX="4" refY="6" orient="auto">
          <path d="M1,1 L4,6 L7,1" fill="none" stroke="var(--line2)" strokeWidth="1.4" />
        </marker>
      </defs>

      {/* divider */}
      <line x1="360" y1="18" x2="360" y2="274" stroke="var(--line2)" strokeWidth="1" strokeDasharray="3 5" />

      {/* ── LEFT · REST ─────────────────────────────────────────────── */}
      <g fontFamily="var(--font-mono)">
        <text x="24" y="30" fill="var(--accent)" fontSize="13" fontWeight="700">
          REST
        </text>
        <text x="24" y="47" fill="var(--tx3)" fontSize="10.5" fontFamily="var(--font-body)">
          {t({ en: 'many endpoints · fixed shape', uk: 'багато endpoint-ів · фіксована форма' })}
        </text>

        {/* request chip with a "stack" shadow → several round trips */}
        <rect x="32" y="64" width="292" height="26" rx="6" fill="var(--s2)" stroke="var(--line2)" strokeWidth="1" />
        <rect x="24" y="60" width="292" height="26" rx="6" fill="var(--surface)" stroke="var(--line2)" strokeWidth="1" />
        <text x="36" y="77" fill="var(--tx2)" fontSize="11">
          GET /users/1
        </text>
        <text x="308" y="77" textAnchor="end" fill="var(--accent)" fontSize="10">
          ×3 {t({ en: 'trips', uk: 'запити' })}
        </text>

        <line x1="60" y1="90" x2="60" y2="112" stroke="var(--line2)" strokeWidth="1" markerEnd="url(#nq-fig-down)" />

        {/* response card — over-fetch: 4 fields sent, 1 used */}
        <rect x="24" y="114" width="300" height="150" rx="8" fill="var(--bg)" stroke="var(--line)" strokeWidth="1" />
        <text x="38" y="134" fill="var(--tx3)" fontSize="10.5">
          200 · user
        </text>
        <text x="38" y="158" fill="var(--accent)" fontSize="12">
          name
        </text>
        <text x="120" y="158" fill="var(--tx3)" fontSize="9.5" fontFamily="var(--font-body)">
          ✓ {t({ en: 'used', uk: 'потрібне' })}
        </text>
        <g fill="var(--tx3)" fontSize="12">
          <text x="38" y="180" textDecoration="line-through">email</text>
          <text x="38" y="202" textDecoration="line-through">avatarUrl</text>
          <text x="38" y="224" textDecoration="line-through">createdAt</text>
        </g>
        <text x="38" y="250" fill="var(--tx3)" fontSize="9.5" fontStyle="italic" fontFamily="var(--font-body)">
          {t({ en: 'over-fetch: 4 sent, 1 used', uk: 'over-fetch: 4 надіслано, 1 використано' })}
        </text>
      </g>

      {/* ── RIGHT · GraphQL ─────────────────────────────────────────── */}
      <g fontFamily="var(--font-mono)">
        <text x="384" y="30" fill="var(--accent-2)" fontSize="13" fontWeight="700">
          GraphQL
        </text>
        <text x="384" y="47" fill="var(--tx3)" fontSize="10.5" fontFamily="var(--font-body)">
          {t({ en: 'one endpoint · exact shape', uk: 'один endpoint · точна форма' })}
        </text>

        {/* request chip: one POST + the query */}
        <rect x="384" y="60" width="312" height="50" rx="6" fill="var(--surface)" stroke="var(--line2)" strokeWidth="1" />
        <text x="396" y="79" fill="var(--accent-2)" fontSize="11">
          POST /graphql
        </text>
        <text x="396" y="99" fill="var(--tx2)" fontSize="10">
          {'{ user { name posts { title } } }'}
        </text>

        <line x1="420" y1="110" x2="420" y2="112" stroke="var(--line2)" strokeWidth="1" markerEnd="url(#nq-fig-down)" />

        {/* response card — exactly the requested shape */}
        <rect x="384" y="114" width="312" height="150" rx="8" fill="var(--bg)" stroke="var(--accent-2)" strokeWidth="1" opacity="0.98" />
        <text x="398" y="134" fill="var(--tx3)" fontSize="10.5">
          200 · data
        </text>
        <g fill="var(--accent-2)" fontSize="12">
          <text x="398" y="158">name</text>
          <text x="398" y="180">posts: [</text>
          <text x="414" y="202">{'{ title }'}</text>
          <text x="398" y="224">]</text>
        </g>
        <text x="398" y="250" fill="var(--tx3)" fontSize="9.5" fontStyle="italic" fontFamily="var(--font-body)">
          {t({ en: 'exactly the fields asked for — 1 request', uk: 'саме запитані поля — 1 запит' })}
        </text>
      </g>
    </svg>
  );
}
