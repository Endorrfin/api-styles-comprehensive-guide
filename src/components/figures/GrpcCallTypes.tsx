import { useLang } from '../../i18n/lang';

/*
 * grpc-call-types (m10) — the four gRPC call shapes over HTTP/2 streams. Request messages (client→server)
 * in accent violet, response messages (server→client) in accent-2 cyan. Unary = 1→1, server streaming =
 * 1→N, client streaming = N→1, bidirectional = N↔N on two independent streams.
 */
type Dir = 'r' | 'l';
interface Panel {
  key: string;
  title: string;
  sub: string;
  arrows: [Dir, number][];
}

const PANELS: Panel[] = [
  { key: 'unary', title: 'Unary', sub: '1 → 1', arrows: [['r', 0], ['l', 1]] },
  { key: 'server', title: 'Server streaming', sub: '1 → N', arrows: [['r', 0], ['l', 1], ['l', 2], ['l', 3]] },
  { key: 'client', title: 'Client streaming', sub: 'N → 1', arrows: [['r', 0], ['r', 1], ['r', 2], ['l', 3]] },
  { key: 'bidi', title: 'Bidirectional', sub: 'N ↔ N', arrows: [['r', 0], ['l', 1], ['r', 2], ['l', 3]] },
];

export function GrpcCallTypes() {
  const { t } = useLang();
  const colW = 360;
  const rowH = 162;

  return (
    <svg viewBox="0 0 720 336" className="fig-svg" role="img" aria-label={t({ en: 'The four gRPC call types: unary, server streaming, client streaming, and bidirectional streaming', uk: 'Чотири типи викликів gRPC: unary, server streaming, client streaming і bidirectional streaming' })}>
      <defs>
        <marker id="gct-r" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent)" />
        </marker>
        <marker id="gct-l" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent-2)" />
        </marker>
      </defs>

      {PANELS.map((p, i) => {
        const px = (i % 2) * colW + 12;
        const py = Math.floor(i / 2) * rowH + 10;
        const clientX = px + 52;
        const serverX = px + 300;
        const baseY = py + 58;
        const railBottom = baseY + p.arrows.length * 13 + 2;
        return (
          <g key={p.key}>
            <text x={px + 8} y={py + 20} fill="var(--tx)" fontSize="12.5" fontFamily="var(--font-mono)" fontWeight="700">
              {p.title}
            </text>
            <text x={px + 320} y={py + 20} textAnchor="end" fill="var(--tx3)" fontSize="11.5" fontFamily="var(--font-mono)">
              {p.sub}
            </text>
            {/* rails */}
            <line x1={clientX} y1={baseY - 8} x2={clientX} y2={railBottom} stroke="var(--line2)" strokeWidth="1" />
            <line x1={serverX} y1={baseY - 8} x2={serverX} y2={railBottom} stroke="var(--line2)" strokeWidth="1" />
            <text x={clientX} y={py + 40} textAnchor="middle" fill="var(--tx2)" fontSize="10.5" fontFamily="var(--font-body)">
              {t({ en: 'Client', uk: 'Client' })}
            </text>
            <text x={serverX} y={py + 40} textAnchor="middle" fill="var(--tx2)" fontSize="10.5" fontFamily="var(--font-body)">
              {t({ en: 'Server', uk: 'Server' })}
            </text>
            {/* messages */}
            {p.arrows.map(([dir, idx], k) => {
              const y = baseY + idx * 13;
              const req = dir === 'r';
              const x1 = req ? clientX + 3 : serverX - 3;
              const x2 = req ? serverX - 9 : clientX + 9;
              return <line key={k} x1={x1} y1={y} x2={x2} y2={y} stroke={req ? 'var(--accent)' : 'var(--accent-2)'} strokeWidth="2" markerEnd={req ? 'url(#gct-r)' : 'url(#gct-l)'} />;
            })}
          </g>
        );
      })}
    </svg>
  );
}
