import { useMemo, useState } from 'react';
import { getSection } from '../../data/meta'; // CHANGED (s10a): meta split — the landing hero must stay body-free
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { hrefModule } from '../../lib/hashRouter';
import { cx } from '../../lib/utils';
import { AXES, PRESETS, scoreStyles, selectionSize, selectionsEqual, type AxisId, type Selection } from '../../lib/compass';

/*
 * StyleCompassSim — the signature interactive for m2 and the landing hero (CLAUDE.md §6).
 * Thin renderer over the pure engine in lib/compass.ts: pick a target on any decision axis and the
 * styles re-rank live by fit. Each style card deep-links to its module, so the compass doubles as the
 * navigable "map" of the guide. No timers → SSR-safe and reduced-motion-safe by construction.
 */
export function StyleCompassSim() {
  const { t, lang } = useLang();
  // Seed with the first preset (a public web API → REST, the guide's baseline) so the compass opens
  // already ranked instead of on a flat "everything at 100%" state that reads as broken.
  const [sel, setSel] = useState<Selection>(PRESETS[0].sel);

  const ranked = useMemo(() => scoreStyles(sel), [sel]);
  const setCount = selectionSize(sel);
  const top = ranked[0];
  const activePreset = PRESETS.find((p) => selectionsEqual(p.sel, sel));

  const setAxis = (id: AxisId, v: number) =>
    setSel((s) => {
      const next = { ...s };
      if (next[id] === v) delete next[id]; // toggle off → back to "Any"
      else next[id] = v;
      return next;
    });
  const clearAxis = (id: AxisId) =>
    setSel((s) => {
      const next = { ...s };
      delete next[id];
      return next;
    });
  const reset = () => setSel({});
  const applyPreset = (p: (typeof PRESETS)[number]) => setSel({ ...p.sel });

  return (
    <div className="compass" role="group" aria-label={t({ en: 'API Style Compass', uk: 'API Style Compass' })}>
      {/* Scenario presets — translate a familiar boundary into axis settings */}
      <div className="compass-presets" role="group" aria-label={t({ en: 'Scenario presets', uk: 'Сценарії' })}>
        <span className="compass-presets-label dim">{t({ en: 'Try a scenario:', uk: 'Спробуй сценарій:' })}</span>
        {PRESETS.map((p) => {
          const on = activePreset?.id === p.id;
          return (
            <button
              key={p.id}
              type="button"
              className={cx('compass-preset', on && 'on')}
              aria-pressed={on}
              onClick={() => applyPreset(p)}
            >
              {t(p.label)}
            </button>
          );
        })}
      </div>

      {/* Decision axes */}
      <div className="compass-axes">
        {AXES.map((axis) => {
          const chosen = sel[axis.id];
          return (
            <div className="compass-axis" key={axis.id} role="group" aria-label={t(axis.label)}>
              <div className="compass-axis-head">
                <span className="compass-axis-name">{t(axis.label)}</span>
                <span className="compass-axis-q dim">{t(axis.question)}</span>
              </div>
              <div className="compass-axis-opts">
                {axis.options.map((opt) => {
                  const on = chosen === opt.v;
                  return (
                    <button
                      key={opt.v}
                      type="button"
                      className={cx('compass-opt', on && 'on')}
                      aria-pressed={on}
                      onClick={() => setAxis(axis.id, opt.v)}
                    >
                      {t(opt.label)}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className={cx('compass-opt', 'any', chosen === undefined && 'on')}
                  aria-pressed={chosen === undefined}
                  onClick={() => clearAxis(axis.id)}
                >
                  {t({ en: 'Any', uk: 'Будь-яка' })}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ranked styles */}
      <div className="compass-results">
        <div className="compass-results-head">
          <div className="compass-verdict">
            {setCount === 0 ? (
              <span className="dim">
                {t({
                  en: 'Set any axis to rank the styles by fit — or open one to read its module.',
                  uk: 'Задай будь-яку вісь, щоб проранжувати стилі за придатністю — або відкрий модуль стилю.',
                })}
              </span>
            ) : (
              <>
                <span className="dim">{t({ en: 'Best fit', uk: 'Найкращий fit' })}:</span>{' '}
                <strong style={{ color: getSection(top.profile.section)?.accent }}>{top.profile.name}</strong>{' '}
                <span className="compass-verdict-score mono">{top.score}%</span>
              </>
            )}
          </div>
          <button type="button" className="btn compass-reset" onClick={reset} disabled={setCount === 0}>
            {t(ui.reset)}
            {setCount > 0 && <span className="compass-reset-n"> · {setCount}</span>}
          </button>
        </div>

        <ol className="compass-styles">
          {ranked.map(({ profile, score }, i) => {
            const accent = getSection(profile.section)?.accent ?? 'var(--accent)';
            const lead = setCount > 0 && i === 0;
            return (
              <li key={profile.key}>
                <a
                  className={cx('compass-style', lead && 'lead')}
                  href={hrefModule(profile.moduleId)}
                  style={{ ['--sc' as string]: accent }}
                >
                  <span className="compass-style-top">
                    <span className="compass-style-name">
                      {lead && (
                        <span className="compass-crown" aria-hidden="true">
                          ★
                        </span>
                      )}
                      {profile.name}
                    </span>
                    {setCount > 0 && <span className="compass-style-score mono">{score}%</span>}
                  </span>
                  <span className="compass-style-blurb dim">{profile.blurb[lang] || profile.blurb.en}</span>
                  {setCount > 0 && (
                    <span className="compass-bar" aria-hidden="true">
                      <span className="compass-bar-fill" style={{ width: `${score}%`, background: accent }} />
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
        {setCount === 0
          ? t({ en: 'No axes set. Showing all styles.', uk: 'Осі не задано. Показано всі стилі.' })
          : `${t({ en: 'Best fit', uk: 'Найкращий fit' })}: ${top.profile.name}, ${top.score}%. ${setCount} ${t({ en: 'axes set', uk: 'осей задано' })}.`}
      </p>
    </div>
  );
}
