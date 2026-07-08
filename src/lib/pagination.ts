/*
 * pagination.ts — pure, deterministic engine for the `pagination-compare` interactive (m20,
 * CURRICULUM §F optional promotion — promoted to a sim per PROJECT-BRIEF §10: the offset-drift
 * insight has to be FELT, not read). No React, no DOM, no randomness — scripts/test-pagination.ts
 * asserts every page of every scenario exactly; the component is a thin renderer.
 *
 * The model: a newest-first feed (ids 1..20; higher id = newer) read three pages deep by two client
 * strategies while the dataset mutates BETWEEN fetches — the situation every production feed lives in:
 *   - 'stable'  — nothing changes: offset and cursor return identical pages (the honeymoon);
 *   - 'inserts' — 3 new items land on top after page 1: offset re-serves rows that slid down
 *                 (duplicates); cursor continues after the last-seen id, unaffected;
 *   - 'deletes' — 2 already-seen items are removed after page 1: rows slide UP past the offset
 *                 window and are NEVER returned (silent misses); cursor stays exact.
 * Rules baked in by construction (guarded by the golden test):
 *   - offset evaluates `slice(offset, offset+limit)` against the feed AS IT IS at fetch time —
 *     the page boundary is positional, so any write above it shifts the window's content;
 *   - cursor evaluates `first `limit` items with id < after` — the boundary is a VALUE pinned to
 *     data the client has already consumed, so writes above it cannot move the resume point
 *     (keyset semantics: WHERE id < :after ORDER BY id DESC LIMIT :n);
 *   - deleted items never re-appear; missed = items alive at walk start that a full walk never saw.
 * Refs: Stripe cursor pagination (https://docs.stripe.com/api/pagination — starting_after);
 * keyset/seek method (https://use-the-index-luke.com/no-offset).
 */

export type Strategy = 'offset' | 'cursor';
export const STRATEGIES: readonly Strategy[] = ['offset', 'cursor'] as const;

export type Scenario = 'stable' | 'inserts' | 'deletes';
export const SCENARIOS: readonly Scenario[] = ['stable', 'inserts', 'deletes'] as const;

/** Items per page and pages walked — small enough to eyeball, deep enough to drift. */
export const PAGE_SIZE = 5;
export const PAGES = 3;

/** The feed at walk start: ids 20..1, newest first. */
export const INITIAL_TOP_ID = 20;

/** What the scenario does to the feed after page 1 (the only mutation beat — deterministic). */
export interface Mutation {
  kind: 'none' | 'insert' | 'delete';
  /** inserted ids (new, on top) or deleted ids (already seen by page 1). */
  ids: number[];
  /** 1-based page after which the mutation happens. */
  afterPage: number;
}

export interface Page {
  /** 1-based page number. */
  n: number;
  /** the wire-shaped request line the strategy sends for this page. */
  request: string;
  /** ids returned, feed order (descending). */
  ids: number[];
  /** ids in this page the client had ALREADY received — the offset re-serve artifact. */
  duplicates: number[];
}

export interface RunResult {
  strategy: Strategy;
  scenario: Scenario;
  mutation: Mutation;
  pages: Page[];
  /** all duplicate ids across the walk (offset + inserts). */
  duplicates: number[];
  /** items alive at walk start that slid past the window unseen (offset + deletes). */
  missed: number[];
  /** unique ids the client ended the walk with. */
  seen: number[];
}

const freshFeed = (): number[] => Array.from({ length: INITIAL_TOP_ID }, (_, i) => INITIAL_TOP_ID - i);

export function mutationFor(s: Scenario): Mutation {
  if (s === 'inserts') return { kind: 'insert', ids: [23, 22, 21], afterPage: 1 };
  if (s === 'deletes') return { kind: 'delete', ids: [18, 17], afterPage: 1 };
  return { kind: 'none', ids: [], afterPage: 1 };
}

const applyMutation = (feed: number[], m: Mutation): number[] => {
  if (m.kind === 'insert') return [...m.ids, ...feed];
  if (m.kind === 'delete') return feed.filter((id) => !m.ids.includes(id));
  return feed;
};

/** Walk PAGES pages with one strategy through one scenario. Deterministic by construction. */
export function run(strategy: Strategy, scenario: Scenario): RunResult {
  const mutation = mutationFor(scenario);
  let feed = freshFeed();
  const seen = new Set<number>();
  const pages: Page[] = [];
  let cursor: number | null = null; // last id of the previous page (cursor strategy)

  for (let n = 1; n <= PAGES; n++) {
    if (n === mutation.afterPage + 1) feed = applyMutation(feed, mutation);

    let ids: number[];
    let request: string;
    if (strategy === 'offset') {
      const offset = (n - 1) * PAGE_SIZE;
      request = `GET /feed?limit=${PAGE_SIZE}&offset=${offset}`;
      ids = feed.slice(offset, offset + PAGE_SIZE);
    } else {
      request = cursor === null ? `GET /feed?limit=${PAGE_SIZE}` : `GET /feed?limit=${PAGE_SIZE}&after=${cursor}`;
      const from = cursor;
      ids = feed.filter((id) => from === null || id < from).slice(0, PAGE_SIZE);
      cursor = ids.length > 0 ? ids[ids.length - 1] : cursor;
    }

    const duplicates = ids.filter((id) => seen.has(id));
    ids.forEach((id) => seen.add(id));
    pages.push({ n, request, ids, duplicates });
  }

  // Missed = rows the walk stepped PAST without ever returning: alive (not deleted) items newer than
  // the deepest row reached, never seen. Paging onward will never revisit them — silent data loss.
  // (A page-4 fetch picks up rows BELOW the floor, so ending shallower is lag, not loss.)
  const floor = Math.min(...seen);
  const missed = freshFeed().filter(
    (id) => id > floor && !seen.has(id) && !(mutation.kind === 'delete' && mutation.ids.includes(id)),
  );

  return {
    strategy,
    scenario,
    mutation,
    pages,
    duplicates: pages.flatMap((p) => p.duplicates),
    missed,
    seen: [...seen].sort((a, b) => b - a),
  };
}

/** Both strategies through the same scenario — the side-by-side the sim renders. */
export function compare(scenario: Scenario): { offset: RunResult; cursor: RunResult } {
  return { offset: run('offset', scenario), cursor: run('cursor', scenario) };
}
