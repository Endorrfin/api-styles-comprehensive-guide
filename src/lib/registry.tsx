// Registry — content references figures and sims by KEY (CLAUDE.md §4), resolved here.
// Each sim/figure is React.lazy so Vite emits a per-component chunk; blocks.tsx wraps renders in
// <Suspense>. check:data validates that every key used in the data resolves here; smoke asserts the
// component-file count equals the key count (no orphan components, no dangling keys).
import { lazy, type ComponentType } from 'react';

// Adapt a named-export lazy import to the { default } shape React.lazy requires.
function lazyNamed<M extends Record<string, ComponentType>>(
  factory: () => Promise<M>,
  name: keyof M & string,
): ComponentType {
  return lazy(() => factory().then((m) => ({ default: m[name] }))) as unknown as ComponentType;
}

// ── Sims ─────────────────────────────────────────────────────────────────────
export const sims: Record<string, ComponentType> = {
  'rest-request-lifecycle': lazyNamed(
    () => import('../components/sims/RestRequestLifecycleSim'),
    'RestRequestLifecycleSim',
  ), // S2 · golden
};

// ── Figures ───────────────────────────────────────────────────────────────────
export const figures: Record<string, ComponentType> = {
  'rest-anatomy': lazyNamed(() => import('../components/figures/RestAnatomy'), 'RestAnatomy'), // S2
  'http-status-classes': lazyNamed(
    () => import('../components/figures/HttpStatusClasses'),
    'HttpStatusClasses',
  ), // S2
};

export const getSim = (key: string): ComponentType | undefined => sims[key];
export const getFigure = (key: string): ComponentType | undefined => figures[key];
