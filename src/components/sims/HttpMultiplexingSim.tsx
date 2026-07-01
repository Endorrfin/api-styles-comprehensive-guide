import { useEffect, useMemo, useState } from 'react';
import type { Localized } from '../../data/types';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { clamp, cx, range } from '../../lib/utils';
import { DEFAULTS, PROTOCOL_FACTS, PROTOCOLS, REQUEST_CHOICES, simulate, type Protocol, type StreamTrace } from '../../lib/http';

/*
 * HttpMultiplexingSim — the signature interactive for m3 (CLAUDE.md §6). Thin renderer over the pure
 * engine in lib/http.ts: pick a protocol, choose how many requests, toggle a lost packet, and watch a
 * stepped clock schedule the streams. HTTP/1.1 serialises past its connection cap; HTTP/2 multiplexes
 * but one loss stalls every stream (TCP HOL); HTTP/3 (QUIC) stalls only the hit stream. Deterministic
 * engine → SSR-safe: at tick 0 the whole layout renders with no timers.
 */

const TICK_MS = 620;

const HOL_LABEL: Record<Protocol, Localized> = {
  h1: { en: 'blocks the rest of its own connection', uk: 'блокує решту свого зʼєднання' },
  h2: { en: 'stalls every stream on the connection', uk: 'зупиняє всі стріми на зʼєднанні' },
  h3: { en: 'stalls only its own stream', uk: 'зупиняє лише власний стрім' },
};

function Toggle({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" className={cx('mux-toggle', on && 'on')} aria-pressed={on} onClick={onClick}>
      <span className="mux-toggle-dot" aria-hidden="true" />
      {label}
    </button>
  );
}

