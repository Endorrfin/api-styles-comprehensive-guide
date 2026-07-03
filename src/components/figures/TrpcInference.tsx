import { useLang } from '../../i18n/lang';

/*
 * trpc-inference (m11) — the one picture that makes tRPC click: the server exports a TYPE
 * (`export type AppRouter = typeof appRouter`), the client `import type`s it, and TypeScript's
 * inference — NOT a codegen step — carries the contract across the boundary. The middle lane calls
 * out the absent build step; the bottom banner is the runtime-validation caveat (types are erased).
 * Colours: violet = server / the exported type, cyan = client / inferred call, amber = the "no codegen"
 * annotation, danger = the validate-at-runtime security note.
 * Ref: tRPC docs (routers, validators); Announcing tRPC v11.
 */

const MONO = 'var(--font-mono)';

function Code({ x, y, text, color = 'var(--tx2)', size = 10.5, bold = false }: { x: number; y: number; text: string; color?: string; size?: number; bold?: boolean }) {
  return (
    <text x={x} y={y} fill={color} fontSize={size} fontFamily={MONO} fontWeight={bold ? 700 : 400}>
      {text}
    </text>
  );
}

export function TrpcInference() {
  const { t } = useLang();

  return (
    <svg
      viewBox="0 0 720 316"
      className="fig-svg"
      role="img"
      aria-label={t({
        en: 'The server exports the type AppRouter (typeof appRouter); the client imports that type only, with import type, which is erased at runtime. TypeScript inference — not a codegen build step — carries the contract across the boundary, so the client call trpc.user.byId.query is fully typed and autocompleted. A note warns that types vanish at runtime, so inputs must still be validated with a runtime validator like zod.',
        uk: 'Сервер експортує тип AppRouter (typeof appRouter); клієнт імпортує лише цей тип через import type, який стирається в runtime. Inference TypeScript — а не крок codegen — переносить контракт через межу, тож клієнтський виклик trpc.user.byId.query повністю типізований з автокомплітом. Примітка попереджає, що типи зникають у runtime, тож вхід усе одно треба валідувати runtime-валідатором на кшталт zod.',
      })}
    >
      {/* ── Server card ─────────────────────────────────────────── */}
      <rect x="16" y="34" width="286" height="176" rx="10" fill="var(--c-storage-soft)" stroke="var(--accent)" strokeWidth="1.3" />
      <text x="32" y="56" fill="var(--accent)" fontSize="11.5" fontFamily={MONO} fontWeight={700}>
        {t({ en: 'SERVER', uk: 'СЕРВЕР' })}
      </text>
      <Code x={32} y={80} text="const appRouter = router({" />
      <Code x={32} y={98} text="  user: { byId: publicProcedure" color="var(--tx)" />
      <Code x={32} y={116} text="    .input(z.object({ id: z.string() }))" color="var(--c-danger)" size={10} />
      <Code x={32} y={134} text="    .query(() => db.user…) } });" color="var(--tx)" />
      <line x1="32" y1="148" x2="286" y2="148" stroke="var(--line2)" strokeWidth="1" strokeDasharray="3 3" />
      <Code x={32} y={168} text="export type AppRouter" color="var(--accent)" bold />
      <Code x={32} y={185} text="  = typeof appRouter;" color="var(--accent)" bold />
      <text x="32" y="203" fill="var(--tx3)" fontSize="9.5" fontFamily="var(--font-body)">
        {t({ en: 'exports a TYPE, not code', uk: 'експортує ТИП, а не код' })}
      </text>

      {/* ── Middle lane: inference, no codegen ──────────────────── */}
      {/* "no codegen" badge */}
      <rect x="316" y="44" width="88" height="24" rx="12" fill="var(--c-analytics-soft)" stroke="var(--c-analytics)" strokeWidth="1.1" />
      <text x="360" y="60" textAnchor="middle" fill="var(--c-analytics)" fontSize="10.5" fontFamily={MONO} fontWeight={700}>
        {t({ en: 'no codegen', uk: 'no codegen' })}
      </text>

      {/* the type-carrying arrow */}
      <text x="360" y="110" textAnchor="middle" fill="var(--accent-2)" fontSize="11" fontFamily={MONO} fontWeight={700}>
        import type
      </text>
      <line x1="304" y1="124" x2="410" y2="124" stroke="var(--accent-2)" strokeWidth="1.8" />
      <polygon points="410,124 400,119 400,129" fill="var(--accent-2)" />
      <text x="360" y="144" textAnchor="middle" fill="var(--tx3)" fontSize="9.5" fontFamily="var(--font-body)">
        {t({ en: 'inference walks the type', uk: 'inference обходить тип' })}
      </text>

      {/* struck-through "build step" to underline the absence */}
      <text x="360" y="176" textAnchor="middle" fill="var(--tx3)" fontSize="10" fontFamily={MONO}>
        .proto / SDL
      </text>
      <line x1="322" y1="172" x2="398" y2="172" stroke="var(--c-analytics)" strokeWidth="1.6" />
      <text x="360" y="194" textAnchor="middle" fill="var(--tx3)" fontSize="9" fontFamily="var(--font-body)">
        {t({ en: 'no build step', uk: 'без build-кроку' })}
      </text>

      {/* ── Client card ─────────────────────────────────────────── */}
      <rect x="418" y="34" width="286" height="176" rx="10" fill="var(--accent-2-soft)" stroke="var(--accent-2)" strokeWidth="1.3" />
      <text x="434" y="56" fill="var(--accent-2)" fontSize="11.5" fontFamily={MONO} fontWeight={700}>
        {t({ en: 'CLIENT', uk: 'КЛІЄНТ' })}
      </text>
      <Code x={434} y={80} text="import type { AppRouter }" color="var(--accent-2)" bold />
      <Code x={434} y={98} text="createTRPCClient<AppRouter>()" color="var(--tx)" />
      <line x1="434" y1="112" x2="688" y2="112" stroke="var(--line2)" strokeWidth="1" strokeDasharray="3 3" />
      <Code x={434} y={134} text="trpc.user.byId.query({ id })" color="var(--tx)" />
      <Code x={434} y={158} text="↳ : User" color="var(--accent-2)" bold size={11} />
      <text x="512" y="158" fill="var(--c-commit)" fontSize="10" fontFamily="var(--font-body)">
        {t({ en: '✓ typed + autocompleted', uk: '✓ типи + автокомпліт' })}
      </text>
      <text x="434" y="185" fill="var(--tx3)" fontSize="9.5" fontFamily="var(--font-body)">
        {t({ en: 'types inferred, never generated', uk: 'типи виведені, не згенеровані' })}
      </text>

      {/* ── Bottom banner: the runtime-validation caveat ────────── */}
      <rect x="16" y="224" width="688" height="74" rx="10" fill="var(--c-danger-soft)" stroke="var(--c-danger)" strokeWidth="1.1" strokeDasharray="6 4" />
      <text x="32" y="248" fill="var(--c-danger)" fontSize="11" fontFamily={MONO} fontWeight={700}>
        {t({ en: 'types are erased at runtime', uk: 'типи стираються в runtime' })}
      </text>
      <text x="32" y="270" fill="var(--tx2)" fontSize="10.5" fontFamily="var(--font-body)">
        {t({
          en: 'The inferred input type checks nothing on the wire — a client can POST anything.',
          uk: 'Виведений тип входу не перевіряє нічого на дроті — клієнт може POST-нути будь-що.',
        })}
      </text>
      <text x="32" y="288" fill="var(--tx2)" fontSize="10.5" fontFamily="var(--font-body)">
        {t({
          en: 'Validate at the boundary with .input(zod) — tRPC then infers the type from that schema.',
          uk: 'Валідуй на межі через .input(zod) — далі tRPC виводить тип із цієї ж схеми.',
        })}
      </text>
    </svg>
  );
}
