import { useLang } from '../../i18n/lang';

/** in-process-vs-network: the same "call" costs almost nothing locally but crosses a hostile gap remotely. */
export function InProcessVsNetwork() {
  const { t } = useLang();
  return (
    <svg viewBox="0 0 720 300" className="fig-svg" role="img" aria-label={t({ en: 'An in-process call versus a call across a network', uk: 'Виклик у межах процесу проти виклику через мережу' })}>
      {/* Left: in-process */}
      <text x="30" y="34" fill="var(--tx)" fontSize="14" fontFamily="var(--font-body)" fontWeight="600">
        {t({ en: 'In-process call', uk: 'Виклик у процесі' })}
      </text>
      <rect x="30" y="52" width="300" height="150" rx="12" fill="var(--c-commit-soft)" stroke="var(--c-commit)" />
      <rect x="54" y="104" width="110" height="48" rx="8" fill="var(--surface)" stroke="var(--line2)" />
      <text x="109" y="133" textAnchor="middle" fill="var(--tx)" fontSize="12" fontFamily="var(--font-mono)">caller</text>
      <rect x="196" y="104" width="110" height="48" rx="8" fill="var(--surface)" stroke="var(--line2)" />
      <text x="251" y="133" textAnchor="middle" fill="var(--tx)" fontSize="12" fontFamily="var(--font-mono)">callee</text>
      <line x1="164" y1="128" x2="192" y2="128" stroke="var(--c-commit)" strokeWidth="2" />
      <text x="180" y="224" textAnchor="middle" fill="var(--tx2)" fontSize="11.5" fontFamily="var(--font-body)">
        {t({ en: 'same memory · nanoseconds · they', uk: 'спільна памʼять · наносекунди · падають' })}
      </text>
      <text x="180" y="242" textAnchor="middle" fill="var(--tx2)" fontSize="11.5" fontFamily="var(--font-body)">
        {t({ en: 'fail together · no serialization', uk: 'разом · без серіалізації' })}
      </text>

      {/* Right: across a network */}
      <text x="390" y="34" fill="var(--tx)" fontSize="14" fontFamily="var(--font-body)" fontWeight="600">
        {t({ en: 'Across a network', uk: 'Через мережу' })}
      </text>
      <rect x="390" y="52" width="300" height="150" rx="12" fill="var(--c-danger-soft)" stroke="var(--c-danger)" />
      <rect x="404" y="104" width="96" height="48" rx="8" fill="var(--surface)" stroke="var(--line2)" />
      <text x="452" y="133" textAnchor="middle" fill="var(--tx)" fontSize="12" fontFamily="var(--font-mono)">client</text>
      <rect x="580" y="104" width="96" height="48" rx="8" fill="var(--surface)" stroke="var(--line2)" />
      <text x="628" y="133" textAnchor="middle" fill="var(--tx)" fontSize="12" fontFamily="var(--font-mono)">server</text>
      {/* the gap */}
      <path d="M500,128 L520,116 L512,128 L520,140 Z" fill="var(--c-analytics)" />
      <line x1="500" y1="128" x2="578" y2="128" stroke="var(--c-analytics)" strokeWidth="2" strokeDasharray="4 3" />
      <text x="540" y="96" textAnchor="middle" fill="var(--c-analytics)" fontSize="11" fontFamily="var(--font-body)">
        {t({ en: 'the wire', uk: 'дріт' })}
      </text>
      <text x="540" y="224" textAnchor="middle" fill="var(--tx2)" fontSize="11.5" fontFamily="var(--font-body)">
        {t({ en: 'latency · partial failure · serialize', uk: 'latency · часткова відмова · серіалізація' })}
      </text>
      <text x="540" y="242" textAnchor="middle" fill="var(--tx2)" fontSize="11.5" fontFamily="var(--font-body)">
        {t({ en: 'security · versioning across the gap', uk: 'безпека · версіонування через розрив' })}
      </text>

      <text x="360" y="278" textAnchor="middle" fill="var(--tx3)" fontSize="11.5" fontFamily="var(--font-body)">
        {t({ en: 'A network API is not a function call with extra steps — the gap changes everything.', uk: 'Мережевий API — не виклик функції з додатковими кроками — розрив змінює все.' })}
      </text>
    </svg>
  );
}
