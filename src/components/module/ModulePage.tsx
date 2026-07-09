// CHANGED (s13b): topic copy-links (an anchor on every h2 that copies the deep link).
// CHANGED (s13b): per-section body split — the header/TOC render synchronously from meta.ts;
// the body arrives via data/bodies.ts (one lazy chunk per section instead of one ~1 MB chunk).
import { useEffect, useRef, useState } from 'react';
import { adjacentModules, getModule, getSection } from '../../data/meta';
import { getLoadedModule, loadModule } from '../../data/bodies';
import type { Module } from '../../data/types';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { useAppState } from '../../lib/appState';
import { hrefModule } from '../../lib/hashRouter';
import { BlockView } from './blocks';
import { ComingSoon } from '../pages/ComingSoon';
import { LevelBadge } from './LevelBadge';

export function ModulePage({ moduleId, topicId }: { moduleId: string; topicId?: string }) {
  const { t, lang } = useLang();
  const { isKnown, toggleKnown } = useAppState();
  const mod = getModule(moduleId);

  // CHANGED (s13b): body loading — synchronous when the section chunk is already cached.
  // QA (s13b): body derives from the cache at render (no one-frame stale body on module→module
  // navigation), and a failed chunk load renders a retry state instead of loading forever.
  const [bodyState, setBodyState] = useState<Module | undefined>(() => getLoadedModule(moduleId));
  const [loadFailed, setLoadFailed] = useState(false);
  const body =
    bodyState && bodyState.id === moduleId ? bodyState : getLoadedModule(moduleId);
  useEffect(() => {
    setLoadFailed(false);
    if (getLoadedModule(moduleId)) {
      setBodyState(getLoadedModule(moduleId));
      return;
    }
    let alive = true;
    loadModule(moduleId)
      .then((m) => {
        if (alive) setBodyState(m);
      })
      .catch(() => {
        if (alive) setLoadFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [moduleId]);
  const retryLoad = () => {
    setLoadFailed(false);
    loadModule(moduleId)
      .then((m) => setBodyState(m))
      .catch(() => setLoadFailed(true));
  };

  // CHANGED (s13b): copy-link feedback state (which topic just got copied).
  const [copiedTopic, setCopiedTopic] = useState<string | null>(null);
  const copyTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(copyTimer.current), []);
  const copyTopicLink = async (tpId: string) => {
    try {
      const url = window.location.href.split('#')[0] + hrefModule(moduleId, tpId);
      await navigator.clipboard.writeText(url);
      setCopiedTopic(tpId);
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopiedTopic(null), 1800);
    } catch {
      /* clipboard unavailable — the anchor still navigates, which is the fallback */
    }
  };

  // CHANGED (s13b): `body` joins the deps — a deep link can only scroll once the topic exists.
  // QA (s13b): respect prefers-reduced-motion (same gate GlossaryPage uses).
  useEffect(() => {
    if (topicId) {
      const el = document.getElementById(`topic-${topicId}`);
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [moduleId, topicId, body]);

  if (!mod) {
    return (
      <div className="content">
        <p className="muted">Module not found.</p>
        <a className="btn" href={hrefModule('m5-rest')}>
          Go to the REST module
        </a>
      </div>
    );
  }

  const section = getSection(mod.section);
  const { prev, next } = adjacentModules(mod.id);
  const known = isKnown(mod.id);
  const authored = mod.authored;

  return (
    <article className="content module">
      <header className="module-header">
        <div className="module-kicker">
          {section && (
            <span style={{ color: section.accent }}>
              {section.roman} · {t(section.title)}
            </span>
          )}
        </div>
        <h1>
          <span className="module-num mono">{String(mod.num).padStart(2, '0')}</span>
          {t(mod.title)}
        </h1>
        <div className="module-meta">
          <LevelBadge level={mod.level} />
          {mod.signature && <span className="chip star">★ interactive</span>}
          <span className="chip">
            {mod.readMins} {t(ui.readMins)}
          </span>
          <button
            className={known ? 'chip known-on' : 'chip'}
            onClick={() => toggleKnown(mod.id)}
            aria-pressed={known}
          >
            {known ? `✓ ${t(ui.known)}` : t(ui.markKnown)}
          </button>
        </div>
        <p className="module-tagline">{t(mod.tagline)}</p>
        <div className="module-mm">
          <span className="module-mm-label">{t(ui.mentalModelLabel)}</span>
          <p>{t(mod.mentalModel)}</p>
        </div>
      </header>

      {!authored ? (
        <ComingSoon />
      ) : (
        <>
          {mod.topics.length > 0 && (
            <nav className="toc" aria-label={t(ui.onThisPage)}>
              <span className="toc-title">{t(ui.onThisPage)}</span>
              <ol>
                {mod.topics.map((tp) => (
                  <li key={tp.id}>
                    <a href={hrefModule(mod.id, tp.id)}>{t(tp.title)}</a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {!body ? (
            loadFailed ? (
              <div className="placeholder">
                <p>
                  {t({
                    en: 'The module content failed to load (network hiccup or a fresh deploy).',
                    uk: 'Не вдалося завантажити вміст модуля (збій мережі або свіжий деплой).',
                  })}
                </p>
                <button className="btn" onClick={retryLoad}>
                  {t({ en: 'Try again', uk: 'Спробувати ще раз' })}
                </button>
              </div>
            ) : (
              <div className="placeholder">
                {t({ en: 'Loading module…', uk: 'Завантаження модуля…' })}
              </div>
            )
          ) : (
            <>
              {body.topics.map((tp) => (
                <section className="topic" id={`topic-${tp.id}`} key={tp.id}>
                  {/* CHANGED (s13b): copy-link anchor — navigates to the topic AND copies the deep URL. */}
                  <h2 className="topic-h">
                    {t(tp.title)}
                    <a
                      className={copiedTopic === tp.id ? 'topic-link topic-link--ok' : 'topic-link'}
                      href={hrefModule(mod.id, tp.id)}
                      aria-label={t(ui.copyLink)}
                      title={t(ui.copyLink)}
                      onClick={() => void copyTopicLink(tp.id)}
                    >
                      {/* QA (s13b): live region so screen readers hear the copy confirmation. */}
                      <span aria-live="polite">{copiedTopic === tp.id ? '✓' : '#'}</span>
                    </a>
                  </h2>
                  {tp.blocks.map((b, i) => (
                    <BlockView key={i} block={b} />
                  ))}
                </section>
              ))}

              {body.keyPoints.length > 0 && (
                <section className="endcap keypoints">
                  <h2>{t(ui.keyPoints)}</h2>
                  <ul>
                    {body.keyPoints.map((kp, i) => (
                      <li key={i}>{t(kp)}</li>
                    ))}
                  </ul>
                </section>
              )}

              {body.pitfalls.length > 0 && (
                <section className="endcap pitfalls">
                  <h2>{t(ui.pitfalls)}</h2>
                  <div className="pitfall-grid">
                    {body.pitfalls.map((p, i) => (
                      <div className="pitfall" key={i}>
                        <strong>{t(p.title)}</strong>
                        <p className="muted">{t(p.body)}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {body.interview && body.interview.length > 0 && (
                <section className="endcap interview">
                  <h2>{t(ui.interview)}</h2>
                  {body.interview.map((qa, i) => (
                    <details className="qa" key={i}>
                      <summary>
                        {qa.level && <span className="chip badge-level" data-level={qa.level} />}
                        {t(qa.q)}
                      </summary>
                      <p>{t(qa.a)}</p>
                    </details>
                  ))}
                </section>
              )}

              {body.sources.length > 0 && (
                <section className="endcap sources">
                  <h2>{t(ui.sources)}</h2>
                  <ul>
                    {body.sources.map((s, i) => (
                      <li key={i}>
                        <a href={s.url} target="_blank" rel="noopener noreferrer">
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {body.seeAlso.length > 0 && (
                <section className="endcap seealso">
                  <h2>{t(ui.seeAlso)}</h2>
                  <div className="seealso-row">
                    {body.seeAlso.map((id) => {
                      const m = getModule(id);
                      if (!m) return null;
                      return (
                        <a className="seealso-card" href={hrefModule(id)} key={id}>
                          <span className="mono dim">{String(m.num).padStart(2, '0')}</span>
                          <span>{m.title[lang] || m.title.en}</span>
                        </a>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}

      <nav className="prevnext" aria-label="Module navigation">
        {prev ? (
          <a className="pn pn-prev" href={hrefModule(prev.id)}>
            <span className="dim">← {t(ui.prevModule)}</span>
            <span>{t(prev.title)}</span>
          </a>
        ) : (
          <span />
        )}
        {next ? (
          <a className="pn pn-next" href={hrefModule(next.id)}>
            <span className="dim">{t(ui.nextModule)} →</span>
            <span>{t(next.title)}</span>
          </a>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
