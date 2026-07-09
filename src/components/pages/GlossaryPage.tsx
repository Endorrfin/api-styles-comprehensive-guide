import { useEffect, useRef, useState } from 'react';
import { glossary } from '../../data/glossary';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { hrefGlossary } from '../../lib/hashRouter';
import { cx } from '../../lib/utils';

// Accepts an optional `term` (deep-link from global search → #/glossary/<term>); scrolls that entry
// into view and highlights it briefly. The local filter box still works.
// CHANGED (s13b): seeAlso rendered as real #/glossary/<term> links (was plain text), A–Z jump row,
// and a live term count. Sorting/highlight behaviour unchanged.
export function GlossaryPage({ term }: { term?: string } = {}) {
  const { t, lang } = useLang();
  const [q, setQ] = useState('');
  const [highlight, setHighlight] = useState<string | undefined>(term);
  const refs = useRef<Map<string, HTMLElement>>(new Map());

  const needle = q.trim().toLowerCase();
  const entries = glossary
    .filter(
      (g) =>
        !needle ||
        g.term.toLowerCase().includes(needle) ||
        (g.def[lang] || g.def.en).toLowerCase().includes(needle),
    )
    .sort((a, b) => a.term.localeCompare(b.term));

  // CHANGED (s13b): first entry per initial letter (A–Z; anything else groups under '#').
  const letterOf = (s: string) => {
    const c = s[0]?.toUpperCase() ?? '#';
    return c >= 'A' && c <= 'Z' ? c : '#';
  };
  const firstByLetter = new Map<string, string>();
  for (const g of entries) {
    const l = letterOf(g.term);
    if (!firstByLetter.has(l)) firstByLetter.set(l, g.term);
  }

  const scrollToTerm = (name: string, center: boolean) => {
    const el = refs.current.get(name);
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: center ? 'center' : 'start' });
  };

  useEffect(() => {
    setHighlight(term);
    if (!term) return;
    scrollToTerm(term, true);
    const id = window.setTimeout(() => setHighlight(undefined), 2400);
    return () => window.clearTimeout(id);
  }, [term]);

  return (
    <div className="content">
      <h1>{t(ui.glossary)}</h1>
      <p className="muted">
        {t({
          en: 'Core terms, bilingual. Technical terms stay English; the explanation follows the language toggle.',
          uk: 'Базові терміни, двомовно. Технічні терміни лишаються англійською; пояснення йде за перемикачем мови.',
        })}{' '}
        <span className="dim">
          {glossary.length} {t({ en: 'terms', uk: 'термінів' })}
        </span>
      </p>
      <div className="searchbox glossary-search">
        <span className="search-ic" aria-hidden="true">
          ⌕
        </span>
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            if (highlight) setHighlight(undefined);
          }}
          placeholder={t(ui.searchPlaceholder)}
          aria-label={t(ui.search)}
        />
      </div>
      {!needle && firstByLetter.size > 1 && (
        <nav className="gloss-az" aria-label={t({ en: 'Jump to letter', uk: 'Перейти до літери' })}>
          {[...firstByLetter.entries()].map(([l, first]) => (
            <button
              key={l}
              type="button"
              className="gloss-az-btn mono"
              onClick={() => scrollToTerm(first, false)}
            >
              {l}
            </button>
          ))}
        </nav>
      )}
      <dl className="glossary">
        {entries.map((g) => (
          <div
            className={cx('gloss-entry', highlight === g.term && 'gloss-entry--on')}
            key={g.term}
            ref={(el) => {
              if (el) refs.current.set(g.term, el);
              else refs.current.delete(g.term);
            }}
          >
            <dt className="mono">{g.term}</dt>
            <dd>
              {g.def[lang] || g.def.en}
              {g.seeAlso && g.seeAlso.length > 0 && (
                <span className="gloss-see dim">
                  {' '}
                  →{' '}
                  {g.seeAlso.map((sa, i) => (
                    <span key={sa}>
                      {i > 0 && ', '}
                      <a className="gloss-see-link" href={hrefGlossary(sa)}>
                        {sa}
                      </a>
                    </span>
                  ))}
                </span>
              )}
            </dd>
          </div>
        ))}
        {entries.length === 0 && <p className="muted">{t(ui.searchNoResults)}</p>}
      </dl>
    </div>
  );
}
