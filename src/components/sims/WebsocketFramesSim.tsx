import { useEffect, useMemo, useState } from 'react';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { clamp, cx } from '../../lib/utils';
import { LAST_TICK, OP_NAME, firstByte, hex, timeline, type Opcode } from '../../lib/ws';

/*
 * WebsocketFramesSim — the signature interactive for m12 (CLAUDE.md §6). Thin renderer over the pure
 * timeline in lib/ws.ts: step the clock to watch the HTTP Upgrade handshake (GET → 101) turn the
 * connection into a full-duplex pipe, then frames flow BOTH ways independently — text/binary data,
 * a ping/pong keepalive, and the closing handshake. "Show bytes" reveals each frame's leading byte
 * (FIN | opcode) + MASK bit, tying the timeline to the frame-anatomy figure. Deterministic → SSR-safe.
 */

const TICK_MS = 680;

function Toggle({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" className={cx('ws-toggle', on && 'on')} aria-pressed={on} onClick={onClick}>
      <span className="ws-toggle-dot" aria-hidden="true" />
      {label}
    </button>
  );
}

export function WebsocketFramesSim() {
  const { t } = useLang();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [showBytes, setShowBytes] = useState(false);

  const tl = useMemo(() => timeline(), []);
  const maxTick = LAST_TICK;
  const atEnd = step >= maxTick;

  useEffect(() => {
    const mq = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (mq) {
      setReduced(mq.matches);
      if (mq.matches) setStep(maxTick);
    }
  }, [maxTick]);

  useEffect(() => {
    if (!playing || reduced) return;
    if (step >= maxTick) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => setStep((n) => Math.min(n + 1, maxTick)), TICK_MS);
    return () => window.clearTimeout(id);
  }, [playing, step, maxTick, reduced]);

  const play = () => {
    if (atEnd) setStep(0);
    setPlaying(true);
  };
  const stepFwd = () => {
    setPlaying(false);
    setStep((n) => Math.min(n + 1, maxTick));
  };
  const reset = () => {
    setPlaying(false);
    setStep(0);
  };

  const revealed = tl.filter((e) => e.t <= step);
  const open = step >= 1; // the socket is open once the 101 response is revealed

  const opName = (op: Opcode | undefined): string => (op === undefined ? '' : OP_NAME[op]);

  return (
    <div className="ws" role="group" aria-label={t({ en: 'WebSocket frame timeline simulator', uk: 'Симулятор таймлайну WebSocket-фреймів' })}>
      {/* Rails */}
      <div className="ws-rails" aria-hidden="true">
        <span className="ws-rail-label">Client</span>
        <span className={cx('ws-conn', open && 'open')}>{open ? t({ en: 'open · full-duplex', uk: 'відкрито · full-duplex' }) : t({ en: 'connecting…', uk: 'зʼєднання…' })}</span>
        <span className="ws-rail-label ws-rail-label-r">Server</span>
      </div>

      {/* Timeline */}
      <ol className="ws-timeline">
        {revealed.map((e, i) => {
          const prev = revealed[i - 1];
          const showTick = !prev || prev.t !== e.t;
          const c2s = e.dir === 'c2s';
          const isHs = e.kind !== 'frame';
          const cell = (
            <span className={cx('ws-pill', isHs ? 'hs' : e.control ? 'control' : 'data')}>
              {isHs ? (
                <code className="ws-http mono">{e.http}</code>
              ) : (
                <>
                  <span className="ws-op mono">{opName(e.opcode)}</span>
                  <span className="ws-plabel">{e.label}</span>
                  {!e.fin && <span className="ws-fin mono" title="FIN=0 (more frames follow)">FIN 0</span>}
                  {e.masked && <span className="ws-mask mono" title={t({ en: 'client→server frames are masked', uk: 'фрейми client→server масковані' })}>MASK</span>}
                  {showBytes && e.opcode !== undefined && (
                    <span className="ws-byte mono" title={t({ en: 'leading byte: FIN | opcode', uk: 'провідний байт: FIN | opcode' })}>
                      0x{hex(firstByte(e.opcode, e.fin ?? true))}
                    </span>
                  )}
                </>
              )}
            </span>
          );
          return (
            <li className={cx('ws-row', e.dir, isHs && 'hs')} key={`${e.t}-${i}`}>
              <span className="ws-tick mono" aria-hidden="true">
                {showTick ? `t${e.t}` : ''}
              </span>
              <span className="ws-cell client">{c2s ? cell : null}</span>
              <span className={cx('ws-arrow', c2s ? 'r' : 'l')} aria-hidden="true">
                {c2s ? '→' : '←'}
              </span>
              <span className="ws-cell server">{!c2s ? cell : null}</span>
            </li>
          );
        })}
      </ol>

      {/* Legend */}
      <div className="ws-legend" aria-hidden="true">
        <span className="ws-legend-item">
          <span className="ws-swatch data" /> {t({ en: 'data (text/binary)', uk: 'data (text/binary)' })}
        </span>
        <span className="ws-legend-item">
          <span className="ws-swatch control" /> {t({ en: 'control (ping/pong/close)', uk: 'control (ping/pong/close)' })}
        </span>
        <span className="ws-legend-item">
          <span className="ws-chip mono">MASK</span> {t({ en: 'client→server only', uk: 'лише client→server' })}
        </span>
      </div>

      {/* Transport */}
      <div className="ws-controls-row">
        <button type="button" className="btn" onClick={playing ? () => setPlaying(false) : play}>
          {playing ? t(ui.pause) : t(ui.play)}
        </button>
        <button type="button" className="btn" onClick={stepFwd} disabled={atEnd}>
          {t(ui.step)} →
        </button>
        <button type="button" className="btn" onClick={reset} disabled={step === 0 && !playing}>
          {t(ui.reset)}
        </button>
        <Toggle on={showBytes} label={t({ en: 'Show bytes', uk: 'Показати байти' })} onClick={() => setShowBytes((v) => !v)} />
        <span className="dim ws-progress mono">
          t{clamp(step, 0, maxTick)}/{maxTick}
        </span>
      </div>

      {/* Live region for screen readers */}
      <p className="sr-only" aria-live="polite">
        {open ? t({ en: 'Connection open.', uk: 'Зʼєднання відкрито.' }) : t({ en: 'Handshaking.', uk: 'Рукостискання.' })}{' '}
        {revealed.filter((e) => e.kind === 'frame').length} {t({ en: 'of', uk: 'з' })} {tl.filter((e) => e.kind === 'frame').length}{' '}
        {t({ en: 'frames exchanged; tick', uk: 'фреймів обміняно; тік' })} {clamp(step, 0, maxTick)}/{maxTick}.
      </p>
    </div>
  );
}
