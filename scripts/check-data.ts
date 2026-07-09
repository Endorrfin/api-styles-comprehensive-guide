// scripts/check-data.ts — data-integrity gate (standard §3.8 / §4.6). Run with: tsx scripts/check-data.ts
// Validates the SSOT before every deploy. Exits non-zero on any error.
//
// Assumes: src/data/concepts.ts exports `sections: Section[]` and `modules: Module[]`,
//          src/lib/registry.tsx declares sim/figure keys as string literals.
// Adapt the COUNTS at the bottom and any guide-specific checks.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { sections, modules } from '../src/data/concepts';
// CHANGED (s13b): glossary integrity joins the gate (terms unique + bilingual, seeAlso resolve).
import { glossary } from '../src/data/glossary';
import type { Localized, Module, Section } from '../src/data/types';

const here = dirname(fileURLToPath(import.meta.url));
const errors: string[] = [];
const err = (cond: unknown, msg: string) => { if (!cond) errors.push(msg); };

// --- helpers ---------------------------------------------------------------
const isLoc = (v: unknown): v is Localized =>
  !!v && typeof v === 'object' && 'en' in (v as object) && 'uk' in (v as object);
const locOk = (v: Localized | undefined, where: string) => {
  if (!isLoc(v)) { errors.push(`Localized expected at ${where}`); return; }
  err(v.en?.trim(), `empty EN at ${where}`);
  err(v.uk?.trim(), `empty UK at ${where}`);
};

// --- registry keys (parsed as text to avoid importing React) ---------------
const registrySrc = readFileSync(resolve(here, '../src/lib/registry.tsx'), 'utf8');
// Extract the `sims`/`figures` object-literal by brace-matching (robust to the word appearing in
// comments and import paths like ../components/sims/…). Keys are `'kebab-key':` entries in that block.
const keysIn = (record: 'sims' | 'figures') => {
  const decl = registrySrc.indexOf(`const ${record}`);
  if (decl === -1) return new Set<string>();
  const open = registrySrc.indexOf('{', decl);
  let depth = 0;
  let end = open;
  for (let i = open; i < registrySrc.length; i++) {
    const c = registrySrc[i];
    if (c === '{') depth++;
    else if (c === '}' && --depth === 0) { end = i; break; }
  }
  const block = registrySrc.slice(open, end);
  return new Set([...block.matchAll(/['"]([a-z0-9-]+)['"]\s*:/g)].map((m) => m[1]));
};
const simKeys = keysIn('sims');
const figKeys = keysIn('figures');

// --- structural checks -----------------------------------------------------
const sectionIds = new Set<string>();
for (const s of sections as Section[]) {
  err(!sectionIds.has(s.id), `duplicate section id ${s.id}`); sectionIds.add(s.id);
  locOk(s.title, `section ${s.id}.title`);
}

const moduleIds = new Set<string>();
const nums = new Set<number>();
for (const m of modules as Module[]) {
  err(!moduleIds.has(m.id), `duplicate module id ${m.id}`); moduleIds.add(m.id);
  err(!nums.has(m.num), `duplicate module num ${m.num} (${m.id})`); nums.add(m.num);
  err(sectionIds.has(m.section), `module ${m.id} -> unknown section ${m.section}`);
  locOk(m.title, `${m.id}.title`); locOk(m.tagline, `${m.id}.tagline`); locOk(m.mentalModel, `${m.id}.mentalModel`);
  for (const sa of m.seeAlso) err(sa !== m.id, `${m.id} seeAlso self-reference`);
  for (const src of m.sources) err(/^https?:\/\//.test(src.url), `${m.id} bad source url: ${src.url}`);

  // order unique within section
  const sib = (modules as Module[]).filter((x) => x.section === m.section);
  err(sib.filter((x) => x.order === m.order).length === 1, `${m.id} duplicate order ${m.order} in ${m.section}`);

  for (const t of m.topics) {
    locOk(t.title, `${m.id}/${t.id}.title`);
    for (const [i, b] of t.blocks.entries()) {
      const at = `${m.id}/${t.id}#${i}`;
      if (b.kind === 'prose') locOk(b.md, `${at} prose`);
      if (b.kind === 'figure') err(figKeys.has(b.fig), `${at} unknown figure key '${b.fig}'`);
      if (b.kind === 'sim') err(simKeys.has(b.sim), `${at} unknown sim key '${b.sim}'`);
      if (b.kind === 'table') {
        for (const row of b.rows) err(row.length === b.head.length, `${at} table row width != head`);
      }
      if (b.kind === 'compare') for (const r of b.rows) err(r.length === 3, `${at} compare row not a 3-tuple`);
    }
  }
}

// seeAlso targets exist
for (const m of modules as Module[]) for (const sa of m.seeAlso) err(moduleIds.has(sa), `${m.id} seeAlso -> unknown ${sa}`);

// --- glossary integrity (s13b) ----------------------------------------------
const termSet = new Set<string>();
for (const g of glossary) {
  err(!termSet.has(g.term), `glossary duplicate term "${g.term}"`); termSet.add(g.term);
  err(g.term.trim(), 'glossary empty term');
  locOk(g.def, `glossary "${g.term}".def`);
  for (const sa of g.seeAlso ?? []) {
    err(sa !== g.term, `glossary "${g.term}" seeAlso self-reference`);
    err(glossary.some((x) => x.term === sa), `glossary "${g.term}" seeAlso -> unknown term "${sa}"`);
  }
}

// --- COUNTS (adapt to the guide) ------------------------------------------
const EXPECTED_SECTIONS = sections.length; // set to a hard number once the curriculum is locked
const EXPECTED_MODULES = modules.length;   // e.g. 36
err(sections.length === EXPECTED_SECTIONS, `expected ${EXPECTED_SECTIONS} sections, got ${sections.length}`);
err(modules.length === EXPECTED_MODULES, `expected ${EXPECTED_MODULES} modules, got ${modules.length}`);

// --- report ----------------------------------------------------------------
if (errors.length) {
  console.error(`✗ check:data — ${errors.length} problem(s):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`✓ check:data — ${sections.length} sections, ${modules.length} modules, ${glossary.length} glossary terms, all bilingual, registry + links resolve.`);
