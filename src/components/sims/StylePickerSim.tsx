import { useMemo, useState } from 'react';
import { getSection } from '../../data/meta';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { hrefModule } from '../../lib/hashRouter';
import { cx } from '../../lib/utils';
import { QUESTIONS, WHEN_NOT, pickVerdict, rankPicks, type Answers, type QuestionId, type RankedPick } from '../../lib/picker';

/*
 * StylePickerSim — the last signature interactive (m24 + the #/decide page; CLAUDE.md §6).
 * Thin renderer over the pure engine in lib/picker.ts: five plain-language questions about the
 * boundary → a ranked verdict with NAMED reasons and the winner's when-NOT line. The differentiator
 * vs the compass: the compass makes you speak axis; the picker speaks product and shows its work —
 * every boost and veto is an argument you can disagree with. No timers → SSR-safe and
 * reduced-motion-safe by construction.
 */
export function StylePickerSim() {
  const { t, lang } = useLang();
  const [answers, setAnswers] = useState<Answers>({});

  const ranked = useMemo(() => rankPicks(answers), [answers]);
  const verdict = useMemo(() => pickVerdict(answers), [answers]);

  const setAnswer = (qid: QuestionId, oid: string) =>
    setAnswers((a) => {
      const next = { ...a };
      if (next[qid] === oid) delete next[qid]; // toggle off → question back to unanswered
      else next[qid] = oid;
      return next;
    });
  const reset = () => setAnswers({});

  const accentOf = (p: RankedPick) => getSection(p.profile.section)?.accent ?? 'var(--accent)';

  const reasonRows = (p: RankedPick) =>
    p.adjustments.map((adj, i) => (
      <li key={i} className={cx('spk-reason', adj.delta < 0 && 'neg')}>
        <span className="spk-reason-delta mono">{adj.delta > 0 ? `+${adj.delta}` : adj.delta}</span>
        <span>{t(adj.reason)}</span>
      </li>
    ));

  return (
    <div className="spk" role="group" aria-label={t({ en: 'API Style Picker', uk: 'API Style Picker' })}>
      {/* The five boundary questions */}
      <div className="spk-questions">
        {QUESTIONS.map((q, qi) => {
          const chosen = answers[q.id];
          return (
            <div className="spk-q" key={q.id} role="group" aria-label={t(q.prompt)}>
              <div className="spk-q-head">
                <span className="spk-q-num mono">{qi + 1}</span>
                <span className="spk-q-prompt">{t(q.prompt)}</span>
              </div>
              <div className="spk-q-opts">
                {q.options.map((opt) => {
                  const on = chosen === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={cx('spk-opt', on && 'on')}
                      aria-pressed={on}
                      onClick={() => setAnswer(q.id, opt.id)}
                    >
                      {t(opt.label)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Verdict + ranked field */}
      <div className="spk-results">
        <div className="spk-results-head">
          <span className="spk-progress dim">
            {verdict
              ? `${verdict.answered} / ${QUESTIONS.length} ${t({ en: 'answered', uk: 'відповідей' })}`
              : t({ en: 'Answer any question to get a verdict.', uk: 'Дай відповідь на будь-яке питання — отримаєш вердикт.' })}
          </span>
          <button type="button" className="btn spk-reset" onClick={reset} disabled={!verdict}>
            {t(ui.reset)}
          </button>
        </div>

        {verdict && (
          <div className="spk-verdict">
            {/* Winner */}
            <a
              className="spk-win"
              href={hrefModule(verdict.top.profile.moduleId)}
              style={{ ['--sc' as string]: accentOf(verdict.top) }}
            >
              <span className="spk-win-tag dim">{t({ en: 'Best fit', uk: 'Найкращий fit' })}</span>
              <span className="spk-win-name">
                <span className="spk-crown" aria-hidden="true">★</span>
                {verdict.top.profile.name}
                <span className="spk-win-score mono">{verdict.top.score}%</span>
              </span>
              <span className="spk-win-blurb dim">{verdict.top.profile.blurb[lang] || verdict.top.profile.blurb.en}</span>
            </a>
            {verdict.top.adjustments.length > 0 && <ul className="spk-reasons">{reasonRows(verdict.top)}</ul>}
            <p className="spk-whennot">
              <strong>{t({ en: 'When NOT:', uk: 'Коли НЕ:' })}</strong> {t(WHEN_NOT[verdict.top.profile.key])}
            </p>

            {/* Runner-up */}
            <div className="spk-runner" style={{ ['--sc' as string]: accentOf(verdict.runnerUp) }}>
              <span className="dim">{t({ en: 'Runner-up', uk: 'Другий вибір' })}:</span>{' '}
              <a href={hrefModule(verdict.runnerUp.profile.moduleId)} className="spk-runner-name">
                {verdict.runnerUp.profile.name}
              </a>{' '}
              <span className="mono dim">{verdict.runnerUp.score}%</span>
              {verdict.runnerUp.adjustments.length > 0 && <ul className="spk-reasons">{reasonRows(verdict.runnerUp)}</ul>}
            </div>
          </div>
        )}

        {/* The whole field, always visible — the picker doubles as a map of the landscape */}
        <ol className="spk-field">
          {ranked.map((p) => {
            const accent = accentOf(p);
            const lead = verdict !== null && p === ranked[0];
            return (
              <li key={p.profile.key}>
                <a className={cx('spk-row', lead && 'lead')} href={hrefModule(p.profile.moduleId)}>
                  <span className="spk-row-name">{p.profile.name}</span>
                  {verdict && <span className="spk-row-score mono">{p.score}%</span>}
                  {verdict && (
                    <span className="spk-row-bar" aria-hidden="true">
                      <span className="spk-row-fill" style={{ width: `${p.score}%`, background: accent }} />
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Live region for screen readers */}
      <p className="sr-only" aria-live="polite">
        {verdict
          ? `${t({ en: 'Best fit', uk: 'Найкращий fit' })}: ${verdict.top.profile.name}, ${verdict.top.score}%. ${verdict.answered} ${t({ en: 'of', uk: 'з' })} ${QUESTIONS.length} ${t({ en: 'answered', uk: 'відповідей' })}.`
          : t({ en: 'No questions answered yet. Showing all styles.', uk: 'Ще нема відповідей. Показано всі стилі.' })}
      </p>
    </div>
  );
}
