import { useLang } from '../../i18n/lang';

/*
 * version-strategies (m18) — the same GET request, versioned three ways, stacked for comparison:
 *   1. URI path        GET /v2/orders/42                         (visible · cacheable)
 *   2. Custom header   GET /orders/42  + API-Version: 2          (clean URI · caches vary on it)
 *   3. Media type      GET /orders/42  + Accept: …order.v2+json  (HTTP-native · per-representation)
 * The version token is highlighted amber in each so the eye finds WHERE the version lives. Method,
 * path, "API-Version" and "Accept" stay English in both locales (the last two are smoke canaries).
 * Colours: violet = URI, cyan = header, amber = media type (matching the strategy label).
 */

const BODY = 'var(--font-body)';
const MONO = 'var(--font-mono)';

export function VersionStrategies() {
  const { t } = useLang();

  return (
    <svg
      viewBox="0 0 720 250"
      className="fig-svg"
      role="img"
      aria-label={t({
        en: 'One GET request for order 42, versioned three ways. Row 1, URI path: GET /v2/orders/42 — the version sits in the path; visible and cacheable. Row 2, custom header: GET /orders/42 with a header API-Version 2 — the URI stays clean but caches must vary on the header. Row 3, media type: GET /orders/42 with Accept application/vnd.acme.order.v2+json — the version rides content negotiation, the HTTP-native but least tooled option.',
        uk: 'Один GET-запит на замовлення 42, версіонований трьома способами. Рядок 1, URI path: GET /v2/orders/42 — версія в шляху; видима й кешовна. Рядок 2, власний header: GET /orders/42 з header API-Version 2 — URI лишається чистим, але кеші мають vary по header. Рядок 3, media type: GET /orders/42 з Accept application/vnd.acme.order.v2+json — версія їде на content negotiation, HTTP-нативний, але найменш оснащений тулінгом варіант.',
      })}
    >
      {[
        {
          y: 20,
          h: 44,
          color: 'var(--accent)',
          label: { en: 'URI path', uk: 'URI path' },
          trait: { en: 'visible · cacheable', uk: 'видимо · кешовно' },
        },
        {
          y: 96,
          h: 52,
          color: 'var(--accent-2)',
          label: { en: 'Header', uk: 'Header' },
          trait: { en: 'clean URI · vary on it', uk: 'чистий URI · vary по ньому' },
        },
        {
          y: 172,
          h: 52,
          color: 'var(--c-analytics)',
          label: { en: 'Media type', uk: 'Media type' },
          trait: { en: 'HTTP-native · complex', uk: 'HTTP-нативно · складно' },
        },
      ].map((r) => (
        <g key={r.label.en}>
          {/* strategy label + trait (left column) */}
          <text x={16} y={r.y + 22} fill={r.color} fontSize={12} fontFamily={MONO} fontWeight={700}>
            {t(r.label)}
          </text>
          <text x={16} y={r.y + 38} fill="var(--tx3)" fontSize={9} fontFamily={BODY}>
            {t(r.trait)}
          </text>
          {/* request card */}
          <rect x={190} y={r.y} width={516} height={r.h} rx={8} fill="var(--s2)" stroke="var(--line2)" strokeWidth={1} />
          <rect x={190} y={r.y} width={4} height={r.h} rx={2} fill={r.color} />
        </g>
      ))}

      {/* ── Row 1 · URI path (positioned segments — no inline tspan flow) ── */}
      <text x={208} y={48} fontSize={12.5} fontFamily={MONO} fill="var(--tx2)" fontWeight={700}>GET</text>
      <text x={244} y={48} fontSize={12.5} fontFamily={MONO} fill="var(--tx)">/</text>
      <text x={252} y={48} fontSize={12.5} fontFamily={MONO} fill="var(--c-analytics)" fontWeight={700}>v2</text>
      <text x={268} y={48} fontSize={12.5} fontFamily={MONO} fill="var(--tx)">/orders/42</text>

      {/* ── Row 2 · header ── */}
      <text x={208} y={120} fontSize={12.5} fontFamily={MONO} fill="var(--tx2)">GET /orders/42</text>
      <text x={208} y={140} fontSize={12.5} fontFamily={MONO} fill="var(--accent-2)">API-Version:</text>
      <text x={306} y={140} fontSize={12.5} fontFamily={MONO} fill="var(--c-analytics)" fontWeight={700}>2</text>

      {/* ── Row 3 · media type ── */}
      <text x={208} y={196} fontSize={12.5} fontFamily={MONO} fill="var(--tx2)">GET /orders/42</text>
      <text x={208} y={216} fontSize={11} fontFamily={MONO} fill="var(--c-analytics)">Accept:</text>
      <text x={261} y={216} fontSize={11} fontFamily={MONO} fill="var(--tx)">application/vnd.acme.order.</text>
      <text x={439} y={216} fontSize={11} fontFamily={MONO} fill="var(--c-analytics)" fontWeight={700}>v2</text>
      <text x={453} y={216} fontSize={11} fontFamily={MONO} fill="var(--tx)">+json</text>

      {/* footer rule */}
      <text x={360} y={242} textAnchor="middle" fill="var(--tx3)" fontSize={9.5} fontFamily={BODY}>
        {t({
          en: 'Pick one and stay consistent — every version is a version you maintain.',
          uk: 'Обери одне й тримайся послідовно — кожна версія це версія, яку ти підтримуєш.',
        })}
      </text>
    </svg>
  );
}
