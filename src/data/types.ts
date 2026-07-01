// src/data/types.ts — the canonical content contract (standard §4.2).
// Reuse VERBATIM across Tier-1 guides so check-data.ts, the registry and the renderers stay shared.

export type Lang = 'en' | 'uk';
export type Localized = { en: string; uk: string };
export type Level = 'beginner' | 'middle' | 'senior' | 'staff';

// The 7 content block kinds. Figures/sims are referenced by kebab `key` (resolved in lib/registry.tsx).
export type Block =
  | { kind: 'prose';   md: Localized }
  | { kind: 'figure';  fig: string; caption?: Localized }
  | { kind: 'sim';     sim: string; caption?: Localized }
  | { kind: 'table';   head: Localized[]; rows: Localized[][]; caption?: Localized }
  | { kind: 'code';    lang: string; code: string; note?: Localized }
  | { kind: 'callout'; tone: 'tip' | 'warn' | 'senior' | 'security'; title: Localized; md: Localized }
  | { kind: 'compare'; a: Localized; b: Localized; rows: [Localized, Localized, Localized][] };

export type Topic = { id: string; title: Localized; blocks: Block[] };

export type Module = {
  id: string;            // `m<N>-<kebab>`, e.g. 'm13-btree'
  num: number;           // global display number, contiguous 1..N
  section: string;       // section id, e.g. 's3-storage'
  order: number;         // order within the section (unique per section)
  level: Level;
  signature?: boolean;   // true if it carries a hero sim
  title: Localized;
  tagline: Localized;
  readMins: number;
  mentalModel: Localized;
  topics: Topic[];
  keyPoints: Localized[];
  pitfalls: { title: Localized; body: Localized }[];
  interview?: { q: Localized; a: Localized; level?: Level }[];
  seeAlso: string[];     // module ids
  sources: { title: string; url: string }[];
};

export type Section = {
  id: string;            // `s<n>-<kebab>`
  roman?: string;        // 'I', 'II', … (optional display)
  title: Localized;
  accent?: string;       // CSS var or hex within the locked palette
};
