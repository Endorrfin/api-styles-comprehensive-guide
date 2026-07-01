import { useLang } from '../../i18n/lang';
import type { Localized } from '../../data/types';

const ROWS: { code: string; color: string; label: Localized; ex: string }[] = [
  { code: '1xx', color: 'var(--tx3)', label: { en: 'Informational — interim', uk: 'Informational — проміжні' }, ex: '100 Continue' },
  { code: '2xx', color: 'var(--c-commit)', label: { en: 'Success — it worked', uk: 'Success — спрацювало' }, ex: '200 · 201 · 204' },
  { code: '3xx', color: 'var(--c-dist)', label: { en: 'Redirection — look elsewhere / cache', uk: 'Redirection — шукай інде / кеш' }, ex: '301 · 304' },
  { code: '4xx', color: 'var(--c-analytics)', label: { en: 'Client error — your request is wrong', uk: 'Client error — запит хибний' }, ex: '400 · 401 · 404 · 429' },
  { code: '5xx', color: 'var(--c-danger)', label: { en: 'Server error — the server failed', uk: 'Server error — сервер упав' }, ex: '500 · 503' },
];

/** The five HTTP status classes — branch on the class before parsing the body. */
export function HttpStatusClasses() {
  const { t } = useLang();
  return (
    <svg viewBox="0 0 720 260" className="fig-svg" role="img" aria-label={t({ en: 'The five HTTP status code classes', uk: 'Пʼять класів HTTP-статус-кодів' })}>
      {ROWS.map((r, i) => {
        const y = 20 + i * 46;
        return (
          <g key={r.code}>
            <rect x="16" y={y} width="80" height="36" rx="7" fill={r.color} opacity="0.16" stroke={r.color} />
            <text x="56" y={y + 23} textAnchor="middle" fill={r.color} fontSize="15" fontFamily="var(--font-mono)" fontWeight="700">
              {r.code}
            </text>
            <text x="116" y={y + 16} fill="var(--tx)" fontSize="13" fontFamily="var(--font-body)">
              {t(r.label)}
            </text>
            <text x="116" y={y + 32} fill="var(--tx3)" fontSize="12" fontFamily="var(--font-mono)">
              {r.ex}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
