import { useLang } from '../../i18n/lang';

/** interface-vs-implementation: a stable API facade hides a changeable implementation. */
export function ApiBoundary() {
  const { t } = useLang();
  return (
    <svg viewBox="0 0 720 300" className="fig-svg" role="img" aria-label={t({ en: 'An API as a stable interface hiding a changeable implementation', uk: 'API як стабільний інтерфейс, що ховає змінювану реалізацію' })}>
      <defs>
        <marker id="ab-arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
          <path d="M0,0 L7,3 L0,6 Z" fill="var(--accent)" />
        </marker>
      </defs>

      {/* Consumers */}
      <rect x="16" y="96" width="150" height="108" rx="10" fill="var(--s2)" stroke="var(--line2)" />
      <text x="91" y="130" textAnchor="middle" fill="var(--tx)" fontSize="14" fontFamily="var(--font-body)">
        {t({ en: 'Consumers', uk: 'Споживачі' })}
      </text>
      <text x="91" y="152" textAnchor="middle" fill="var(--tx3)" fontSize="11" fontFamily="var(--font-body)">
        {t({ en: 'apps · services', uk: 'застосунки · сервіси' })}
      </text>
      <text x="91" y="172" textAnchor="middle" fill="var(--tx3)" fontSize="11" fontFamily="var(--font-body)">
        {t({ en: 'know only the contract', uk: 'знають лише контракт' })}
      </text>

      {/* The interface / contract boundary */}
      <rect x="300" y="40" width="70" height="220" rx="10" fill="var(--accent-soft)" stroke="var(--accent)" />
      <text x="335" y="34" textAnchor="middle" fill="var(--accent-bright)" fontSize="13" fontFamily="var(--font-mono)">
        API
      </text>
      <text x="335" y="150" textAnchor="middle" fill="var(--accent-bright)" fontSize="12" fontFamily="var(--font-body)" transform="rotate(-90 335 150)">
        {t({ en: 'the stable interface — a promise', uk: 'стабільний інтерфейс — обіцянка' })}
      </text>

      {/* Request / response across the boundary */}
      <line x1="166" y1="138" x2="298" y2="138" stroke="var(--accent)" strokeWidth="2" markerEnd="url(#ab-arrow)" />
      <line x1="298" y1="166" x2="168" y2="166" stroke="var(--c-commit)" strokeWidth="2" markerEnd="url(#ab-arrow)" />

      {/* Implementation (hidden, changeable) */}
      <rect x="430" y="40" width="274" height="220" rx="12" fill="var(--surface)" stroke="var(--line)" strokeDasharray="5 4" />
      <text x="567" y="34" textAnchor="middle" fill="var(--tx3)" fontSize="12" fontFamily="var(--font-body)">
        {t({ en: 'Implementation — free to change', uk: 'Реалізація — вільна змінюватись' })}
      </text>
      {[
        { x: 452, label: { en: 'handlers', uk: 'handlers' } },
        { x: 566, label: { en: 'database', uk: 'база даних' } },
        { x: 452, y: 176, label: { en: 'queue', uk: 'черга' } },
        { x: 566, y: 176, label: { en: 'other services', uk: 'інші сервіси' } },
      ].map((n, i) => (
        <g key={i}>
          <rect x={n.x} y={n.y ?? 76} width="102" height="64" rx="8" fill="var(--s2)" stroke="var(--line2)" />
          <text x={n.x + 51} y={(n.y ?? 76) + 38} textAnchor="middle" fill="var(--tx2)" fontSize="12" fontFamily="var(--font-mono)">
            {t(n.label)}
          </text>
        </g>
      ))}
    </svg>
  );
}
