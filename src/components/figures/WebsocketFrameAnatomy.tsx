import { useLang } from '../../i18n/lang';

/*
 * websocket-frame-anatomy (m12) — the RFC 6455 frame header laid out bit by bit. Byte 0 = FIN + 3 RSV +
 * 4-bit opcode; byte 1 = MASK bit + 7-bit payload length; then the optional extended length, the 4-byte
 * masking-key (present only when MASK=1, i.e. client→server), and the payload. Colours match the sim:
 * accent-2 (cyan) = opcode/payload (data), amber = the MASK bit + masking-key, neutral = length.
 * Ref: MDN Writing WebSocket servers; RFC 6455 §5.2.
 */
const CW = 42; // bit-cell width
const X0 = 20;
const CY = 56; // cell row top
const CH = 42;

interface Group {
  start: number; // first bit
  span: number; // bits
  label: string;
  fill: string;
  text?: string;
}
const GROUPS: Group[] = [
  { start: 0, span: 1, label: 'FIN', fill: 'var(--accent)', text: '#0b0f14' },
  { start: 1, span: 3, label: 'RSV 1-3', fill: 'var(--s3)', text: 'var(--tx3)' },
  { start: 4, span: 4, label: 'opcode (4)', fill: 'var(--accent-2)', text: '#06121b' },
  { start: 8, span: 1, label: 'MASK', fill: 'var(--c-analytics)', text: '#0b0f14' },
  { start: 9, span: 7, label: 'Payload len (7)', fill: 'var(--s2)', text: 'var(--tx2)' },
];

export function WebsocketFrameAnatomy() {
  const { t } = useLang();
  const cx = (bit: number) => X0 + bit * CW;

  return (
    <svg
      viewBox="0 0 720 250"
      className="fig-svg"
      role="img"
      aria-label={t({
        en: 'A WebSocket frame header, bit by bit: FIN, three reserved bits, a 4-bit opcode, the MASK bit and 7-bit payload length, then the optional extended length, the masking key (client to server only), and the payload.',
        uk: 'Заголовок WebSocket-фрейму побітно: FIN, три reserved-біти, 4-бітний opcode, біт MASK і 7-бітна довжина payload, далі опційна розширена довжина, masking key (лише client→server) і payload.',
      })}
    >
      {/* byte markers */}
      <text x={cx(4)} y="24" textAnchor="middle" fill="var(--tx3)" fontSize="10.5" fontFamily="var(--font-mono)">
        byte 0
      </text>
      <text x={cx(12)} y="24" textAnchor="middle" fill="var(--tx3)" fontSize="10.5" fontFamily="var(--font-mono)">
        byte 1
      </text>

      {/* bit numbers */}
      {Array.from({ length: 16 }, (_, b) => (
        <text key={b} x={cx(b) + CW / 2} y="46" textAnchor="middle" fill="var(--tx3)" fontSize="9" fontFamily="var(--font-mono)">
          {b}
        </text>
      ))}

      {/* group cells */}
      {GROUPS.map((g) => (
        <g key={g.label}>
          <rect x={cx(g.start)} y={CY} width={g.span * CW} height={CH} rx="4" fill={g.fill} stroke="var(--bg)" strokeWidth="1" />
          <text
            x={cx(g.start) + (g.span * CW) / 2}
            y={CY + CH / 2 + 4}
            textAnchor="middle"
            fill={g.text}
            fontSize={g.span === 1 ? '9.5' : '11.5'}
            fontFamily="var(--font-mono)"
            fontWeight="700"
          >
            {g.label}
          </text>
        </g>
      ))}
      {/* per-bit dividers */}
      {Array.from({ length: 15 }, (_, i) => (
        <line key={i} x1={cx(i + 1)} y1={CY} x2={cx(i + 1)} y2={CY + CH} stroke="var(--bg)" strokeWidth="1" opacity="0.6" />
      ))}
      {/* byte boundary (thicker) */}
      <line x1={cx(8)} y1={CY - 4} x2={cx(8)} y2={CY + CH + 4} stroke="var(--tx3)" strokeWidth="1.5" />

      {/* subsequent regions */}
      {(() => {
        const y = 132;
        const h = 40;
        const blocks: { x: number; w: number; label: string; sub: string; fill: string; stroke: string }[] = [
          { x: 20, w: 200, label: 'Extended length', sub: '16 or 64 bits · if len = 126/127', fill: 'var(--s2)', stroke: 'var(--line2)' },
          { x: 232, w: 220, label: 'Masking-key', sub: '32 bits · only if MASK = 1', fill: 'var(--c-analytics-soft)', stroke: 'var(--c-analytics)' },
          { x: 464, w: 236, label: 'Payload data', sub: 'application bytes', fill: 'var(--accent-2-soft)', stroke: 'var(--accent-2)' },
        ];
        return blocks.map((b) => (
          <g key={b.label}>
            <rect x={b.x} y={y} width={b.w} height={h} rx="6" fill={b.fill} stroke={b.stroke} strokeWidth="1" />
            <text x={b.x + b.w / 2} y={y + 18} textAnchor="middle" fill="var(--tx)" fontSize="11.5" fontFamily="var(--font-mono)" fontWeight="700">
              {b.label}
            </text>
            <text x={b.x + b.w / 2} y={y + 33} textAnchor="middle" fill="var(--tx3)" fontSize="9.5" fontFamily="var(--font-body)">
              {b.sub}
            </text>
          </g>
        ));
      })()}

      {/* opcode legend */}
      <text x="20" y="212" fill="var(--tx3)" fontSize="10.5" fontFamily="var(--font-body)">
        {t({ en: 'opcodes:', uk: 'opcodes:' })}
      </text>
      <text x="76" y="212" fill="var(--tx2)" fontSize="11" fontFamily="var(--font-mono)">
        0x1 text · 0x2 binary · 0x8 close · 0x9 ping · 0xA pong
      </text>
      <text x="20" y="234" fill="var(--tx3)" fontSize="10" fontFamily="var(--font-body)">
        {t({ en: 'Client→server frames set MASK=1 and carry the masking-key; server→client frames do not.', uk: 'Фрейми client→server ставлять MASK=1 і несуть masking-key; server→client — ні.' })}
      </text>
    </svg>
  );
}
