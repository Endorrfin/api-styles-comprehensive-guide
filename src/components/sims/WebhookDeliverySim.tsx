import { useEffect, useMemo, useState } from 'react';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { clamp, cx } from '../../lib/utils';
import {
  SCENARIOS,
  attempts,
  effects,
  lastTick,
  timeline,
  type Scenario,
  type WhEvent,
} from '../../lib/webhook';

/*
 * WebhookDeliverySim — the signature interactive for m15 (CLAUDE.md §6). Thin renderer over the pure
 * scripts in lib/webhook.ts: pick an endpoint scenario, then step the clock to watch one event's
 * delivery — sign → POST attempts (same webhook-id every time) → verify → process → ack, with
 * exponential backoff between failures. The "consumer dedups" toggle is the module's thesis: in the
 * flaky scenario the ack of a SUCCESSFUL attempt is lost, the provider re-delivers (at-least-once!),
 * and the effect count lands on 1 with an idempotency key — or 2 without (the double-charge bug).
 * Deterministic → SSR-safe.
 */

const TICK_MS = 700;

const SCENARIO_META: Record<Scenario, { label: { en: string; uk: string }; tag: string }> = {
  healthy: { label: { en: 'Healthy endpoint', uk: 'Здоровий endpoint' }, tag: '200' },
  flaky: { label: { en: 'Flaky endpoint', uk: 'Нестабільний endpoint' }, tag: 'retry' },
  down: { label: { en: 'Endpoint down', uk: 'Endpoint лежить' }, tag: 'DLQ' },
};

/** Provider-lane bookkeeping events vs the wire-crossing POST and the consumer's reply.
 *  A provider-side 'response' is a timeout the provider observed — nothing crossed the wire,
 *  so it gets no reply arrow. */
const arrowFor = (e: WhEvent): '→' | '←' | '' =>
  e.kind === 'attempt' ? '→' : e.kind === 'response' && e.side === 'consumer' ? '←' : '';

export function WebhookDeliverySim() {
  const { t } = useLang();
  const [scenario, setScenario] = useState<Scenario>('flaky');
  const [dedup, setDedup] = useState(true);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);

  const tl = useMemo(() => timeline(scenario, dedup), [scenario, dedup]);
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

  const restart = (s: Scenario, d: boolean) => {
    setScenario(s);
    setDedup(d);
    setPlaying(false);
    setStep(reduced ? lastTick(timeline(s, d)) : 0);
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
  const nAttempts = attempts(revealed);
  const nEffects = effects(revealed);
  const doubled = nEffects > 1;

  const pill = (e: WhEvent) => (
    <span
      className={cx(
        'wh-pill',
        e.kind,
        e.ok === false && 'fail',
        e.kind === 'response' && e.status === undefined && 'timeout',
      )}
    >
      {e.kind === 'verify' && <span className="wh-ok mono">✓</span>}
      {e.ok === false && e.kind !== 'backoff' && <span className="wh-ok mono">✖</span>}
      <span className="wh-plabel mono">{e.label}</span>
    </span>
  );

  return (
    <div className="wh" role="group" aria-label={t({ en: 'Webhook delivery simulator', uk: 'Симулятор доставки webhook' })}>
      {/* Scenario switch + dedup toggle */}
      <div className="wh-controls-top">
        <div className="wh-scenarios" role="group" aria-label={t({ en: 'Endpoint scenario', uk: 'Сценарій endpoint-а' })}>
          {SCENARIOS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={scenario === s}
              className={cx('wh-scenario', scenario === s && 'on')}
              onClick={() => restart(s, dedup)}
            >
              {t(SCENARIO_META[s].label)} <span className="wh-scenario-tag mono">{SCENARIO_META[s].tag}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className={cx('wh-toggle', dedup && 'on')}
          aria-pressed={dedup}
          onClick={() => restart(scenario, !dedup)}
        >
          <span className="wh-toggle-dot" aria-hidden="true" />
          {t({ en: 'Consumer dedups (idempotency key)', uk: 'Consumer дедуплікує (idempotency key)' })}
        </button>
      </div>

      {/* Rails */}
      <div className="wh-rails" aria-hidden="true">
        <span className="wh-rail-label">Provider</span>
        <span className="wh-mid-label">{t({ en: 'one event · evt_42', uk: 'одна подія · evt_42' })}</span>
        <span className="wh-rail-label wh-rail-label-r">Consumer</span>
      </div>

      {/* Timeline */}
      <ol className="wh-timeline">
        {revealed.map((e, i) => {
          const prev = revealed[i - 1];
          const showTick = !prev || prev.t !== e.t;
          const onProvider = e.side === 'provider';
          const arrow = arrowFor(e);
          return (
            <li className={cx('wh-row', e.kind === 'backoff' && 'gap')} key={`${e.t}-${i}`}>
              <span className="wh-tick mono" aria-hidden="true">
                {showTick ? `t${e.t}` : ''}
              </span>
              <span className="wh-cell provider">{onProvider ? pill(e) : null}</span>
              <span className={cx('wh-arrow', arrow === '' && 'none', e.ok === false && 'fail')} aria-hidden="true">
                {arrow}
              </span>
              <span className="wh-cell consumer">{!onProvider ? pill(e) : null}</span>
            </li>
          );
        })}
      </ol>

      {/* Delivery counters — the module's thesis in two numbers */}
      <div className="wh-status">
        <span className="mono dim">
          {t({ en: 'attempts', uk: 'спроби' })} {nAttempts}
        </span>
        <span className={cx('mono', 'wh-effects', doubled && 'fail')}>
          {t({ en: 'business effects', uk: 'бізнес-ефекти' })} {nEffects}
          {doubled && ' ⚠'}
        </span>
        <span className="dim wh-progress mono">
          t{clamp(step, 0, maxTick)}/{maxTick}
        </span>
      </div>

      {/* Transport */}
      <div className="wh-controls-row">
        <button type="button" className="btn" onClick={playing ? () => setPlaying(false) : play}>
          {playing ? t(ui.pause) : t(ui.play)}
        </button>
        <button type="button" className="btn" onClick={stepFwd} disabled={atEnd}>
          {t(ui.step)} →
        </button>
        <button type="button" className="btn" onClick={reset} disabled={step === 0 && !playing}>
          {t(ui.reset)}
        </button>
      </div>

      {/* Live region for screen readers */}
      <p className="sr-only" aria-live="polite">
        {t(SCENARIO_META[scenario].label)}; {t({ en: 'dedup', uk: 'дедуплікація' })}{' '}
        {dedup ? t({ en: 'on', uk: 'увімкнена' }) : t({ en: 'off', uk: 'вимкнена' })};{' '}
        {t({ en: 'attempts:', uk: 'спроби:' })} {nAttempts}; {t({ en: 'business effects:', uk: 'бізнес-ефекти:' })}{' '}
        {nEffects}. {doubled && t({ en: 'Warning: the effect was applied twice.', uk: 'Увага: ефект застосовано двічі.' })}
      </p>
    </div>
  );
}
