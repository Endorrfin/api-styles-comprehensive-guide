import { useLang } from '../../i18n/lang';
import type { Localized } from '../../data/types';

const AXES: { name: Localized; left: Localized; right: Localized }[] = [
  { name: { en: 'Timing', uk: 'Timing' }, left: { en: 'Synchronous', uk: 'Synchronous' }, right: { en: 'Asynchronous', uk: 'Asynchronous' } },
  { name: { en: 'Flow', uk: 'Flow' }, left: { en: 'Request/response', uk: 'Request/response' }, right: { en: 'Streaming · push', uk: 'Streaming · push' } },
  { name: { en: 'Direction', uk: 'Direction' }, left: { en: 'One-way / unary', uk: 'One-way / unary' }, right: { en: 'Bidirectional', uk: 'Bidirectional' } },
  { name: { en: 'Initiative', uk: 'Initiative' }, left: { en: 'Client-initiated', uk: 'Client-initiated' }, right: { en: 'Server-initiated', uk: 'Server-initiated' } },
  { name: { en: 'Encoding', uk: 'Encoding' }, left: { en: 'Text', uk: 'Text' }, right: { en: 'Binary', uk: 'Binary' } },
  { name: { en: 'Topology', uk: 'Topology' }, left: { en: 'Point-to-point', uk: 'Point-to-point' }, right: { en: 'Broker-mediated', uk: 'Broker-mediated' } },
  { name: { en: 'Coupling', uk: 'Coupling' }, left: { en: 'Loose', uk: 'Loose' }, right: { en: 'Tight / schema', uk: 'Tight / schema' } },
];

/** The decision axes: every style is a point in this coordinate system. */
export function DecisionAxes() {
  const { t } = useLang();
  const x0 = 150;
  const x1 = 566;
  return (
    <svg viewBox="0 0 720 372" className="fig-svg" role="img" aria-label={t({ en: 'The seven decision axes that separate API styles', uk: 'Сім осей рішення, що розрізняють стилі API' })}>
      <defs>
        <linearGradient id="da-track" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-2)" />
        </linearGradient>
      </defs>
      {AXES.map((axis, i) => {
        const y = 34 + i * 47;
        return (
          <g key={i}>
            <text x="16" y={y + 4} fill="var(--tx)" fontSize="12.5" fontFamily="var(--font-body)" fontWeight="600">
              {t(axis.name)}
            </text>
            <text x={x0 - 8} y={y + 4} textAnchor="end" fill="var(--tx3)" fontSize="11" fontFamily="var(--font-body)">
              {t(axis.left)}
            </text>
            <line x1={x0} y1={y} x2={x1} y2={y} stroke="url(#da-track)" strokeWidth="3" strokeLinecap="round" />
            <circle cx={x0} cy={y} r="4.5" fill="var(--accent)" />
            <circle cx={x1} cy={y} r="4.5" fill="var(--accent-2)" />
            <text x={x1 + 8} y={y + 4} fill="var(--tx3)" fontSize="11" fontFamily="var(--font-body)">
              {t(axis.right)}
            </text>
          </g>
        );
      })}
      <text x="360" y="360" textAnchor="middle" fill="var(--tx3)" fontSize="11.5" fontFamily="var(--font-body)">
        {t({ en: 'Choosing a style = choosing where you sit on each axis.', uk: 'Обрати стиль = обрати, де ти на кожній осі.' })}
      </text>
    </svg>
  );
}
