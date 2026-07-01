/*
 * graphql.ts — pure, deterministic engine for the `graphql-nplus1` signature sim (CLAUDE.md §6, m9).
 * No React, no DOM, no randomness — so scripts/test-graphql.ts can assert the plan exactly and the
 * component (GraphqlNplus1Sim) is a thin renderer over it.
 *
 * The model: a client asks for a list of posts and, for each post, its author's name:
 *     query { posts { title author { name } } }
 * The `posts` field runs one query; the nested `author` field runs a resolver PER post. How those
 * per-post resolvers hit the database is the whole lesson:
 *   - naive: each `author` resolver issues its own `SELECT … WHERE id = ?` → 1 (list) + N = N+1 queries.
 *   - DataLoader: the author loads requested within one event-loop tick are BATCHED and DE-DUPLICATED
 *     into a single `SELECT … WHERE id IN (…)` → 1 (list) + 1 = 2 queries, whatever N is.
 * Refs: resolvers fan out per field (https://graphql.org/learn/execution/); DataLoader coalesces loads
 * within one tick and caches per request (https://github.com/graphql/dataloader).
 */

export interface Author {
  id: number;
  name: string;
}
export interface Post {
  id: number;
  title: string;
  authorId: number;
}

// A tiny fixed cast of authors. Posts cycle through them, so once N > AUTHORS.length some authors
// repeat — which is exactly where DataLoader's de-duplication becomes visible (naive re-queries the
// same id; the batch asks for each distinct id once).
export const AUTHORS: Author[] = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Linus' },
  { id: 3, name: 'Grace' },
];

/** Post-count presets the UI offers (kept small so the query log stays legible). */
export const POST_CHOICES: number[] = [3, 5, 8];
export const DEFAULT_POSTS = 5;

/** Author name for an id (UI helper; total — falls back to `#id` for an unknown id). */
export function authorName(id: number): string {
  return AUTHORS.find((a) => a.id === id)?.name ?? `#${id}`;
}

/** Deterministic dataset: post i (1-based) is written by author ((i-1) mod AUTHORS.length)+1. */
export function buildPosts(n: number): Post[] {
  const count = Math.max(0, Math.floor(n));
  const posts: Post[] = [];
  for (let i = 0; i < count; i++) {
    const author = AUTHORS[i % AUTHORS.length];
    posts.push({ id: i + 1, title: `Post ${i + 1}`, authorId: author.id });
  }
  return posts;
}

export type QueryKind = 'list' | 'per-item' | 'batch';

export interface DbQuery {
  /** clock step this query fires on (1-based; the `posts` list is always step 1) */
  step: number;
  kind: QueryKind;
  table: 'posts' | 'users';
  /** SQL shown to the reader */
  sql: string;
  /** author ids this query resolves ([] for the list query) */
  keys: number[];
  /** for a per-item query, the post (1-based) whose author it loads; 0 otherwise */
  forPost: number;
}

export interface Plan {
  batched: boolean;
  posts: Post[];
  /** the queries this strategy issues, in fire order */
  queries: DbQuery[];
  /** total DB queries this strategy issues (= queries.length) */
  totalQueries: number;
  /** distinct author ids among the posts — what a batch de-duplicates to */
  distinctAuthors: number;
  /** last step to play through (= queries' max step) */
  totalSteps: number;
  /** both counterfactuals, so the comparison bar can show them regardless of the toggle */
  naiveQueries: number; // 1 (list) + N
  batchedQueries: number; // N === 0 ? 1 : 2 (list + one batch)
}

const distinctSorted = (xs: number[]): number[] => [...new Set(xs)].sort((a, b) => a - b);

export interface PlanOptions {
  posts: number;
  batched: boolean;
}

/** Build the query plan for one strategy over N posts. Deterministic & total. */
export function plan(opts: PlanOptions): Plan {
  const posts = buildPosts(opts.posts);
  const n = posts.length;
  const authorIds = posts.map((p) => p.authorId);
  const distinct = distinctSorted(authorIds);

  const listQuery: DbQuery = {
    step: 1,
    kind: 'list',
    table: 'posts',
    sql: `SELECT id, title, author_id FROM posts LIMIT ${n}`,
    keys: [],
    forPost: 0,
  };

  const queries: DbQuery[] = [listQuery];

  if (opts.batched) {
    // DataLoader: every author load in this tick collapses into one de-duplicated IN query.
    if (n > 0) {
      queries.push({
        step: 2,
        kind: 'batch',
        table: 'users',
        sql: `SELECT * FROM users WHERE id IN (${distinct.join(', ')})`,
        keys: distinct,
        forPost: 0,
      });
    }
  } else {
    // Naive: one author query per post, in post order, each its own round trip.
    posts.forEach((p, i) => {
      queries.push({
        step: 2 + i,
        kind: 'per-item',
        table: 'users',
        sql: `SELECT * FROM users WHERE id = ${p.authorId}`,
        keys: [p.authorId],
        forPost: p.id,
      });
    });
  }

  const naiveQueries = 1 + n;
  const batchedQueries = n === 0 ? 1 : 2;

  return {
    batched: opts.batched,
    posts,
    queries,
    totalQueries: queries.length,
    distinctAuthors: distinct.length,
    totalSteps: queries.reduce((max, q) => Math.max(max, q.step), 1),
    naiveQueries,
    batchedQueries,
  };
}
