/*
 * bodies.ts — CHANGED (s13b): per-section lazy loading of module BODIES.
 *
 * The s10a meta split keeps bodies out of the eager bundle; this completes the idea by splitting
 * the single ~1 MB `concepts` chunk into six per-section chunks. ModulePage renders its header/TOC
 * from meta.ts synchronously and calls loadModule() for the body — a cold module open now pulls
 * only that section's bodies. concepts.ts stays the node-side SSOT (genMeta / check-data / smoke).
 *
 * The cache is intentionally module-level and synchronous to read (getLoadedModule): the SSR smoke
 * warms it with loadModule() and then renders the full page in one sync pass, and client-side
 * section-mates render instantly after the first hit.
 */
import type { Module } from './types';
import { getModule as getModuleMeta } from './meta';

const SECTION_LOADERS: Record<string, () => Promise<{ bodies: Module[] }>> = {
  's0-foundations': () => import('./sections/s0-foundations'),
  's1-req-resp-http': () => import('./sections/s1-req-resp-http'),
  's2-contract-first': () => import('./sections/s2-contract-first'),
  's3-realtime-events': () => import('./sections/s3-realtime-events'),
  's4-cross-cutting': () => import('./sections/s4-cross-cutting'),
  's5-choosing': () => import('./sections/s5-choosing'),
};

const cache = new Map<string, Module>();
const inflight = new Map<string, Promise<void>>();

/** Synchronous cache read — defined for section-mates after any loadModule() of that section. */
export function getLoadedModule(id: string): Module | undefined {
  return cache.get(id);
}

/** Load (and cache) the module body by id via its section chunk. */
export async function loadModule(id: string): Promise<Module | undefined> {
  const hit = cache.get(id);
  if (hit) return hit;
  const sectionId = getModuleMeta(id)?.section;
  const loader = sectionId ? SECTION_LOADERS[sectionId] : undefined;
  if (!loader) return undefined;
  let p = inflight.get(sectionId!);
  if (!p) {
    // QA (s13b): clear inflight on failure too — a rejected import (offline; stale hashed chunk
    // after a redeploy) must stay retryable, not poison the section forever.
    p = loader()
      .then(({ bodies }) => {
        for (const m of bodies) cache.set(m.id, m);
      })
      .finally(() => inflight.delete(sectionId!));
    inflight.set(sectionId!, p);
  }
  await p;
  return cache.get(id);
}
