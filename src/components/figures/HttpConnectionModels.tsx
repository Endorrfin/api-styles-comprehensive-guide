import { useLang } from '../../i18n/lang';

/*
 * http-connection-models (m3) — how the three HTTP versions lay requests on the wire, between one
 * Client and one Server. HTTP/1.1: a handful of parallel TCP connections, one response at a time each.
 * HTTP/2: a single TCP connection carrying interleaved streams (shared byte-stream). HTTP/3: a single
 * QUIC/UDP connection carrying independent streams (dashed = UDP; gaps = per-stream framing).
 */
export function HttpConnectionModels() {
  const { t } = useLang();
  const xL = 92; // left edge of the wire area (client right side)
  const xR = 628; // right edge (server left side)
  const streamXs = [0.14, 0.4, 0.62, 0.86]; // gap positions for the HTTP/3 independent-stream dashes

  return (
    <svg viewBox="0 0 720 286" className="fig-svg" role="img" aria-label={t({ en: 'How HTTP/1.1, HTTP/2 and HTTP/3 place requests on the wire between one client and one server', uk: 'Як HTTP/1.1, HTTP/2 і HTTP/3 розміщують запити на дроті між одним клієнтом і одним сервером' })}>
      {/* Client / Server columns */}
      <rect x="22" y="44" width="60" height="214" rx="7" fill="var(--surface)" stroke="var(--line2)" />
      <text x="52" y="156" textAnchor="middle" fill="var(--tx2)" fontSize="12" fontFamily="var(--font-body)" fontWeight="600" transform="rotate(-90 52 156)">
        {t({ en: 'Client', uk: 'Client' })}
      </text>
      <rect x="638" y="44" width="60" height="214" rx="7" fill="var(--surface)" stroke="var(--line2)" />
      <text x="668" y="156" textAnchor="middle" fill="var(--tx2)" fontSize="12" fontFamily="var(--font-body)" fontWeight="600" transform="rotate(90 668 156)">
        {t({ en: 'Server', uk: 'Server' })}
      </text>

      {/* ── HTTP/1.1 — several parallel TCP connections, one at a time each ── */}
      <text x={xL} y="40" fill="var(--accent)" fontSize="12.5" fontFamily="var(--font-mono)" fontWeight="700">
        HTTP/1.1
      </text>
      {[0, 1, 2, 3, 4].map((i) => {
        const y = 56 + i * 7;
        return <line key={i} x1={xL} y1={y} x2={xR} y2={y} stroke="var(--accent)" strokeWidth="2.5" opacity="0.85" />;
      })}
      <text x={(xL + xR) / 2} y="104" textAnchor="middle" fill="var(--tx3)" fontSize="11" fontFamily="var(--font-body)">
        {t({ en: '≤6 parallel TCP connections · one response at a time each · head-of-line per connection', uk: '≤6 паралельних TCP-зʼєднань · по одній відповіді за раз · head-of-line на кожне зʼєднання' })}
      </text>

      {/* ── HTTP/2 — one TCP connection, streams multiplexed into a shared byte-stream ── */}
      <text x={xL} y="132" fill="var(--accent-2)" fontSize="12.5" fontFamily="var(--font-mono)" fontWeight="700">
        HTTP/2
      </text>
      <rect x={xL} y="140" width={xR - xL} height="26" rx="5" fill="none" stroke="var(--accent-2)" strokeWidth="1.5" opacity="0.5" />
      {[0, 1, 2, 3].map((i) => {
        const y = 146 + i * 5;
        return <line key={i} x1={xL + 6} y1={y} x2={xR - 6} y2={y} stroke="var(--accent-2)" strokeWidth="2" />;
      })}
      <text x={(xL + xR) / 2} y="184" textAnchor="middle" fill="var(--tx3)" fontSize="11" fontFamily="var(--font-body)">
        {t({ en: '1 TCP connection · streams multiplexed · one lost packet stalls every stream', uk: '1 TCP-зʼєднання · стріми мультиплексовані · один втрачений пакет зупиняє всі стріми' })}
      </text>

      {/* ── HTTP/3 — one QUIC/UDP connection, independent streams (dashed pipe, gapped streams) ── */}
      <text x={xL} y="212" fill="var(--accent-2)" fontSize="12.5" fontFamily="var(--font-mono)" fontWeight="700">
        HTTP/3
      </text>
      <rect x={xL} y="220" width={xR - xL} height="26" rx="5" fill="none" stroke="var(--accent-2)" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.6" />
      {[0, 1, 2, 3].map((i) => {
        const y = 226 + i * 5;
        const gapX = xL + streamXs[i] * (xR - xL);
        return (
          <g key={i}>
            <line x1={xL + 6} y1={y} x2={gapX - 7} y2={y} stroke="var(--accent-2)" strokeWidth="2" />
            <line x1={gapX + 7} y1={y} x2={xR - 6} y2={y} stroke="var(--accent-2)" strokeWidth="2" />
          </g>
        );
      })}
      <text x={(xL + xR) / 2} y="264" textAnchor="middle" fill="var(--tx3)" fontSize="11" fontFamily="var(--font-body)">
        {t({ en: '1 QUIC/UDP connection · independent streams · a lost packet stalls only its own stream', uk: '1 QUIC/UDP-зʼєднання · незалежні стріми · втрачений пакет зупиняє лише власний стрім' })}
      </text>
    </svg>
  );
}
