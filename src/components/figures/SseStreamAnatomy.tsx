import { useLang } from '../../i18n/lang';

/*
 * sse-stream-anatomy (m13) — the text/event-stream wire format, annotated, plus the auto-reconnect
 * loop. LEFT: a real stream — `retry:` (reconnect delay), then event blocks of `id:` / `event:` /
 * `data:` lines, each dispatched at the blank line. RIGHT: the resume flow — the connection drops,
 * the browser waits `retry` ms and re-GETs with `Last-Event-ID`, the server resumes from there.
 * Colours: violet = id/resume, cyan = data, amber = retry/reconnect, neutral = headers.
 * Ref: WHATWG HTML §9.2 (server-sent events); MDN Using server-sent events.
 */

const LINES: { text: string; color: string; dim?: boolean }[] = [
  { text: 'HTTP/1.1 200 OK', color: 'var(--tx3)', dim: true },
  { text: 'Content-Type: text/event-stream', color: 'var(--tx2)' },
  { text: '', color: 'var(--tx3)' },
  { text: 'retry: 3000', color: 'var(--c-analytics)' },
  { text: '', color: 'var(--tx3)' },
  { text: 'id: 41', color: 'var(--accent)' },
  { text: 'event: price', color: 'var(--tx2)' },
  { text: 'data: {"AAPL": 191.2}', color: 'var(--accent-2)' },
  { text: '', color: 'var(--tx3)' },
  { text: 'id: 42', color: 'var(--accent)' },
  { text: 'event: price', color: 'var(--tx2)' },
  { text: 'data: {"AAPL": 191.4}', color: 'var(--accent-2)' },
];

export function SseStreamAnatomy() {
  const { t } = useLang();
  const y0 = 46;
  const lh = 17;

  return (
    <svg
      viewBox="0 0 720 360"
      className="fig-svg"
      role="img"
      aria-label={t({
        en: 'The Server-Sent Events wire format: a text/event-stream response carrying retry, id, event, and data lines, with blank lines dispatching each event — and the reconnect loop where the browser automatically re-requests with a Last-Event-ID header so the server can resume the stream.',
        uk: 'Формат Server-Sent Events на дроті: відповідь text/event-stream із рядками retry, id, event і data, де порожні рядки відправляють кожну подію, — і цикл перепідключення, де браузер автоматично повторює запит із заголовком Last-Event-ID, щоб сервер відновив потік.',
      })}
    >
      {/* ── The stream (left) ── */}
      <rect x="16" y="14" width="336" height="252" rx="10" fill="var(--s2)" stroke="var(--line2)" strokeWidth="1" />
      <text x="32" y="34" fill="var(--tx3)" fontSize="10" fontFamily="var(--font-body)">
        {t({ en: 'one long-lived GET response…', uk: 'одна довгоживуча GET-відповідь…' })}
      </text>
      {LINES.map((l, i) => (
        <text key={i} x="32" y={y0 + i * lh + 14} fill={l.color} fontSize="11.5" fontFamily="var(--font-mono)" opacity={l.dim ? 0.75 : 1}>
          {l.text === '' ? '␤' : l.text}
        </text>
      ))}

      {/* field annotations */}
      <text x="366" y={y0 + 3 * lh + 14} fill="var(--c-analytics)" fontSize="10" fontFamily="var(--font-body)">
        ← {t({ en: 'reconnect delay (ms)', uk: 'затримка reconnect (мс)' })}
      </text>
      <text x="366" y={y0 + 5 * lh + 14} fill="var(--accent)" fontSize="10" fontFamily="var(--font-body)">
        ← {t({ en: 'sets Last-Event-ID', uk: 'встановлює Last-Event-ID' })}
      </text>
      <text x="366" y={y0 + 7 * lh + 14} fill="var(--accent-2)" fontSize="10" fontFamily="var(--font-body)">
        ← {t({ en: 'the payload (UTF-8 text)', uk: 'payload (UTF-8 текст)' })}
      </text>
      <text x="366" y={y0 + 8 * lh + 14} fill="var(--tx3)" fontSize="10" fontFamily="var(--font-body)">
        ← {t({ en: 'blank line = dispatch event', uk: 'порожній рядок = відправити подію' })}
      </text>

      {/* ── The reconnect loop (bottom-right, below the annotation rows) ── */}
      <rect x="368" y="210" width="336" height="116" rx="10" fill="var(--c-storage-soft)" stroke="var(--accent)" strokeWidth="1" strokeDasharray="5 4" />
      <text x="536" y="232" textAnchor="middle" fill="var(--tx)" fontSize="11" fontFamily="var(--font-body)" fontWeight="700">
        {t({ en: 'connection drops → the browser retries by itself', uk: 'зʼєднання рветься → браузер сам повторює' })}
      </text>
      <text x="536" y="256" textAnchor="middle" fill="var(--c-analytics)" fontSize="10.5" fontFamily="var(--font-mono)">
        {t({ en: 'wait retry (3000 ms)', uk: 'чекає retry (3000 мс)' })}
      </text>
      <text x="536" y="278" textAnchor="middle" fill="var(--accent)" fontSize="10.5" fontFamily="var(--font-mono)">
        GET /stream · Last-Event-ID: 42
      </text>
      <text x="536" y="300" textAnchor="middle" fill="var(--accent-2)" fontSize="10.5" fontFamily="var(--font-mono)">
        {t({ en: '→ server resumes from id 43', uk: '→ сервер відновлює з id 43' })}
      </text>
      <text x="536" y="318" textAnchor="middle" fill="var(--tx3)" fontSize="9.5" fontFamily="var(--font-body)">
        {t({ en: 'resume logic is YOUR server-side job', uk: 'логіка resume — робота ТВОГО сервера' })}
      </text>
    </svg>
  );
}
