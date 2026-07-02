import { useLang } from '../../i18n/lang';

/*
 * rpc-envelope (m8) — the whole JSON-RPC 2.0 protocol on one card: a request (method + params + id),
 * its two possible replies (result XOR error, correlated by the same id), a notification (no id →
 * no reply, ever), and the batch form (an array of calls). Colours: violet = request/method, cyan =
 * success result, danger = error, amber = notification/batch notes.
 * Ref: JSON-RPC 2.0 specification (jsonrpc.org).
 */

const MONO = 'var(--font-mono)';

function Line({ x, y, text, color = 'var(--tx2)', size = 10.5, bold = false }: { x: number; y: number; text: string; color?: string; size?: number; bold?: boolean }) {
  return (
    <text x={x} y={y} fill={color} fontSize={size} fontFamily={MONO} fontWeight={bold ? 700 : 400}>
      {text}
    </text>
  );
}

export function RpcEnvelope() {
  const { t } = useLang();

  return (
    <svg
      viewBox="0 0 720 330"
      className="fig-svg"
      role="img"
      aria-label={t({
        en: 'The JSON-RPC 2.0 envelope: a request with jsonrpc, method, params and id; a success response echoing the id with a result; an error response with code, message and data; a notification without an id that gets no reply; and a batch as an array of calls.',
        uk: 'Конверт JSON-RPC 2.0: request із jsonrpc, method, params та id; успішна відповідь, що повторює id із result; відповідь-помилка з code, message і data; notification без id, який не отримує відповіді; і batch як масив викликів.',
      })}
    >
      {/* Request card */}
      <rect x="16" y="16" width="330" height="130" rx="10" fill="var(--c-storage-soft)" stroke="var(--accent)" strokeWidth="1.2" />
      <Line x={32} y={40} text={t({ en: '→ request', uk: '→ request' })} color="var(--accent)" size={11} bold />
      <Line x={32} y={62} text='{ "jsonrpc": "2.0",' />
      <Line x={32} y={80} text='  "method": "invoice.markPaid",' color="var(--tx)" />
      <Line x={32} y={98} text='  "params": { "invoiceId": "inv_42" },' />
      <Line x={32} y={116} text='  "id": 7 }' color="var(--accent)" bold />
      <Line x={32} y={136} text={t({ en: 'id = the correlation key', uk: 'id = ключ кореляції' })} color="var(--tx3)" size={9.5} />

      {/* arrows */}
      <line x1="346" y1="56" x2="388" y2="56" stroke="var(--accent-2)" strokeWidth="1.6" />
      <line x1="346" y1="116" x2="388" y2="116" stroke="var(--c-danger)" strokeWidth="1.4" strokeDasharray="5 4" />

      {/* Success response */}
      <rect x="390" y="16" width="314" height="76" rx="10" fill="var(--accent-2-soft)" stroke="var(--accent-2)" strokeWidth="1.2" />
      <Line x={406} y={40} text={t({ en: '← result (same id)', uk: '← result (той самий id)' })} color="var(--accent-2)" size={11} bold />
      <Line x={406} y={62} text='{ "jsonrpc": "2.0", "id": 7,' />
      <Line x={406} y={80} text='  "result": { "status": "paid" } }' color="var(--tx)" />

      {/* Error response */}
      <rect x="390" y="100" width="314" height="88" rx="10" fill="var(--c-danger-soft)" stroke="var(--c-danger)" strokeWidth="1.2" />
      <Line x={406} y={124} text={t({ en: '← or error (XOR — never both)', uk: '← або error (XOR — ніколи обидва)' })} color="var(--c-danger)" size={11} bold />
      <Line x={406} y={146} text='{ "jsonrpc": "2.0", "id": 7,' />
      <Line x={406} y={164} text='  "error": { "code": -32601,' color="var(--tx)" />
      <Line x={406} y={182} text='             "message": "Method not found" } }' color="var(--tx)" />

      {/* Notification */}
      <rect x="16" y="162" width="330" height="86" rx="10" fill="var(--s2)" stroke="var(--c-analytics)" strokeWidth="1.2" strokeDasharray="6 4" />
      <Line x={32} y={186} text={t({ en: '→ notification — NO id', uk: '→ notification — БЕЗ id' })} color="var(--c-analytics)" size={11} bold />
      <Line x={32} y={208} text='{ "jsonrpc": "2.0",' />
      <Line x={32} y={226} text='  "method": "cache.invalidate" }' color="var(--tx)" />
      <Line x={32} y={244} text={t({ en: 'server must never reply — even on error', uk: 'сервер ніколи не відповідає — навіть при помилці' })} color="var(--tx3)" size={9.5} />

      {/* Batch + reserved codes */}
      <rect x="16" y="262" width="688" height="52" rx="10" fill="var(--s2)" stroke="var(--line2)" strokeWidth="1" />
      <Line x={32} y={283} text={t({ en: 'batch: [ {…id:1}, {…id:2}, {…notification} ] → [ {…id:2}, {…id:1} ] — any order, matched by id', uk: 'batch: [ {…id:1}, {…id:2}, {…notification} ] → [ {…id:2}, {…id:1} ] — порядок довільний, звірка за id' })} color="var(--tx2)" size={10} />
      <Line x={32} y={303} text={t({ en: 'codes: -32700 parse · -32600 request · -32601 method · -32602 params · -32603 internal · -32000…-32099 server', uk: 'коди: -32700 parse · -32600 request · -32601 method · -32602 params · -32603 internal · -32000…-32099 серверні' })} color="var(--tx3)" size={9.5} />
    </svg>
  );
}
