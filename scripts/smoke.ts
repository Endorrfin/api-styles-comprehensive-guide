/*
 * smoke.ts — full SSR/render smoke (standard §4.6). `npm run smoke` runs this; CI runs it before build.
 * Move into place as `scripts/smoke.ts` (the bootstrap ritual does this), then wire the 4 spots marked
 * `TODO (wire to your guide)` below.
 *
 * Why: the app lazy-loads every sim, figure and route page, so a component that throws on render — or a
 * registry key pointing at a broken module — is invisible until someone navigates to it. `check:data`
 * proves every referenced key *exists*; it never *renders* anything. This smoke renders, on the server
 * with react-dom/server, in BOTH languages:
 *   A. every sim + figure component (auto-discovered from the file tree, 1 component per .tsx file),
 *   B. every route page's server-renderable shell,
 *   C. the per-module page header/TOC/nav for all modules,
 *   D. the eager <App/> shell across representative + bogus hashes (exercises the hash router + chrome).
 *
 * JSX is avoided on purpose (createElement only) so this stays a plain `.ts` that tsconfig.node.json
 * typechecks and `tsx` runs directly. If your sims co-locate CSS, the css-stub hook below lets them import.
 */
import { register } from "node:module";
// Stub `.css` imports so CSS-co-located components can be imported under tsx. Harmless if unused.
register("./css-stub-hooks.mjs", import.meta.url);

import { createElement as h } from "react";
import type { ReactNode } from "react";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";

// ── Minimal browser shim (SSR has no DOM; the language provider reads localStorage at render) ────────
let currentLang: "en" | "uk" = "en";
const g = globalThis as Record<string, unknown>;
const def = (k: string, v: unknown): void => {
  try {
    g[k] = v;
  } catch {
    Object.defineProperty(g, k, { value: v, configurable: true, writable: true });
  }
};
def("window", globalThis);
// Key-agnostic getItem returns the target lang for ANY key — robust to the storage-key name; the
// EN≠UK sanity check below proves the switch took.
def("localStorage", { getItem: () => currentLang, setItem: () => {}, removeItem: () => {}, clear: () => {} });
def("matchMedia", (q: string) => ({ matches: false, media: q, onchange: null, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false }));
def("document", { documentElement: { lang: "", style: {}, setAttribute: () => {}, getAttribute: () => null }, querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, addEventListener: () => {}, removeEventListener: () => {} });
def("location", { hash: "" });

// React's legacy server APIs warn about Suspense/deprecation when the lazy app shell suspends; that
// noise is expected. Drop only those messages — real errors still surface.
const NOISE = ["renderToStaticMarkup", "renderToString", "Suspense", "hydrat", "renderToPipeableStream"];
const origError = console.error.bind(console);
console.error = (...args: unknown[]): void => {
  if (NOISE.some((n) => String(args[0] ?? "").includes(n))) return;
  origError(...(args as Parameters<typeof origError>));
};

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

let checks = 0;
let failures = 0;
function ok(cond: boolean, msg: string): void {
  checks++;
  if (!cond) {
    failures++;
    console.error("  ✖ " + msg);
  }
}

// Technical terms that stay English in both langs make the best canaries.
const SIM_CANARIES: Record<string, string[]> = {
  RestRequestLifecycleSim: ["/articles/42"],
  StyleCompassSim: ["REST", "gRPC"], // s3 · style names are language-independent
  HttpMultiplexingSim: ["HTTP/1.1", "HTTP/3"], // s4 · protocol names render in any state
  GrpcWireSim: ["Article", "int64"], // s5 · schema block renders in any state
  GraphqlNplus1Sim: ["posts", "DataLoader"], // s6 · query block + toggle render in any state
  WebsocketFramesSim: ["Client", "Server"], // s7 · rail headers render in any state
  WebrtcConnectSim: ["Peer A", "TURN"], // s8 · rail header + scenario tag render in any state
  WebhookDeliverySim: ["Provider", "Consumer"], // s9 · rail headers render in any state
};
const FIG_CANARIES: Record<string, string[]> = {
  RestAnatomy: ["GET /articles/42"],
  HttpStatusClasses: ["4xx"],
  ApiBoundary: ["API"], // s3
  InProcessVsNetwork: ["client"], // s3
  DecisionAxes: ["Timing"], // s3
  CouplingSpectrum: ["gRPC"], // s3
  HttpConnectionModels: ["HTTP/3"], // s4
  EncodingSize: ["Protobuf"], // s4
  GrpcCallTypes: ["Unary", "Bidirectional"], // s5
  GraphqlOverUnderFetching: ["REST", "GraphQL"], // s6
  WebsocketFrameAnatomy: ["opcode", "MASK"], // s7
  WebrtcConnectionPaths: ["STUN", "TURN"], // s8
  SseStreamAnatomy: ["text/event-stream", "Last-Event-ID"], // s9
  OdataQueryAnatomy: ["$filter", "$expand"], // s10a
  SoapEnvelope: ["Envelope", "WS-Security"], // s10a
  RpcEnvelope: ["jsonrpc", "-32601"], // s10a
};

