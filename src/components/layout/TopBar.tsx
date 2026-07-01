import { useEffect, useRef, useState } from 'react';
import { LEVELS } from '../../data/concepts';
import type { Level } from '../../data/types';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { useAppState } from '../../lib/appState';
import type { LevelFilter, ThemeMode } from '../../lib/appState';
import { hrefMap, navigate } from '../../lib/hashRouter';
import { search, type SearchResult } from '../../lib/search';
import { cx } from '../../lib/utils';

const KIND_LABEL = {
  module: ui.searchKindModule,
  topic: ui.searchKindTopic,
  glossary: ui.searchKindGlossary,
} as const;

export function TopBar() {
  const { t, lang, setLang } = useLang();
  const { levelFilter, setLevelFilter, themeMode, setThemeMode, toggleSidebar } = useAppState();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const results: SearchResult[] = q.trim() ? search(q, lang, 10) : [];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => setActive(0), [q]);

  const go = (href: string) => {
    navigate(href);
    setQ('');
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[active].href);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-btn sidebar-toggle" aria-label="Menu" onClick={toggleSidebar}>
          ☰
        </button>
        <a className="brand" href={hrefMap()} aria-label={`${t(ui.brandTitle)} — ${t(ui.brandSubtitle)}`}>
          <span className="brand-mark" aria-hidden="true">
            {'{ }'}
          </span>
          <span className="brand-text">
            <strong>{t(ui.brandTitle)}</strong>
            <span className="brand-sub">{t(ui.brandSubtitle)}</span>
          </span>
        </a>
      </div>

      <div className="topbar-search" ref={boxRef}>
        <div className="searchbox">
          <span className="search-ic" aria-hidden="true">
            ⌕
          </span>
          <input
            type="search"
            value={q}
            placeholder={t(ui.searchPlaceholder)}
            aria-label={t(ui.search)}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
          />
        </div>
        {open && q.trim() && (
          <div className="search-results" role="listbox">
            {results.length === 0 ? (
              <div className="search-empty muted">{t(ui.searchNoResults)}</div>
            ) : (
              results.map((r, i) => (
                <button
                  key={r.href}
                  role="option"
                  aria-selected={i === active}
                  className={cx('search-hit', i === active && 'search-hit--active')}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(r.href)}
                >
                  <span className="search-hit-main">
                    <span className="search-hit-title">{r.title}</span>
                    <span className="search-hit-ctx dim">{r.context}</span>
                  </span>
                  <span className={`search-kind search-kind--${r.kind}`}>{t(KIND_LABEL[r.kind])}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="topbar-right">
        <label className="ctl">
          <span className="ctl-label">{t(ui.levelFilter)}</span>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as LevelFilter)}
            aria-label={t(ui.levelFilter)}
          >
            <option value="all">{t(ui.allLevels)}</option>
            {LEVELS.map((lv: Level) => (
              <option key={lv} value={lv}>
                {t(ui[lv])}
              </option>
            ))}
          </select>
        </label>

        <div className="seg" role="group" aria-label={t(ui.language)}>
          <button className={cx('seg-btn', lang === 'en' && 'seg-on')} onClick={() => setLang('en')} aria-pressed={lang === 'en'}>
            EN
          </button>
          <button className={cx('seg-btn', lang === 'uk' && 'seg-on')} onClick={() => setLang('uk')} aria-pressed={lang === 'uk'}>
            UA
          </button>
        </div>

        <select
          className="theme-select"
          value={themeMode}
          onChange={(e) => setThemeMode(e.target.value as ThemeMode)}
          aria-label={t(ui.theme)}
        >
          <option value="system">{t(ui.themeSystem)}</option>
          <option value="dark">{t(ui.themeDark)}</option>
          <option value="light">{t(ui.themeLight)}</option>
        </select>
      </div>
    </header>
  );
}
