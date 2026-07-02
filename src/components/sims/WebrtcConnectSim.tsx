import { useEffect, useMemo, useState } from 'react';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { clamp, cx } from '../../lib/utils';
import {
  SCENARIOS,
  lastTick,
  phaseAt,
  timeline,
  viaCounts,
  type RtcEvent,
  type Scenario,
} from '../../lib/webrtc';

/*
 * WebrtcConnectSim — the signature interactive for m14 (CLAUDE.md §6). Thin renderer over the pure
 * scripts in lib/webrtc.ts: pick a NAT scenario, then step the clock to watch the offer/answer and
 * trickled candidates ride the SIGNALING lane (dashed, violet), connectivity checks probe pairs
 * peer↔peer (cyan; failed pairs struck out), the winning pair get nominated (open→host, NAT→srflx,
 * symmetric→TURN relay, amber), DTLS key the channel, and full-duplex data flow WITHOUT touching the
 * signaling server. Deterministic → SSR-safe.
 */

const TICK_MS = 720;

const SCENARIO_META: Record<Scenario, { label: { en: string; uk: string }; tag: string }> = {
  open: { label: { en: 'Open internet', uk: 'Відкритий інтернет' }, tag: 'host' },
  nat: { label: { en: 'Behind NATs', uk: 'За NAT-ами' }, tag: 'STUN' },
  relay: { label: { en: 'Symmetric NAT', uk: 'Симетричний NAT' }, tag: 'TURN' },
};

const PHASES = ['signaling', 'ice', 'dtls', 'connected'] as const;
const PHASE_LABEL: Record<(typeof PHASES)[number], { en: string; uk: string }> = {
  signaling: { en: 'signaling', uk: 'signaling' },
  ice: { en: 'ICE', uk: 'ICE' },
  dtls: { en: 'DTLS', uk: 'DTLS' },
  connected: { en: 'connected', uk: 'зʼєднано' },
};

/** Which column a pill renders in: the sender's own lane or the shared path lane. */
const isLaneLocal = (e: RtcEvent): boolean => e.via === 'local' || e.via === 'stun' || e.kind === 'turn-allocate';

