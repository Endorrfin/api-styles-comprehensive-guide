import { useEffect, useMemo, useState } from 'react';
import type { Localized } from '../../data/types';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { cx } from '../../lib/utils';
import {
  maturityShape,
  planLifecycle,
  transferCost,
  type LifecycleOptions,
  type StepId,
  type StepOutcome,
  type Transfer,
} from '../../lib/rest';

const STEP_LABEL: Record<StepId, Localized> = {
  request: { en: 'Client request', uk: 'Запит клієнта' },
  cache: { en: 'Cache lookup', uk: 'Пошук у кеші' },
  revalidate: { en: 'Revalidate · If-None-Match', uk: 'Revalidate · If-None-Match' },
  origin: { en: 'Origin handler', uk: 'Origin handler' },
  response: { en: 'Response', uk: 'Відповідь' },
};

const OUTCOME_LABEL: Record<StepOutcome, Localized> = {
  sent: { en: 'GET sent', uk: 'GET надіслано' },
  miss: { en: 'miss — nothing cached', uk: 'miss — нічого в кеші' },
  fresh: { en: 'hit — still fresh', uk: 'hit — ще свіже' },
  stale: { en: 'hit — stale (past max-age)', uk: 'hit — застаріле (past max-age)' },
  conditional: { en: 'sending ETag to validate', uk: 'надсилаємо ETag для перевірки' },
  'compared-same': { en: 'ETag matches — unchanged', uk: 'ETag збігається — без змін' },
  'compared-diff': { en: 'ETag differs — changed', uk: 'ETag відрізняється — змінено' },
  handled: { en: 'built a fresh representation', uk: 'зібрано свіже representation' },
  'from-cache': { en: '200 — from cache', uk: '200 — з кешу' },
  'not-modified': { en: '304 Not Modified', uk: '304 Not Modified' },
  'ok-full': { en: '200 OK — full body', uk: '200 OK — повне тіло' },
};

const TRANSFER_LABEL: Record<Transfer, Localized> = {
  full: { en: 'Full body transferred from origin', uk: 'Повне тіло передано з origin' },
  'validator-only': { en: '304 — headers only, near-zero bytes', uk: '304 — лише заголовки, майже нуль байтів' },
  'served-from-cache': { en: 'Served from cache — no origin round-trip', uk: 'Віддано з кешу — без origin round-trip' },
};

const STEP_MS = 850;

function Toggle({
  on,
  disabled,
  label,
  onClick,
}: {
  on: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cx('rest-toggle', on && 'on')}
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="rest-toggle-dot" aria-hidden="true" />
      {label}
    </button>
  );
}

