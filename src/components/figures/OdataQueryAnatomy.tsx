import { useLang } from '../../i18n/lang';

/*
 * odata-query-anatomy (m6) — one OData URL dissected into its $-options, each mapped to the SQL concept
 * it compiles down to: $filter=WHERE, $select=projection, $expand=JOIN, $orderby=ORDER BY,
 * $top/$skip=LIMIT/OFFSET, $count=COUNT(*). Colours: violet = predicate/filter, cyan = shaping
 * (select/expand), amber = ordering/paging, neutral = the resource path.
 * Ref: OASIS OData 4.01 Part 2 (URL conventions); Microsoft Graph query parameters.
 */

// SQL glosses stay pure SQL tokens — language-neutral in both locales.
const ROWS: { code: string; sql: string; color: string }[] = [
  { code: "?$filter=status eq 'shipped' and total gt 100", sql: 'WHERE', color: 'var(--accent)' },
  { code: '&$select=id,total,shippedAt', sql: 'SELECT', color: 'var(--accent-2)' },
  { code: '&$expand=customer($select=name,country)', sql: 'JOIN + nested SELECT', color: 'var(--accent-2)' },
  { code: '&$orderby=shippedAt desc', sql: 'ORDER BY', color: 'var(--c-analytics)' },
  { code: '&$top=20&$skip=40', sql: 'LIMIT 20 OFFSET 40', color: 'var(--c-analytics)' },
  { code: '&$count=true', sql: '+ COUNT(*)', color: 'var(--c-analytics)' },
];

export function OdataQueryAnatomy() {
  const { t } = useLang();
  const y0 = 78;
  const lh = 30;

  return (
    <svg
      viewBox="0 0 720 290"
      className="fig-svg"
      role="img"
      aria-label={t({
        en: 'An OData request URL dissected: GET /odata/Orders with $filter mapping to SQL WHERE, $select to projection, $expand to JOIN, $orderby to ORDER BY, $top and $skip to LIMIT and OFFSET, and $count adding a total count.',
        uk: 'Розібраний URL OData-запиту: GET /odata/Orders, де $filter відповідає SQL WHERE, $select — проєкції, $expand — JOIN, $orderby — ORDER BY, $top і $skip — LIMIT і OFFSET, а $count додає загальну кількість.',
      })}
    >
      {/* the resource line */}
      <rect x="16" y="16" width="688" height="38" rx="8" fill="var(--s2)" stroke="var(--line2)" strokeWidth="1" />
      <text x="32" y="40" fill="var(--tx)" fontSize="13" fontFamily="var(--font-mono)" fontWeight="700">
        GET /odata/Orders
      </text>
      <text x="688" y="40" textAnchor="end" fill="var(--tx3)" fontSize="10" fontFamily="var(--font-body)">
        {t({ en: 'the entity set — still a REST resource', uk: 'entity set — досі REST-ресурс' })}
      </text>

      {/* the $-option rows */}
      {ROWS.map((r, i) => (
        <g key={r.code}>
          <rect x="16" y={y0 + i * lh - 17} width="452" height="26" rx="6" fill="transparent" stroke={r.color} strokeWidth="1" opacity="0.85" />
          <text x="28" y={y0 + i * lh} fill={r.color} fontSize="11.5" fontFamily="var(--font-mono)">
            {r.code}
          </text>
          <text x="484" y={y0 + i * lh} fill="var(--tx3)" fontSize="10" fontFamily="var(--font-mono)">
            =
          </text>
          <text x="500" y={y0 + i * lh} fill="var(--tx2)" fontSize="11" fontFamily="var(--font-mono)" fontWeight="700">
            {r.sql}
          </text>
        </g>
      ))}

      <text x="16" y="272" fill="var(--tx3)" fontSize="10" fontFamily="var(--font-body)">
        {t({
          en: 'Reads like SQL because it compiles to SQL — which is both the power (generic clients) and the risk (T7: caps, allowlists, query-level auth).',
          uk: 'Читається як SQL, бо компілюється в SQL — у цьому і сила (генеричні клієнти), і ризик (T7: ліміти, allowlist-и, авторизація рівня запиту).',
        })}
      </text>
    </svg>
  );
}
