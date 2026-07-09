import type { Localized } from './types';
// CHANGED (s13b): derive from meta.ts (mentalModel lives in meta.json) — the gallery page no
// longer drags every module BODY into its chunk; the SSOT guarantee is unchanged (meta is
// generated from concepts and drift-guarded by check:meta).
import { getSection, modules } from './meta';

/*
 * Mental-model gallery cards — derived from the SSOT so they can never drift from the modules.
 * One card per module: its one-line mental model, coloured by its section accent.
 */
export type MentalModelCard = {
  moduleId: string;
  title: Localized;
  line: Localized;
  accent: string;
};

export const mentalModelCards: MentalModelCard[] = modules.map((m) => ({
  moduleId: m.id,
  title: m.title,
  line: m.mentalModel,
  accent: getSection(m.section)?.accent ?? 'var(--accent)',
}));