export function RestRequestLifecycleSim() {
  const { t } = useLang();
  const [opts, setOpts] = useState<LifecycleOptions>({
    warmCache: true,
    expired: true,
    useEtag: true,
    resourceChanged: false,
  });
  const [maturity, setMaturity] = useState(2);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);

  const result = useMemo(() => planLifecycle(opts), [opts]);
  const shape = maturityShape(maturity);
  const steps = result.steps;
  const lastIndex = steps.length - 1;
  const atEnd = stepIndex >= lastIndex;

  useEffect(() => {
    const mq = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (mq) setReduced(mq.matches);
  }, []);

  // Reset the walk whenever the scenario changes.
  useEffect(() => {
    setStepIndex(reduced ? Math.max(0, steps.length - 1) : 0);
    setPlaying(false);
  }, [opts, reduced, steps.length]);

  // Auto-advance while playing (skipped under reduced motion — the fallback shows all steps at once).
  useEffect(() => {
    if (!playing || reduced) return;
    if (stepIndex >= lastIndex) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => setStepIndex((i) => Math.min(i + 1, lastIndex)), STEP_MS);
    return () => window.clearTimeout(id);
  }, [playing, stepIndex, lastIndex, reduced]);

  const set = (patch: Partial<LifecycleOptions>) => setOpts((o) => ({ ...o, ...patch }));
  const play = () => {
    if (atEnd) setStepIndex(0);
    setPlaying(true);
  };
  const stepFwd = () => {
    setPlaying(false);
    setStepIndex((i) => Math.min(i + 1, lastIndex));
  };
  const reset = () => {
    setPlaying(false);
    setStepIndex(0);
  };

  const statusColor = result.status === 200 ? 'var(--c-commit)' : result.status === 304 ? 'var(--c-dist)' : 'var(--accent)';
  const current = steps[Math.min(stepIndex, lastIndex)];

  return (
    <div className="rest-sim" role="group" aria-label="REST request lifecycle simulator">
      {/* Scenario controls */}
      <div className="rest-controls">
        <div className="rest-toggles">
          <Toggle on={opts.warmCache} label={t({ en: 'Warm cache', uk: 'Теплий кеш' })} onClick={() => set({ warmCache: !opts.warmCache })} />
          <Toggle
            on={opts.expired}
            disabled={!opts.warmCache}
            label={t({ en: 'Cached copy expired', uk: 'Кеш протух' })}
            onClick={() => set({ expired: !opts.expired })}
          />
          <Toggle on={opts.useEtag} label={t({ en: 'ETag / conditional', uk: 'ETag / conditional' })} onClick={() => set({ useEtag: !opts.useEtag })} />
          <Toggle
            on={opts.resourceChanged}
            disabled={!(opts.warmCache && opts.expired && opts.useEtag)}
            label={t({ en: 'Resource changed', uk: 'Ресурс змінився' })}
            onClick={() => set({ resourceChanged: !opts.resourceChanged })}
          />
        </div>

        <div className="rest-maturity" role="group" aria-label={t({ en: 'Richardson maturity level', uk: 'Рівень Richardson maturity' })}>
          <span className="dim">{t({ en: 'Maturity', uk: 'Maturity' })}</span>
          {[0, 1, 2, 3].map((lv) => (
            <button
              key={lv}
              type="button"
              className={cx('rest-lv', maturity === lv && 'on')}
              aria-pressed={maturity === lv}
              onClick={() => setMaturity(lv)}
            >
              L{lv}
            </button>
          ))}
        </div>
      </div>

      {/* Request shape (from Richardson level) */}
      <div className="rest-shape mono">
        <span className="rest-verb" style={{ color: statusColor }}>
          {shape.verb}
        </span>{' '}
        {shape.url}
        {shape.hypermedia && <span className="dim"> · _links{' {…}'}</span>}
        <span className="dim">
          {'  '}
          {shape.hypermedia
            ? t({ en: '(hypermedia-driven)', uk: '(hypermedia-driven)' })
            : shape.verbs
              ? t({ en: '(resources + verbs)', uk: '(ресурси + дієслова)' })
              : t({ en: '(RPC-style)', uk: '(RPC-стиль)' })}
        </span>
      </div>

      {/* Pipeline */}
      <ol className="rest-pipeline">
        {steps.map((s, i) => {
          const active = i <= stepIndex;
          const isCurrent = i === Math.min(stepIndex, lastIndex);
          return (
            <li key={s.id + i} className={cx('rest-step', active && 'on', isCurrent && 'current')}>
              <span className="rest-step-dot" aria-hidden="true" />
              <span className="rest-step-body">
                <span className="rest-step-label">{t(STEP_LABEL[s.id])}</span>
                <span className="rest-step-outcome dim">{t(OUTCOME_LABEL[s.outcome])}</span>
              </span>
            </li>
          );
        })}
      </ol>

      {/* Result */}
      <div className="rest-result">
        <span className="rest-status" style={{ background: statusColor }}>
          {result.status}
        </span>
        <div className="rest-result-body">
          <strong>{t(TRANSFER_LABEL[result.transfer])}</strong>
          <div className="rest-meter" aria-hidden="true">
            <span className="rest-meter-fill" style={{ width: `${transferCost(result.transfer)}%`, background: statusColor }} />
          </div>
          <span className="dim">
            {result.reachedOrigin
              ? t({ en: 'Origin was contacted.', uk: 'Origin було задіяно.' })
              : t({ en: 'Origin was never contacted.', uk: 'Origin не задіювався.' })}
          </span>
        </div>
      </div>

      {/* Transport */}
      <div className="rest-controls-row">
        <button type="button" className="btn" onClick={playing ? () => setPlaying(false) : play}>
          {playing ? t(ui.pause) : t(ui.play)}
        </button>
        <button type="button" className="btn" onClick={stepFwd} disabled={atEnd}>
          {t(ui.step)} →
        </button>
        <button type="button" className="btn" onClick={reset}>
          {t(ui.reset)}
        </button>
        <span className="dim rest-progress">
          {Math.min(stepIndex + 1, steps.length)}/{steps.length}
        </span>
      </div>

      {/* Live region for screen readers */}
      <p className="sr-only" aria-live="polite">
        {t(STEP_LABEL[current.id])}: {t(OUTCOME_LABEL[current.outcome])}
      </p>
    </div>
  );
}
