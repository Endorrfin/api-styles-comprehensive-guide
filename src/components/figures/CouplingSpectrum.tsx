import { useLang } from '../../i18n/lang';

// Placement along the loose→tight coupling axis (v in [0,1]); `up` staggers labels to avoid overlap.
const POINTS: { name: string; v: number; up?: boolean }[] = [
  { name: 'REST', v: 0.2, up: true },
  { name: 'JSON-RPC', v: 0.4 },
  { name: 'OData', v: 0.55, up: true },
  { name: 'GraphQL', v: 0.75 },
  { name: 'tRPC', v: 0.88, up: true },
  { name: 'gRPC', v: 0.97 },
  { name: 'SOAP', v: 1.0, up: true },
];

/** coupling-spectrum: styles ordered by how tightly the two sides must share a contract. */
export function CouplingSpectrum() {
  const { t } = useLang();
  const x0 = 60;
  const span = 600;
  const y = 130;
  const xOf = (v: number) => x0 + v * span;
  return (
    <svg viewBox="0 0 720 220" className="fig-svg" role="img" aria-label={t({ en: 'API styles placed on the loose-to-tight coupling spectrum', uk: 'Стилі API на спектрі звʼязності від loose до tight' })}>
      <defs>
        <linearGradient id="cs-track" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--accent-2)" />
          <stop offset="1" stopColor="var(--c-danger)" />
        </linearGradient>
      </defs>

      <text x={x0} y="40" fill="var(--tx)" fontSize="13" fontFamily="var(--font-body)" fontWeight="600">
        {t({ en: 'Loose', uk: 'Loose' })}
      </text>
      <text x={x0} y="58" fill="var(--tx3)" fontSize="11" fontFamily="var(--font-body)">
        {t({ en: 'self-describing · evolve freely', uk: 'self-describing · вільна еволюція' })}
      </text>
      <text x={x0 + span} y="40" textAnchor="end" fill="var(--tx)" fontSize="13" fontFamily="var(--font-body)" fontWeight="600">
        {t({ en: 'Tight', uk: 'Tight' })}
      </text>
      <text x={x0 + span} y="58" textAnchor="end" fill="var(--tx3)" fontSize="11" fontFamily="var(--font-body)">
        {t({ en: 'shared schema / IDL · codegen', uk: 'спільна schema / IDL · codegen' })}
      </text>

      <line x1={x0} y1={y} x2={x0 + span} y2={y} stroke="url(#cs-track)" strokeWidth="4" strokeLinecap="round" />

      {POINTS.map((p) => {
        const x = xOf(p.v);
        const ly = p.up ? y - 18 : y + 30;
        return (
          <g key={p.name}>
            <circle cx={x} cy={y} r="6" fill="var(--surface)" stroke="var(--accent-bright)" strokeWidth="2" />
            <text x={x} y={ly} textAnchor="middle" fill="var(--tx2)" fontSize="12" fontFamily="var(--font-mono)">
              {p.name}
            </text>
          </g>
        );
      })}

      <text x="360" y="204" textAnchor="middle" fill="var(--tx3)" fontSize="11.5" fontFamily="var(--font-body)">
        {t({ en: 'Tighter coupling buys precision and speed; looser coupling buys independent evolution.', uk: 'Тісніша звʼязність купує точність і швидкість; слабша — незалежну еволюцію.' })}
      </text>
    </svg>
  );
}
