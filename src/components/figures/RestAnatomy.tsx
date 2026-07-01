import { useLang } from '../../i18n/lang';

/** Anatomy of a REST request/response exchange over HTTP. */
export function RestAnatomy() {
  const { t } = useLang();
  return (
    <svg viewBox="0 0 720 300" className="fig-svg" role="img" aria-label={t({ en: 'REST request and response anatomy', uk: 'Анатомія REST-запиту та відповіді' })}>
      <defs>
        <marker id="ra-arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
          <path d="M0,0 L7,3 L0,6 Z" fill="var(--accent)" />
        </marker>
      </defs>

      {/* Client & server nodes */}
      <rect x="16" y="120" width="120" height="60" rx="10" fill="var(--s2)" stroke="var(--line2)" />
      <text x="76" y="155" textAnchor="middle" fill="var(--tx)" fontSize="14" fontFamily="var(--font-body)">
        {t({ en: 'Client', uk: 'Клієнт' })}
      </text>
      <rect x="584" y="120" width="120" height="60" rx="10" fill="var(--s2)" stroke="var(--line2)" />
      <text x="644" y="155" textAnchor="middle" fill="var(--tx)" fontSize="14" fontFamily="var(--font-body)">
        {t({ en: 'Server', uk: 'Сервер' })}
      </text>

      {/* Request arrow */}
      <line x1="140" y1="138" x2="580" y2="138" stroke="var(--accent)" strokeWidth="2" markerEnd="url(#ra-arrow)" />
      {/* Response arrow */}
      <line x1="580" y1="168" x2="140" y2="168" stroke="var(--c-commit)" strokeWidth="2" markerEnd="url(#ra-arrow)" />

      {/* Request card */}
      <rect x="180" y="24" width="360" height="86" rx="8" fill="var(--surface)" stroke="var(--accent-deep)" />
      <text x="196" y="46" fill="var(--accent-bright)" fontSize="13" fontFamily="var(--font-mono)">
        GET /articles/42
      </text>
      <text x="196" y="66" fill="var(--tx2)" fontSize="12" fontFamily="var(--font-mono)">Accept: application/json</text>
      <text x="196" y="84" fill="var(--tx2)" fontSize="12" fontFamily="var(--font-mono)">If-None-Match: "a1b2c3"</text>
      <text x="196" y="102" fill="var(--tx3)" fontSize="11" fontFamily="var(--font-body)">
        {t({ en: 'method · resource URL · headers', uk: 'метод · URL ресурсу · заголовки' })}
      </text>

      {/* Response card */}
      <rect x="180" y="196" width="360" height="86" rx="8" fill="var(--surface)" stroke="var(--c-commit)" />
      <text x="196" y="218" fill="var(--c-commit)" fontSize="13" fontFamily="var(--font-mono)">200 OK · ETag: "a1b2c3"</text>
      <text x="196" y="238" fill="var(--tx2)" fontSize="12" fontFamily="var(--font-mono)">Content-Type: application/json</text>
      <text x="196" y="256" fill="var(--tx2)" fontSize="12" fontFamily="var(--font-mono)">{'{ "id": 42, "title": … }'}</text>
      <text x="196" y="274" fill="var(--tx3)" fontSize="11" fontFamily="var(--font-body)">
        {t({ en: 'status · headers · representation', uk: 'статус · заголовки · representation' })}
      </text>
    </svg>
  );
}
