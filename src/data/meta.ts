/*
 * meta.ts — CHANGED (s10a): the lightweight metadata API (standard §4.4), backed by the generated
 * meta.json (scripts/genMeta.ts). Everything that needs only nav/search/title data — the eager shell
 * (TopBar, Sidebar, Footer), lib/search, the landing LandscapeMap and the StyleCompass — imports from
 * HERE, not from concepts.ts, so authored module bodies never enter the initial bundle. Only the lazy
 * ModulePage (and node-side scripts) import the full content from concepts.ts.
 *
 * Exports mirror the concepts.ts names (sections · modules · LEVELS · COUNTS · getSection ·
 * modulesBySection · isAuthored) so consumers swap only the import path.
 */
import metaRaw from './meta.json';
import type { Level, Localized, Section } from './types';

export type TopicMeta = { id: string; title: Localized };
export type ModuleMeta = {
  id: string;
  num: number;
  section: string;
  order: number;
  level: Level;
  signature: boolean;
  title: Localized;
  tagline: Localized;
  mentalModel: Localized;
  readMins: number;
  topics: TopicMeta[];
  seeAlso: string[];
  authored: boolean;
};
type MetaFile = { sections: Section[]; modules: ModuleMeta[] };

const META = metaRaw as unknown as MetaFile;

export const sections: Section[] = META.sections;
export const modules: ModuleMeta[] = META.modules;

// ── Lookups (same shapes as concepts.ts) ─────────────────────────────────────
const moduleById = new Map(modules.map((m) => [m.id, m]));
const sectionById = new Map(sections.map((s) => [s.id, s]));

export function getModule(id: string): ModuleMeta | undefined {
  return moduleById.get(id);
}
export function getSection(id: string): Section | undefined {
  return sectionById.get(id);
}
export function modulesBySection(sectionId: string): ModuleMeta[] {
  return modules.filter((m) => m.section === sectionId).sort((a, b) => a.order - b.order);
}
/** A module is "authored" (vs a navigable stub) once it has topics — precomputed by the codegen. */
export function isAuthored(m: ModuleMeta): boolean {
  return m.authored;
}
// CHANGED (s13b): mirrors concepts.adjacentModules — ModulePage now navigates from meta.
/** Previous / next module in global order (by `num`). */
export function adjacentModules(id: string): { prev?: ModuleMeta; next?: ModuleMeta } {
  const ordered = [...modules].sort((a, b) => a.num - b.num);
  const i = ordered.findIndex((m) => m.id === id);
  if (i === -1) return {};
  return { prev: ordered[i - 1], next: ordered[i + 1] };
}

export const LEVELS: Level[] = ['beginner', 'middle', 'senior', 'staff'];

export const COUNTS = {
  sections: sections.length,
  modules: modules.length,
  sims: modules.filter((m) => m.signature).length,
};
