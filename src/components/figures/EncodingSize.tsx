import { useLang } from '../../i18n/lang';

/*
 * encoding-size (m4) — the same small record encoded five ways, drawn to relative wire size. Text
 * formats (JSON/XML) in accent violet, binary formats (Protobuf/CBOR/MessagePack) in accent-2 cyan, to
 * reinforce the text-vs-binary axis. Numbers are illustrative for one tiny object; the binary lead grows
 * with numbers and repeated keys and shrinks when the payload is mostly unique strings.
 */
const ROWS: { name: string; rel: number; binary: boolean }[] = [
  { name: 'XML', rel: 170, binary: false },
  { name: 'JSON', rel: 100, binary: false },
  { name: 'CBOR', rel: 66, binary: true },
  { name: 'MessagePack', rel: 64, binary: true },
  { name: 'Protobuf', rel: 40, binary: true },
];

export function EncodingSize() {
  const { t } = useLang();
  const x0 = 150;
  const maxW = 470;
  const max = 170;
  const scale = maxW / max;
  const y0 = 64;
  const step = 34;
  const baseline = x0 + 100 * scale;

  return (
    <svg viewBox="0 0 720 250" className="fig-svg" role="img" aria-label={t({ en: 'The same record encoded as XML, JSON, CBOR, MessagePack and Protobuf, drawn to relative wire size', uk: 'Той самий запис у форматах XML, JSON, CBOR, MessagePack і Protobuf, намальований за відносним розміром на дроті' })}>
      <text x="20" y="30" fill="var(--tx)" fontSize="13" fontFamily="var(--font-body)" fontWeight="600">
        {t({ en: 'One record, five encodings — relative wire size', uk: 'Один запис, пʼять кодувань — відносний розмір на дроті' })}
      </text>

      {/* JSON = 100% baseline */}
      <line x1={baseline} y1={y0 - 14} x2={baseline} y2={y0 + ROWS.length * step - 12} stroke="var(--tx3)" strokeWidth="1" strokeDasharray="3 3" />
      <text x={baseline} y={y0 - 20} textAnchor="middle" fill="var(--tx3)" fontSize="10.5" fontFamily="var(--font-mono)">
        JSON = 100%
      </text>

      {ROWS.map((r, i) => {
        const y = y0 + i * step;
        const w = r.rel * scale;
        const color = r.binary ? 'var(--accent-2)' : 'var(--accent)';
        return (
          <g key={r.name}>
            <text x={x0 - 12} y={y + 13} textAnchor="end" fill="var(--tx2)" fontSize="12" fontFamily="var(--font-mono)">
              {r.name}
            </text>
            <rect x={x0} y={y} width={w} height="18" rx="3" fill={color} opacity={r.binary ? 0.9 : 0.75} />
            <text x={x0 + w + 8} y={y + 13} fill="var(--tx2)" fontSize="11" fontFamily="var(--font-mono)">
              {r.rel}%
            </text>
          </g>
        );
      })}

      <text x="20" y="238" fill="var(--tx3)" fontSize="11" fontFamily="var(--font-body)">
        {t({ en: 'Illustrative for one small object. Text carries field names on every message; binary drops them (Protobuf) or shortens them.', uk: 'Ілюстративно для одного малого обʼєкта. Text несе назви полів у кожному повідомленні; binary їх прибирає (Protobuf) або скорочує.' })}
      </text>
    </svg>
  );
}
