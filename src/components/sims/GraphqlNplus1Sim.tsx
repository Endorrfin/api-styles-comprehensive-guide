import { useEffect, useMemo, useState } from 'react';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { clamp, cx } from '../../lib/utils';
import { DEFAULT_POSTS, POST_CHOICES, authorName, plan } from '../../lib/graphql';

/*
 * GraphqlNplus1Sim — the signature interactive for m9 (CLAUDE.md §6). Thin renderer over the pure engine
 * in lib/graphql.ts: pick how many posts the query returns, toggle DataLoader, and step the clock to
 * watch the database queries fire. Naive resolvers fan out to one author query PER post (N+1); DataLoader
 * batches every author load in the tick into one de-duplicated `WHERE id IN (…)` (2 total). Deterministic
 * engine → SSR-safe: at the first step the query + list row render with no timers.
 */

const TICK_MS = 720;
const START_STEP = 1; // the posts list query is always visible; play reveals the author queries.

function Toggle({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" className={cx('nq-toggle', on && 'on')} aria-pressed={on} onClick={onClick}>
      <span className="nq-toggle-dot" aria-hidden="true" />
      {label}
    </button>
  );
}

const KIND_LABEL = {
  list: { en: 'list', uk: 'список' },
  'per-item': { en: 'per-post', uk: 'на пост' },
  batch: { en: 'batch', uk: 'batch' },
} as const;

