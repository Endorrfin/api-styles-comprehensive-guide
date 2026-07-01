/*
 * rest.ts — pure, deterministic engine for the `rest-request-lifecycle` signature sim (CLAUDE.md §6).
 * No React, no DOM, no randomness — so scripts/test-rest.ts can assert it exactly and the component is
 * a thin renderer over it. Models a GET moving through the REST cache/conditional-request pipeline
 * (RFC 9110/9111) plus the Richardson Maturity ladder.
 */

export type StepId = 'request' | 'cache' | 'revalidate' | 'origin' | 'response';

export type StepOutcome =
  | 'sent' // request: sent by client
  | 'miss' // cache: no entry
  | 'fresh' // cache: hit, still fresh → serve
  | 'stale' // cache: hit, past max-age → revalidate/refetch
  | 'conditional' // revalidate: If-None-Match sent
  | 'compared-same' // origin: ETag matched
  | 'compared-diff' // origin: ETag differs
  | 'handled' // origin: produced a fresh representation
  | 'from-cache' // response: served from cache (200)
  | 'not-modified' // response: 304
  | 'ok-full'; // response: 200 with body

export interface LifecycleOptions {
  /** A cached copy of the resource exists on the client/CDN. */
  warmCache: boolean;
  /** The cached copy is past its max-age (only meaningful when warmCache). */
  expired: boolean;
  /** Responses carry an ETag, enabling conditional revalidation. */
  useEtag: boolean;
  /** The origin resource changed since the cached ETag (only meaningful on revalidate). */
  resourceChanged: boolean;
}

export interface LifecycleStep {
  id: StepId;
  outcome: StepOutcome;
}

export type Transfer = 'full' | 'validator-only' | 'served-from-cache';

export interface LifecycleResult {
  steps: LifecycleStep[];
  /** Final HTTP status the client observes. */
  status: number;
  transfer: Transfer;
  /** Whether the request reached the origin server at all. */
  reachedOrigin: boolean;
}

/** Plan the full lifecycle for a GET under the given cache/ETag conditions. Deterministic. */
export function planLifecycle(o: LifecycleOptions): LifecycleResult {
  const steps: LifecycleStep[] = [{ id: 'request', outcome: 'sent' }];

  // Cold cache → straight to origin.
  if (!o.warmCache) {
    steps.push({ id: 'cache', outcome: 'miss' });
    steps.push({ id: 'origin', outcome: 'handled' });
    steps.push({ id: 'response', outcome: 'ok-full' });
    return { steps, status: 200, transfer: 'full', reachedOrigin: true };
  }

  // Warm + fresh → served from cache, origin never touched (the fastest path).
  if (!o.expired) {
    steps.push({ id: 'cache', outcome: 'fresh' });
    steps.push({ id: 'response', outcome: 'from-cache' });
    return { steps, status: 200, transfer: 'served-from-cache', reachedOrigin: false };
  }

  // Warm + stale → must revalidate or refetch.
  steps.push({ id: 'cache', outcome: 'stale' });

  if (o.useEtag) {
    steps.push({ id: 'revalidate', outcome: 'conditional' });
    if (o.resourceChanged) {
      steps.push({ id: 'origin', outcome: 'compared-diff' });
      steps.push({ id: 'response', outcome: 'ok-full' });
      return { steps, status: 200, transfer: 'full', reachedOrigin: true };
    }
    steps.push({ id: 'origin', outcome: 'compared-same' });
    steps.push({ id: 'response', outcome: 'not-modified' });
    return { steps, status: 304, transfer: 'validator-only', reachedOrigin: true };
  }

  // Stale, no validator → full refetch.
  steps.push({ id: 'origin', outcome: 'handled' });
  steps.push({ id: 'response', outcome: 'ok-full' });
  return { steps, status: 200, transfer: 'full', reachedOrigin: true };
}

/** Approximate relative bytes-on-the-wire for the three transfer outcomes (for the UI meter). */
export function transferCost(t: Transfer): number {
  switch (t) {
    case 'full':
      return 100;
    case 'validator-only':
      return 4; // 304 headers only
    case 'served-from-cache':
      return 0; // no origin round-trip
  }
}

export interface MaturityShape {
  level: number;
  verb: string;
  url: string;
  resources: boolean;
  verbs: boolean;
  hypermedia: boolean;
}

/** The Richardson Maturity Model rungs (0–3) as concrete request shapes. */
export function maturityShape(level: number): MaturityShape {
  switch (level) {
    case 0:
      return { level: 0, verb: 'POST', url: '/api', resources: false, verbs: false, hypermedia: false };
    case 1:
      return { level: 1, verb: 'POST', url: '/articles/42', resources: true, verbs: false, hypermedia: false };
    case 2:
      return { level: 2, verb: 'GET', url: '/articles/42', resources: true, verbs: true, hypermedia: false };
    default:
      return { level: 3, verb: 'GET', url: '/articles/42', resources: true, verbs: true, hypermedia: true };
  }
}
