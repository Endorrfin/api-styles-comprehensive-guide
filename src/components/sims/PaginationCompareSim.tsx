import { useEffect, useMemo, useState } from 'react';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { clamp, cx } from '../../lib/utils';
import {
  PAGES,
  SCENARIOS,
  compare,
  type RunResult,
  type Scenario,
} from '../../lib/pagination';

/*
 * PaginationCompareSim — the interactive for m20 (pagination & rate limiting). Thin renderer over the
 * pure engine in lib/pagination.ts: the SAME newest-first feed is walked three pages deep by an
 * offset client and a cursor client side by side, while the scenario mutates the dataset between
 * fetches. The thesis rendered as two rails: offset's page boundary is a POSITION (writes above it
 * shift the window → re-served duplicates on insert, silently skipped rows on delete); cursor's
 * boundary is a VALUE the client already consumed (keyset), so the walk stays exact under writes.
 * Deterministic → SSR-safe.
 */

const TICK_MS = 900;
/** beats: 1 = page 1 · 2 = the mutation · 3 = page 2 · 4 = page 3 (+ verdict) */
const MAX_STEP = PAGES + 1;

const SCENARIO_META: Record<Scenario, { label: { en: string; uk: string }; tag: string }> = {
  stable: { label: { en: 'Quiet dataset', uk: 'Тихий dataset' }, tag: '=' },
  inserts: { label: { en: '3 rows inserted', uk: '3 рядки вставлено' }, tag: '+3' },
  deletes: { label: { en: '2 rows deleted', uk: '2 рядки видалено' }, tag: '−2' },
};

const MUTATION_LABEL: Record<Scenario, { en: string; uk: string }> = {
  stable: { en: 'no writes between fetches', uk: 'жодних записів між fetch-ами' },
  inserts: { en: 'writes land: 23, 22, 21 inserted on top', uk: 'приходять записи: 23, 22, 21 вставлено зверху' },
  deletes: { en: 'moderation strikes: rows 18, 17 deleted', uk: 'модерація: рядки 18, 17 видалено' },
};

function Rail({ r, pagesShown, done }: { r: RunResult; pagesShown: number; done: boolean }) {
  const { t } = useLang();
  const isCursor = r.strategy === 'cursor';
  return (
    <div className={cx('pgc-rail', isCursor && 'cursor')}>
      {r.pages.slice(0, pagesShown).map((p) => (
        <div className="pgc-page" key={p.n}>
          <div className="pgc-req mono">{p.request}</div>
          <div className="pgc-chips">
            {p.ids.map((id) => {
              const dup = p.duplicates.includes(id);
              return (
                <span key={`${p.n}-${id}`} className={cx('pgc-chip mono', dup && 'dup')} title={dup ? t({ en: 'already received', uk: 'вже отримано' }) : undefined}>
                  {id}
                  {dup && <span aria-hidden="true"> ⚠</span>}
                </span>
              );
            })}
          </div>
        </div>
      ))}
      {done && (
        <div className="pgc-verdict">
          <span className={cx('mono', r.duplicates.length > 0 && 'pgc-bad')}>
            {t({ en: 'duplicates', uk: 'дублі' })} {r.duplicates.length}
          </span>
          <span className={cx('mono', r.missed.length > 0 && 'pgc-bad')}>
            {t({ en: 'silently missed', uk: 'тихо пропущено' })} {r.missed.length}
            {r.missed.length > 0 && ` (${r.missed.join(', ')})`}
          </span>
          {r.duplicates.length === 0 && r.missed.length === 0 && <span className="pgc-exact mono">✓ {t({ en: 'exact', uk: 'точно' })}</span>}
        </div>
      )}
    </div>
  );
}