export function GraphqlNplus1Sim() {
  const { t } = useLang();
  const [posts, setPosts] = useState<number>(DEFAULT_POSTS);
  const [batched, setBatched] = useState(false);
  const [step, setStep] = useState(START_STEP);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);

  const result = useMemo(() => plan({ posts, batched }), [posts, batched]);
  const maxStep = Math.max(START_STEP, result.totalSteps);
  const atEnd = step >= maxStep;

  useEffect(() => {
    const mq = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (mq) setReduced(mq.matches);
  }, []);

  // Reset the clock whenever the scenario changes (reduced motion jumps straight to the finished state).
  useEffect(() => {
    setStep(reduced ? maxStep : START_STEP);
    setPlaying(false);
  }, [posts, batched, reduced, maxStep]);

  // Auto-advance one step at a time while playing (skipped under reduced motion).
  useEffect(() => {
    if (!playing || reduced) return;
    if (step >= maxStep) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => setStep((n) => Math.min(n + 1, maxStep)), TICK_MS);
    return () => window.clearTimeout(id);
  }, [playing, step, maxStep, reduced]);

  const play = () => {
    if (atEnd) setStep(START_STEP);
    setPlaying(true);
  };
  const stepFwd = () => {
    setPlaying(false);
    setStep((n) => Math.min(n + 1, maxStep));
  };
  const reset = () => {
    setPlaying(false);
    setStep(START_STEP);
  };

  const revealed = result.queries.filter((q) => q.step <= step);
  const dbCount = revealed.length;
  const denom = Math.max(result.naiveQueries, 1);
  const naivePct = 100;
  const batchedPct = (result.batchedQueries / denom) * 100;
  const livePct = (dbCount / denom) * 100;

  return (
    <div className="nq" role="group" aria-label={t({ en: 'GraphQL N+1 and DataLoader batching simulator', uk: 'Симулятор GraphQL N+1 і DataLoader batching' })}>
      {/* The query both strategies run */}
      <pre className="nq-query mono" aria-hidden="true">
        <span className="nq-kw">query</span> {'{'}
        {'\n'}  posts {'{'} <span className="nq-dim">title</span>
        {'\n'}    author {'{'} <span className="nq-dim">name</span> {'}'} <span className="nq-cmt"># resolved per post</span>
        {'\n'}  {'}'}
        {'\n'}
        {'}'}
      </pre>

      {/* Controls */}
      <div className="nq-controls">
        <div className="nq-posts" role="group" aria-label={t({ en: 'Posts returned', uk: 'Постів повернуто' })}>
          <span className="dim nq-posts-label">{t({ en: 'Posts', uk: 'Постів' })}</span>
          {POST_CHOICES.map((p) => (
            <button key={p} type="button" className={cx('nq-post', posts === p && 'on')} aria-pressed={posts === p} onClick={() => setPosts(p)}>
              {p}
            </button>
          ))}
        </div>
        <Toggle on={batched} label={t({ en: 'DataLoader', uk: 'DataLoader' })} onClick={() => setBatched((v) => !v)} />
      </div>

      {/* The database query log — grows as the clock steps */}
      <div className="nq-log" aria-hidden="true">
        <div className="nq-log-head">
          <span className="nq-db mono">DB</span>
          <span className="dim">{t({ en: 'queries issued', uk: 'запитів надіслано' })}</span>
          <span className="nq-count mono">{dbCount}</span>
        </div>
        {revealed.map((q, i) => (
          <div className={cx('nq-row', q.kind)} key={`${q.step}-${i}`}>
            <span className="nq-row-step mono">{i + 1}</span>
            <span className={cx('nq-kind', q.kind)}>{t(KIND_LABEL[q.kind])}</span>
            <code className="nq-sql mono">{q.sql}</code>
            {q.kind === 'per-item' && <span className="nq-for dim mono">→ {authorName(q.keys[0])}</span>}
            {q.kind === 'batch' && (
              <span className="nq-for dim mono">
                {result.posts.length} → {q.keys.length} {t({ en: 'distinct', uk: 'унікальних' })}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Verdict line */}
      <p className="nq-verdict">
        {batched
          ? t({
              en: `DataLoader coalesces ${result.posts.length} author loads into 1 batched query — ${result.totalQueries} total, whatever N is.`,
              uk: `DataLoader склеює ${result.posts.length} завантажень author в 1 batched-запит — ${result.totalQueries} усього, хай яке N.`,
            })
          : t({
              en: `Each post triggers its own author query: 1 + ${result.posts.length} = ${result.totalQueries}. That is the N+1 problem.`,
              uk: `Кожен пост запускає власний запит author: 1 + ${result.posts.length} = ${result.totalQueries}. Це і є проблема N+1.`,
            })}
      </p>

      {/* Query-count comparison */}
      <div className="nq-size">
        <div className="nq-size-row">
          <span className="nq-size-tag mono">Naive</span>
          <span className="nq-bar">
            <span className="nq-bar-fill" style={{ width: `${naivePct}%`, background: 'var(--c-danger)' }} />
          </span>
          <span className="mono nq-size-n">{result.naiveQueries}</span>
        </div>
        <div className="nq-size-row">
          <span className="nq-size-tag mono">DataLoader</span>
          <span className="nq-bar">
            <span className="nq-bar-fill" style={{ width: `${batchedPct}%`, background: 'var(--accent-2)' }} />
          </span>
          <span className="mono nq-size-n">{result.batchedQueries}</span>
        </div>
        <div className="nq-size-foot">
          <span className="dim">
            {t({ en: 'Live', uk: 'Наживо' })}:{' '}
            <span className="mono" style={{ color: batched ? 'var(--accent-2)' : 'var(--c-danger)' }}>
              {dbCount} {t({ en: 'queries', uk: 'запитів' })}
            </span>
            {' · '}
            {result.distinctAuthors} {t({ en: 'distinct authors', uk: 'унікальних авторів' })}
          </span>
          <span className="nq-live-bar" aria-hidden="true">
            <span className="nq-live-fill" style={{ width: `${clamp(livePct, 0, 100)}%`, background: batched ? 'var(--accent-2)' : 'var(--c-danger)' }} />
          </span>
        </div>
      </div>

      {/* Transport */}
      <div className="nq-controls-row">
        <button type="button" className="btn" onClick={playing ? () => setPlaying(false) : play}>
          {playing ? t(ui.pause) : t(ui.play)}
        </button>
        <button type="button" className="btn" onClick={stepFwd} disabled={atEnd}>
          {t(ui.step)} →
        </button>
        <button type="button" className="btn" onClick={reset} disabled={step === START_STEP && !playing}>
          {t(ui.reset)}
        </button>
        <span className="dim nq-progress mono">
          q{dbCount}/{result.totalQueries}
        </span>
      </div>

      {/* Live region for screen readers */}
      <p className="sr-only" aria-live="polite">
        {batched ? 'DataLoader' : t({ en: 'Naive', uk: 'Наївно' })}, {result.posts.length} {t({ en: 'posts', uk: 'постів' })}.{' '}
        {dbCount} {t({ en: 'of', uk: 'з' })} {result.totalQueries} {t({ en: 'database queries issued', uk: 'запитів до БД надіслано' })}.{' '}
        {t({ en: 'Naive would run', uk: 'Наївно виконало б' })} {result.naiveQueries}, DataLoader {result.batchedQueries}.
      </p>
    </div>
  );
}