export function HttpMultiplexingSim() {
  const { t } = useLang();
  const [protocol, setProtocol] = useState<Protocol>('h1');
  const [requests, setRequests] = useState<number>(DEFAULTS.requests);
  const [loss, setLoss] = useState(false);
  const [tick, setTick] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);

  const result = useMemo(() => simulate({ protocol, ...DEFAULTS, requests, loss }), [protocol, requests, loss]);
  const maxTick = Math.max(1, result.totalTicks);
  const atEnd = tick >= maxTick;

  useEffect(() => {
    const mq = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (mq) setReduced(mq.matches);
  }, []);

  // Reset the clock whenever the scenario changes (reduced motion jumps straight to the finished state).
  useEffect(() => {
    setTick(reduced ? maxTick : 0);
    setPlaying(false);
  }, [protocol, requests, loss, reduced, maxTick]);

  // Auto-advance one tick at a time while playing (skipped under reduced motion).
  useEffect(() => {
    if (!playing || reduced) return;
    if (tick >= maxTick) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => setTick((n) => Math.min(n + 1, maxTick)), TICK_MS);
    return () => window.clearTimeout(id);
  }, [playing, tick, maxTick, reduced]);

  const play = () => {
    if (atEnd) setTick(0);
    setPlaying(true);
  };
  const stepFwd = () => {
    setPlaying(false);
    setTick((n) => Math.min(n + 1, maxTick));
  };
  const reset = () => {
    setPlaying(false);
    setTick(0);
  };

  // Group streams into visual lanes: h1 → one row per TCP connection (queues stack); h2/h3 → one row
  // per stream (all share a single connection).
  const laneCount = protocol === 'h1' ? result.connections : result.streams.length;
  const lanes: StreamTrace[][] = useMemo(() => {
    const acc: StreamTrace[][] = range(laneCount).map(() => []);
    for (const s of result.streams) acc[s.lane]?.push(s);
    return acc;
  }, [result, laneCount]);

  const segColor = protocol === 'h1' ? 'var(--accent)' : 'var(--accent-2)';
  const done = result.streams.filter((s) => s.end <= tick).length;

  return (
    <div className="mux" role="group" aria-label={t({ en: 'HTTP multiplexing simulator', uk: 'Симулятор HTTP multiplexing' })}>
      {/* Controls */}
      <div className="mux-controls">
        <div className="mux-protos" role="group" aria-label={t({ en: 'Protocol', uk: 'Протокол' })}>
          {PROTOCOLS.map((p) => {
            const on = protocol === p;
            return (
              <button key={p} type="button" className={cx('mux-proto', on && 'on')} aria-pressed={on} onClick={() => setProtocol(p)}>
                {PROTOCOL_FACTS[p].wire}
              </button>
            );
          })}
        </div>
        <div className="mux-opts">
          <div className="mux-reqs" role="group" aria-label={t({ en: 'Requests', uk: 'Запити' })}>
            <span className="dim mux-reqs-label">{t({ en: 'Requests', uk: 'Запити' })}</span>
            {REQUEST_CHOICES.map((r) => (
              <button key={r} type="button" className={cx('mux-req', requests === r && 'on')} aria-pressed={requests === r} onClick={() => setRequests(r)}>
                {r}
              </button>
            ))}
          </div>
          <Toggle on={loss} label={t({ en: 'Lose a packet', uk: 'Втратити пакет' })} onClick={() => setLoss((v) => !v)} />
        </div>
      </div>

      {/* Gantt stage: lanes across a shared time axis, with a sweeping playhead */}
      <div className="mux-stage">
        <div className="mux-lanes-wrap">
          <ol className="mux-lanes" style={{ ['--lanes' as string]: laneCount }}>
            {lanes.map((segs, laneIdx) => (
              <li className="mux-lane" key={laneIdx}>
                <span className="mux-lane-tag mono" aria-hidden="true">
                  {protocol === 'h1' ? `c${laneIdx + 1}` : `s${laneIdx + 1}`}
                </span>
                <span className="mux-lane-track">
                  {segs.map((s) => {
                    const span = s.end - s.start;
                    const left = (s.start / maxTick) * 100;
                    const width = (span / maxTick) * 100;
                    const progress = clamp((tick - s.start) / span, 0, 1);
                    const hasRetransmit = s.end - s.start > DEFAULTS.cost;
                    const servicePct = hasRetransmit ? (DEFAULTS.cost / span) * 100 : 100;
                    const fill = hasRetransmit
                      ? `linear-gradient(90deg, ${segColor} 0 ${servicePct}%, var(--c-danger) ${servicePct}% 100%)`
                      : segColor;
                    return (
                      <span
                        key={s.id}
                        className={cx('mux-seg', s.end <= tick && 'done', s.start <= tick && tick < s.end && 'active', s.stalled && 'stalled')}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        title={`#${s.id + 1}`}
                      >
                        <span className="mux-seg-fill" style={{ width: `${progress * 100}%`, background: fill }} />
                        <span className="mux-seg-id mono" aria-hidden="true">
                          {s.id + 1}
                        </span>
                      </span>
                    );
                  })}
                </span>
              </li>
            ))}
          </ol>
          {/* Playhead — swept across the track area only (offset past the lane labels via --tagw). */}
          <span className="mux-playhead" style={{ ['--frac' as string]: clamp(tick, 0, maxTick) / maxTick }} aria-hidden="true" />
        </div>
      </div>

      {/* Readout */}
      <div className="mux-readout">
        <span className="mux-badge" style={{ background: segColor }}>
          {result.facts.wire}
        </span>
        <span className="mux-transport dim">{result.facts.transport}</span>
        <span className="mux-metrics mono">
          <span title={t({ en: 'connections opened', uk: 'відкрито зʼєднань' })}>
            {result.connections} {t({ en: 'conn', uk: 'зʼєдн' })}
          </span>
          <span title={t({ en: 'ticks until every request is done', uk: 'тіків до завершення всіх запитів' })}>
            {result.totalTicks} {t({ en: 'total', uk: 'усього' })}
          </span>
          <span title={t({ en: 'average completion tick', uk: 'середній тік завершення' })}>
            {result.avgTicks} {t({ en: 'avg', uk: 'сер' })}
          </span>
          <span className={cx('mux-stalled', loss && result.stalledStreams > 0 && 'hot')} title={t({ en: 'streams delayed by the loss', uk: 'стрімів затримано втратою' })}>
            {result.stalledStreams} {t({ en: 'stalled', uk: 'застопорено' })}
          </span>
        </span>
      </div>

      {/* Plain-language verdict */}
      <p className="mux-verdict">
        {!loss
          ? protocol === 'h1'
            ? t({
                en: `HTTP/1.1 opens ${result.connections} parallel connections; requests past that wait their turn.`,
                uk: `HTTP/1.1 відкриває ${result.connections} паралельних зʼєднань; запити понад це чекають черги.`,
              })
            : t({
                en: 'One connection, all requests multiplexed as concurrent streams — no per-connection queue.',
                uk: 'Одне зʼєднання, усі запити мультиплексовані як паралельні стріми — без черги на зʼєднанні.',
              })
          : t({
              en: `Lost packet → ${t(HOL_LABEL[protocol])}.`,
              uk: `Втрачений пакет → ${t(HOL_LABEL[protocol])}.`,
            })}
      </p>

      {/* Transport */}
      <div className="mux-controls-row">
        <button type="button" className="btn" onClick={playing ? () => setPlaying(false) : play}>
          {playing ? t(ui.pause) : t(ui.play)}
        </button>
        <button type="button" className="btn" onClick={stepFwd} disabled={atEnd}>
          {t(ui.step)} →
        </button>
        <button type="button" className="btn" onClick={reset} disabled={tick === 0 && !playing}>
          {t(ui.reset)}
        </button>
        <span className="dim mux-progress mono">
          t{clamp(tick, 0, maxTick)}/{maxTick} · {done}/{result.streams.length}
        </span>
      </div>

      {/* Live region for screen readers */}
      <p className="sr-only" aria-live="polite">
        {result.facts.wire}, {requests} {t({ en: 'requests', uk: 'запитів' })}
        {loss ? `, ${t({ en: 'packet lost', uk: 'пакет втрачено' })}` : ''}. {t({ en: 'Tick', uk: 'Тік' })} {clamp(tick, 0, maxTick)}/{maxTick}.{' '}
        {result.stalledStreams} {t({ en: 'of', uk: 'з' })} {result.streams.length} {t({ en: 'streams stalled; average completion', uk: 'стрімів застопорено; середнє завершення' })} {result.avgTicks}.
      </p>
    </div>
  );
}