export function WebrtcConnectSim() {
  const { t } = useLang();
  const [scenario, setScenario] = useState<Scenario>('nat');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);

  const tl = useMemo(() => timeline(scenario), [scenario]);
  const maxTick = lastTick(tl);
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

  const pick = (s: Scenario) => {
    setScenario(s);
    setPlaying(false);
    setStep(reduced ? lastTick(timeline(s)) : 0);
  };
  const play = () => {
    if (reduced) {
      setStep(maxTick); // no animation under prefers-reduced-motion — jump to the full story
      return;
    }
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
  const phase = phaseAt(tl, step);
  const counts = viaCounts(revealed);

  const pill = (e: RtcEvent) => (
    <span className={cx('rtc-pill', e.via, e.kind === 'check' && e.ok === false && 'fail')}>
      {e.kind === 'check' && <span className="rtc-ok mono">{e.ok ? '✓' : '✖'}</span>}
      <span className="rtc-plabel mono">{e.label}</span>
      {e.via === 'signal' && (
        <span className="rtc-via" title={t({ en: 'travels through YOUR signaling channel (WS/HTTP)', uk: 'їде крізь ТВІЙ signaling-канал (WS/HTTP)' })}>
          via signaling
        </span>
      )}
      {e.via === 'turn' && e.kind !== 'turn-allocate' && (
        <span className="rtc-via turn" title={t({ en: 'relayed by the TURN server (still DTLS-encrypted end-to-end)', uk: 'ретранслюється TURN-сервером (усе одно DTLS-шифровано end-to-end)' })}>
          via TURN
        </span>
      )}
    </span>
  );

  return (
    <div className="rtc" role="group" aria-label={t({ en: 'WebRTC connection establishment simulator', uk: 'Симулятор встановлення WebRTC-зʼєднання' })}>
      {/* Scenario switch — aria-pressed buttons (the m12 house pattern), not a radio group */}
      <div className="rtc-scenarios" role="group" aria-label={t({ en: 'Network scenario', uk: 'Мережевий сценарій' })}>
        {SCENARIOS.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={scenario === s}
            className={cx('rtc-scenario', scenario === s && 'on')}
            onClick={() => pick(s)}
          >
            {t(SCENARIO_META[s].label)} <span className="rtc-scenario-tag mono">{SCENARIO_META[s].tag}</span>
          </button>
        ))}
      </div>

      {/* Rails */}
      <div className="rtc-rails" aria-hidden="true">
        <span className="rtc-rail-label">Peer A</span>
        <span className="rtc-mid-label">{t({ en: 'between the peers · dashed/amber = via a server', uk: 'між peers · пунктир/бурштин = через сервер' })}</span>
        <span className="rtc-rail-label rtc-rail-label-r">Peer B</span>
      </div>

      {/* Timeline */}
      <ol className="rtc-timeline">
        {revealed.map((e, i) => {
          const prev = revealed[i - 1];
          const showTick = !prev || prev.t !== e.t;
          const fromA = e.from === 'a';
          const local = isLaneLocal(e);
          return (
            <li className={cx('rtc-row', local && 'local')} key={`${e.t}-${i}`}>
              <span className="rtc-tick mono" aria-hidden="true">
                {showTick ? `t${e.t}` : ''}
              </span>
              <span className="rtc-cell a">{local && fromA ? pill(e) : null}</span>
              <span className="rtc-cell mid">
                {!local && (
                  <>
                    <span className={cx('rtc-arrow', e.via, fromA ? 'r' : 'l')} aria-hidden="true">
                      {fromA ? '⟶' : '⟵'}
                    </span>
                    {pill(e)}
                  </>
                )}
              </span>
              <span className="rtc-cell b">{local && !fromA ? pill(e) : null}</span>
            </li>
          );
        })}
      </ol>

      {/* Phase + path stats */}
      <div className="rtc-status">
        <span className="rtc-phases" aria-hidden="true">
          {PHASES.map((p) => (
            <span key={p} className={cx('rtc-phase mono', p === phase && 'on')}>
              {t(PHASE_LABEL[p])}
            </span>
          ))}
        </span>
        <span className="dim rtc-counts mono" title={t({ en: 'events per path so far', uk: 'подій на шлях дотепер' })}>
          sig {counts.signal} · p2p {counts.direct} · TURN {counts.turn}
        </span>
      </div>

      {/* Legend */}
      <div className="rtc-legend" aria-hidden="true">
        <span className="rtc-legend-item">
          <span className="rtc-swatch signal" /> {t({ en: 'via signaling (your channel)', uk: 'через signaling (твій канал)' })}
        </span>
        <span className="rtc-legend-item">
          <span className="rtc-swatch direct" /> {t({ en: 'peer ↔ peer', uk: 'peer ↔ peer' })}
        </span>
        <span className="rtc-legend-item">
          <span className="rtc-swatch turn" /> {t({ en: 'via TURN relay', uk: 'через TURN relay' })}
        </span>
        <span className="rtc-legend-item">
          <span className="rtc-swatch fail" /> {t({ en: 'failed check', uk: 'невдала перевірка' })}
        </span>
      </div>

      {/* Transport */}
      <div className="rtc-controls-row">
        <button type="button" className="btn" onClick={playing ? () => setPlaying(false) : play}>
          {playing ? t(ui.pause) : t(ui.play)}
        </button>
        <button type="button" className="btn" onClick={stepFwd} disabled={atEnd}>
          {t(ui.step)} →
        </button>
        <button type="button" className="btn" onClick={reset} disabled={step === 0 && !playing}>
          {t(ui.reset)}
        </button>
        <span className="dim rtc-progress mono">
          t{clamp(step, 0, maxTick)}/{maxTick}
        </span>
      </div>

      {/* Live region for screen readers */}
      <p className="sr-only" aria-live="polite">
        {t({ en: 'Scenario', uk: 'Сценарій' })} {t(SCENARIO_META[scenario].label)}; {t({ en: 'phase', uk: 'фаза' })}{' '}
        {t(PHASE_LABEL[phase])}; {revealed.length} {t({ en: 'of', uk: 'з' })} {tl.length}{' '}
        {t({ en: 'events; signaling carried', uk: 'подій; signaling проніс' })} {counts.signal},{' '}
        {t({ en: 'peer-to-peer', uk: 'peer-to-peer' })} {counts.direct}, {t({ en: 'via TURN', uk: 'через TURN' })}{' '}
        {counts.turn}.
      </p>
    </div>
  );
}
