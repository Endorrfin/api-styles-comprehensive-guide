import { useLang } from '../../i18n/lang';

/*
 * gateway-topology (m23) — the request path made legible. Left→right flow:
 *   clients (web/mobile/partner) → ONE API gateway (edge concerns) → per-client BFFs → services.
 * A trace rail along the bottom shows the W3C Trace Context `traceparent` carrying ONE trace_id from
 * the edge to the last hop (the module's mental model).
 * Technical tokens (API Gateway, BFF, REST, gRPC, GraphQL, traceparent, trace_id, TLS/authN) stay
 * English in both locales — the smoke canaries. Colours: accent (violet) = the gateway/edge; cyan
 * (accent-2) = the trace rail + BFF; commit-soft = services.
 * Ref: OpenTelemetry + W3C Trace Context; BFF = Sam Newman.
 */

const BODY = 'var(--font-body)';
const MONO = 'var(--font-mono)';

export function GatewayTopology() {
  const { t } = useLang();

  return (
    <svg
      viewBox="0 0 720 300"
      className="fig-svg"
      role="img"
      aria-label={t({
        en: 'A left-to-right topology. Three clients — web, mobile and partner — enter one API gateway that owns the edge concerns: TLS, authentication, rate limiting, routing and trace-id injection. The gateway forwards to per-client backends-for-frontend, a web BFF and a mobile BFF, which call the internal services: Orders over REST, Payments over gRPC and Search over GraphQL. Along the bottom a trace rail shows a single W3C Trace Context traceparent header carrying one trace_id across every hop from the edge to the last service.',
        uk: 'Топологія зліва направо. Три клієнти — web, mobile і partner — входять в один API gateway, що володіє edge-турботами: TLS, автентифікація, rate limiting, маршрутизація й інʼєкція trace-id. Gateway пересилає в backend-for-frontend на клієнта, web BFF і mobile BFF, які викликають внутрішні сервіси: Orders через REST, Payments через gRPC і Search через GraphQL. Уздовж низу trace-рейка показує єдиний заголовок W3C Trace Context traceparent, що несе один trace_id крізь кожен хоп від edge до останнього сервісу.',
      })}
    >
      <text x="14" y="22" fill="var(--accent)" fontSize="12" fontFamily={MONO} fontWeight={700}>
        {t({ en: 'Gateway topology — one trace id, edge to last hop', uk: 'Gateway topology — один trace id, від edge до останнього хопа' })}
      </text>

      {/* ── clients ───────────────────────────────────────────────────────── */}
      <text x="14" y="44" fill="var(--tx3)" fontSize="8.5" fontFamily={BODY}>{t({ en: 'clients', uk: 'клієнти' })}</text>
      <rect x="14" y="52" width="92" height="30" rx="7" fill="var(--s2)" stroke="var(--line2)" strokeWidth="1" />
      <text x="60" y="71" textAnchor="middle" fill="var(--tx)" fontSize="10" fontFamily={MONO}>Web</text>
      <rect x="14" y="110" width="92" height="30" rx="7" fill="var(--s2)" stroke="var(--line2)" strokeWidth="1" />
      <text x="60" y="129" textAnchor="middle" fill="var(--tx)" fontSize="10" fontFamily={MONO}>Mobile</text>
      <rect x="14" y="168" width="92" height="30" rx="7" fill="var(--s2)" stroke="var(--line2)" strokeWidth="1" />
      <text x="60" y="187" textAnchor="middle" fill="var(--tx)" fontSize="10" fontFamily={MONO}>Partner</text>

      {/* client → gateway */}
      <line x1="106" y1="67" x2="140" y2="98" stroke="var(--line2)" strokeWidth="1.2" />
      <line x1="106" y1="125" x2="140" y2="125" stroke="var(--line2)" strokeWidth="1.2" />
      <line x1="106" y1="183" x2="140" y2="152" stroke="var(--line2)" strokeWidth="1.2" />
      <polygon points="142,125 132,120 132,130" fill="var(--line2)" />

      {/* ── API gateway ───────────────────────────────────────────────────── */}
      <rect x="142" y="52" width="120" height="150" rx="10" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1.6" />
      <text x="202" y="72" textAnchor="middle" fill="var(--accent)" fontSize="10.5" fontFamily={MONO} fontWeight={700}>API Gateway</text>
      <text x="202" y="96" textAnchor="middle" fill="var(--tx2)" fontSize="9" fontFamily={MONO}>TLS · authN</text>
      <text x="202" y="116" textAnchor="middle" fill="var(--tx2)" fontSize="9" fontFamily={MONO}>rate-limit</text>
      <text x="202" y="136" textAnchor="middle" fill="var(--tx2)" fontSize="9" fontFamily={MONO}>route</text>
      <text x="202" y="160" textAnchor="middle" fill="var(--accent-2)" fontSize="9" fontFamily={MONO} fontWeight={700}>+ trace-id</text>
      <text x="202" y="180" textAnchor="middle" fill="var(--tx3)" fontSize="7.5" fontFamily={BODY}>m17 · m20 · m22</text>

      {/* gateway → BFF */}
      <line x1="262" y1="100" x2="298" y2="92" stroke="var(--accent)" strokeWidth="1.3" />
      <polygon points="300,91 290,87 291,97" fill="var(--accent)" />
      <line x1="262" y1="150" x2="298" y2="150" stroke="var(--accent)" strokeWidth="1.3" />
      <polygon points="300,150 290,145 290,155" fill="var(--accent)" />

      {/* ── BFF layer ─────────────────────────────────────────────────────── */}
      <text x="300" y="44" fill="var(--tx3)" fontSize="8.5" fontFamily={BODY}>{t({ en: 'BFF per client', uk: 'BFF на клієнта' })}</text>
      <rect x="300" y="74" width="108" height="34" rx="8" fill="var(--accent-2-soft)" stroke="var(--accent-2)" strokeWidth="1.2" />
      <text x="354" y="95" textAnchor="middle" fill="var(--tx)" fontSize="9.5" fontFamily={MONO}>Web BFF</text>
      <rect x="300" y="133" width="108" height="34" rx="8" fill="var(--accent-2-soft)" stroke="var(--accent-2)" strokeWidth="1.2" />
      <text x="354" y="154" textAnchor="middle" fill="var(--tx)" fontSize="9.5" fontFamily={MONO}>Mobile BFF</text>

      {/* BFF → services (web BFF composes two; mobile BFF calls one) */}
      <line x1="408" y1="88" x2="448" y2="76" stroke="var(--accent-2)" strokeWidth="1.2" />
      <polygon points="450,75 440,71 441,81" fill="var(--accent-2)" />
      <line x1="408" y1="99" x2="448" y2="182" stroke="var(--accent-2)" strokeWidth="1.2" />
      <polygon points="449,184 439,180 446,174" fill="var(--accent-2)" />
      <line x1="408" y1="150" x2="448" y2="132" stroke="var(--accent-2)" strokeWidth="1.2" />
      <polygon points="450,131 440,127 440,137" fill="var(--accent-2)" />

      {/* ── services ──────────────────────────────────────────────────────── */}
      <text x="450" y="44" fill="var(--tx3)" fontSize="8.5" fontFamily={BODY}>{t({ en: 'services', uk: 'сервіси' })}</text>
      <rect x="450" y="58" width="150" height="34" rx="8" fill="var(--c-commit-soft)" stroke="var(--c-commit)" strokeWidth="1.1" />
      <text x="525" y="79" textAnchor="middle" fill="var(--tx)" fontSize="9.5" fontFamily={MONO}>Orders · REST</text>
      <rect x="450" y="114" width="150" height="34" rx="8" fill="var(--c-commit-soft)" stroke="var(--c-commit)" strokeWidth="1.1" />
      <text x="525" y="135" textAnchor="middle" fill="var(--tx)" fontSize="9.5" fontFamily={MONO}>Payments · gRPC</text>
      <rect x="450" y="170" width="150" height="34" rx="8" fill="var(--c-commit-soft)" stroke="var(--c-commit)" strokeWidth="1.1" />
      <text x="525" y="191" textAnchor="middle" fill="var(--tx)" fontSize="9.5" fontFamily={MONO}>Search · GraphQL</text>

      {/* ── trace rail: one trace_id from edge to last hop ────────────────── */}
      <rect x="142" y="230" width="458" height="46" rx="9" fill="var(--accent-2-soft)" stroke="var(--accent-2)" strokeWidth="1.1" strokeDasharray="5 4" />
      {/* connectors dropping from gateway / BFF / service into the rail */}
      <line x1="202" y1="202" x2="202" y2="230" stroke="var(--accent-2)" strokeWidth="1" strokeDasharray="2 3" />
      <line x1="354" y1="167" x2="354" y2="230" stroke="var(--accent-2)" strokeWidth="1" strokeDasharray="2 3" />
      <line x1="525" y1="204" x2="525" y2="230" stroke="var(--accent-2)" strokeWidth="1" strokeDasharray="2 3" />
      <circle cx="202" cy="230" r="2.6" fill="var(--accent-2)" />
      <circle cx="354" cy="230" r="2.6" fill="var(--accent-2)" />
      <circle cx="525" cy="230" r="2.6" fill="var(--accent-2)" />
      <text x="156" y="249" fill="var(--accent-2)" fontSize="9" fontFamily={MONO} fontWeight={700}>traceparent</text>
      <text x="156" y="266" fill="var(--tx2)" fontSize="8.5" fontFamily={MONO}>00-0af7651916cd43dd8448eb211c80319c-b7ad…-01</text>
      <text x="454" y="266" fill="var(--tx3)" fontSize="8" fontFamily={BODY}>{t({ en: 'same trace_id, every hop', uk: 'той самий trace_id, кожен хоп' })}</text>
    </svg>
  );
}
