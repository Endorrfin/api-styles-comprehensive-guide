/// <reference types="node" />
/*
 * checkMeta.ts — CHANGED (s10a): guard against a stale committed meta.json (standard §4.4).
 * `gen:meta` runs as prebuild/predev, but typecheck-only paths (editor, CI stages before build) never
 * trigger those hooks — so this check asserts the committed meta.json still matches concepts.ts.
 * Wired into `npm run typecheck`, so nav/search vs content divergence can't ship.
 * If it fails: run `npm run gen:meta` and commit src/data/meta.json.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { sections, modules } from '../src/data/concepts';

const here = dirname(fileURLToPath(import.meta.url));
const meta = JSON.parse(readFileSync(join(here, '..', 'src', 'data', 'meta.json'), 'utf8')) as {
  sections: unknown[];
  modules: Record<string, unknown>[];
};

const errs: string[] = [];
const eq = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

if (!eq(meta.sections, sections)) errs.push('sections drift');
if (meta.modules.length !== modules.length) {
  errs.push(`module count drift: meta=${meta.modules.length} vs src=${modules.length}`);
}

for (const m of modules) {
  const mm = meta.modules.find((x) => x.id === m.id);
  if (!mm) {
    errs.push(`missing in meta: ${m.id}`);
    continue;
  }
  const fields: [string, unknown, unknown][] = [
    ['num', mm.num, m.num],
    ['section', mm.section, m.section],
    ['order', mm.order, m.order],
    ['level', mm.level, m.level],
    ['signature', mm.signature, !!m.signature],
    ['title', mm.title, m.title],
    ['tagline', mm.tagline, m.tagline],
    ['mentalModel', mm.mentalModel, m.mentalModel],
    ['readMins', mm.readMins, m.readMins],
    ['topics', mm.topics, m.topics.map((t) => ({ id: t.id, title: t.title }))],
    ['seeAlso', mm.seeAlso, m.seeAlso],
    ['authored', mm.authored, m.topics.length > 0],
  ];
  for (const [name, a, b] of fields) if (!eq(a, b)) errs.push(`${m.id}.${name} drift`);
}

if (errs.length) {
  console.error('META-SYNC FAIL (run `npm run gen:meta` and commit src/data/meta.json):\n - ' + errs.join('\n - '));
  process.exit(1);
}
console.log(`✓ check:meta — meta.json in sync (${modules.length} modules).`);