export function PaginationCompareSim() {
  const { t } = useLang();
  const [scenario, setScenario] = useState<Scenario>('inserts');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);

  const runs = useMemo(() => compare(scenario), [scenario]);
  const atEnd = step >= MAX_STEP;
  /** pages visible at this beat: beat 1 shows page 1; the mutation beat adds none; then one per beat. */
  const pagesShown = step === 0 ? 0 : step === 1 ? 1 : step - 1;
  const mutationShown = step >= 2;

  useEffect(() => {
    const mq = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (mq) {
      setReduced(mq.matches);
      if (mq.matches) setStep(MAX_STEP);
    }
  }, []);

  useEffect(() => {
    if (!playing || reduced) return;
    if (step >= MAX_STEP) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => setStep((n) => Math.min(n + 1, MAX_STEP)), TICK_MS);
    return () => window.clearTimeout(id);
  }, [playing, step, reduced]);

  const restart = (s: Scenario) => {
    setScenario(s);
    setPlaying(false);
    setStep(reduced ? MAX_STEP : 0);
  };
  const play = () => {
    if (reduced) {
      setStep(MAX_STEP);
      return;
    }
    if (atEnd) setStep(0);
    setPlaying(true);
  };
  const stepFwd = () => {
    setPlaying(false);
    setStep((n) => Math.min(n + 1, MAX_STEP));
  };
  const reset = () => {
    setPlaying(false);
    setStep(0);
  };

  return (
    <div className="pgc" role="group" aria-label={t({ en: 'Offset vs cursor pagination simulator', uk: 'Симулятор пагінації offset проти cursor' })}>
      <div className="pgc-controls-top" role="group" aria-label={t({ en: 'Writes between fetches', uk: 'Записи між fetch-ами' })}>
        {SCENARIOS.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={scenario === s}
            className={cx('wh-scenario', scenario === s && 'on')}
            onClick={() => restart(s)}
          >
            {t(SCENARIO_META[s].label)} <span className="wh-scenario-tag mono">{SCENARIO_META[s].tag}</span>
          </button>
        ))}
      </div>

      <div className="pgc-heads" aria-hidden="true">
        <span className="pgc-head">offset</span>
        <span className="pgc-head cursor">cursor</span>
      </div>

      <div className="pgc-grid">
        <Rail r={runs.offset} pagesShown={Math.min(pagesShown, 1)} done={false} />
        <Rail r={runs.cursor} pagesShown={Math.min(pagesShown, 1)} done={false} />
        {mutationShown && (
          <div className={cx('pgc-mutation', scenario !== 'stable' && 'hot')} role="note">
            <span className="mono">{scenario === 'inserts' ? '⇣ +3' : scenario === 'deletes' ? '✕ −2' : '·'}</span>{' '}
            {t(MUTATION_LABEL[scenario])}
          </div>
        )}
        {pagesShown > 1 && (
          <>
            <Rail r={{ ...runs.offset, pages: runs.offset.pages.slice(1) }} pagesShown={pagesShown - 1} done={atEnd} />
            <Rail r={{ ...runs.cursor, pages: runs.cursor.pages.slice(1) }} pagesShown={pagesShown - 1} done={atEnd} />
          </>
        )}
      </div>

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
        <span className="dim mono pgc-progress">
          {clamp(step, 0, MAX_STEP)}/{MAX_STEP}
        </span>
      </div>

      <p className="sr-only" aria-live="polite">
        {t(SCENARIO_META[scenario].label)}.{' '}
        {atEnd
          ? t({
              // label-first counts — declension-proof in UK (house pattern, cf. WebhookDeliverySim)
              en: `offset: duplicates ${runs.offset.duplicates.length}, missed ${runs.offset.missed.length}; cursor: duplicates ${runs.cursor.duplicates.length}, missed ${runs.cursor.missed.length}.`,
              uk: `offset: дублі ${runs.offset.duplicates.length}, пропущено ${runs.offset.missed.length}; cursor: дублі ${runs.cursor.duplicates.length}, пропущено ${runs.cursor.missed.length}.`,
            })
          : `${t({ en: 'step', uk: 'крок' })} ${step}/${MAX_STEP}`}
      </p>
    </div>
  );
}