async function main(): Promise<void> {
  const { LangProvider } = await import("../src/i18n/LangProvider");
  const { AppStateProvider } = await import("../src/components/AppStateProvider");
  const { MODULES } = await import("../src/data/concepts");
  const { sims, figures } = await import("../src/lib/registry");

  const langs = ["en", "uk"] as const;

  function ssr(el: ReactNode, lang: "en" | "uk"): string {
    currentLang = lang;
    // Nest AppStateProvider (used by TopBar/Sidebar/ModulePage/App) inside LangProvider.
    return renderToStaticMarkup(h(LangProvider, null, h(AppStateProvider, null, el)));
  }

  function check(label: string, el: ReactNode, lang: "en" | "uk", min: number, includes: string[] = []): void {
    let html: string;
    try {
      html = ssr(el, lang);
    } catch (e) {
      ok(false, `${label} [${lang}] threw: ${(e as Error).message}`);
      return;
    }
    ok(html.length >= min, `${label} [${lang}] renders (${html.length} ≥ ${min} chars)`);
    for (const s of includes) ok(html.includes(s), `${label} [${lang}] contains "${s}"`);
  }

  // ── Layer A: every sim + figure component, auto-discovered (1 component per .tsx file) ──────────────
  async function renderComponentDir(sub: "sims" | "figures", registryCount: number, canaries: Record<string, string[]>): Promise<number> {
    const dir = join(root, "src/components", sub);
    const files = readdirSync(dir).filter((f) => f.endsWith(".tsx"));
    ok(files.length === registryCount, `${sub}: ${files.length} component files == ${registryCount} registry keys`);
    let rendered = 0;
    for (const file of files) {
      const mod: Record<string, unknown> = await import(pathToFileURL(join(dir, file)).href);
      const entry = Object.entries(mod).find(([n, v]) => /^[A-Z]/.test(n) && typeof v === "function");
      if (!entry) {
        ok(false, `${sub}/${file}: no exported component`);
        continue;
      }
      const [name, Comp] = entry;
      for (const lang of langs) check(name, h(Comp as () => ReactNode), lang, 200, canaries[name] ?? []);
      rendered++;
    }
    return rendered;
  }
  const simCount = await renderComponentDir("sims", Object.keys(sims).length, SIM_CANARIES);
  const figCount = await renderComponentDir("figures", Object.keys(figures).length, FIG_CANARIES);

  // ── Sanity: the language switch actually took (EN render differs from UK on a bilingual component) ──
  // TODO (wire to your guide): pick any bilingual sim/figure; the assertion proves the lang toggle works.
  if (simCount > 0 || figCount > 0) {
    const sub = simCount > 0 ? "sims" : "figures";
    const dir = join(root, "src/components", sub);
    const file = readdirSync(dir).find((f) => f.endsWith(".tsx"))!;
    const mod: Record<string, unknown> = await import(pathToFileURL(join(dir, file)).href);
    const Comp = Object.values(mod).find((v) => typeof v === "function") as () => ReactNode;
    ok(ssr(h(Comp), "en") !== ssr(h(Comp), "uk"), "EN and UK renders differ (lang toggle works)");
  }

  // ── Layer B: route pages (server-renderable shells) ────────────────────────────────────────────────
  const { LandscapeMap } = await import("../src/components/map/LandscapeMap");
  const { MentalModelsPage } = await import("../src/components/pages/MentalModelsPage");
  const { GlossaryPage } = await import("../src/components/pages/GlossaryPage");
  for (const lang of langs) {
    check("LandscapeMap", h(LandscapeMap), lang, 800);
    check("MentalModelsPage", h(MentalModelsPage), lang, 400);
    check("GlossaryPage", h(GlossaryPage), lang, 400);
  }

  // ── Layer C: per-module page header/TOC/nav for all modules (lazy body blocks → Suspense fallback) ──
  const { ModulePage } = await import("../src/components/module/ModulePage");
  for (const m of MODULES)
    for (const lang of langs) check(`ModulePage:${m.id}`, h(ModulePage, { moduleId: m.id }), lang, 300);

  // ── Layer D: eager app shell + hash router (lazy routes render as the Suspense fallback) ────────────
  const { App } = await import("../src/App");
  for (const hash of ["", "#/map", "#/m/m5-rest", "#/m/m5-rest/the-request-lifecycle", "#/glossary", "#/mental-models", "#/decide", "#/does-not-exist"]) {
    (g.location as { hash: string }).hash = hash;
    check(`App ${hash || "(empty)"}`, h(App), "en", 2000);
  }

  console.log("— SSR / render smoke —");
  console.log(`  components: ${simCount} sims + ${figCount} figures, each rendered EN + UK`);
  console.log(`  ${checks} checks total`);
  if (failures > 0) {
    console.error(`\n✖ ${failures} smoke failure(s).`);
    process.exit(1);
  }
  console.log("\n✓ All SSR/render smoke checks passed.");
}

main().catch((e) => {
  console.error("smoke crashed:", e);
  process.exit(1);
});
