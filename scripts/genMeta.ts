/// <reference types="node" />
/*
 * genMeta.ts — CHANGED (s10a): the meta split (standard §4.4). Derives the lightweight nav/search
 * metadata index (src/data/meta.json) from concepts.ts (the content SSOT). The eager shell (TopBar,
 * Sidebar, Footer, lib/search) + the landing map and the compass read src/data/meta.ts (backed by this
 * json); only the lazy ModulePage imports full module bodies from concepts.ts — keeping the hundreds of
 * kilobytes of authored content OUT of the initial bundle.
 *
 * Run: `npm run gen:meta` (tsx). Wired as `predev`/`prebuild` so builds never ship stale metadata;
 * `scripts/checkMeta.ts` (wired into `typecheck`) guards the committed file against drift. Commit meta.json.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { sections, modules } from '../src/data/concepts';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'src', 'data', 'meta.json');

const meta = {
  sections,
  modules: modules.map((m) => ({
    id: m.id,
    num: m.num,
    section: m.section,
    order: m.order,
    level: m.level,
    signature: !!m.signature,
    title: m.title,
    tagline: m.tagline,
    mentalModel: m.mentalModel,
    readMins: m.readMins,
    topics: m.topics.map((t) => ({ id: t.id, title: t.title })),
    seeAlso: m.seeAlso,
    authored: m.topics.length > 0, // mirrors concepts.isAuthored()
  })),
};

writeFileSync(out, JSON.stringify(meta, null, 2) + '\n', 'utf8');
console.log(
  `meta.json written → ${meta.modules.length} modules · ${meta.sections.length} sections · ` +
    `${meta.modules.filter((m) => m.signature).length} signature sims · ` +
    `${meta.modules.filter((m) => m.authored).length} authored`,
);
