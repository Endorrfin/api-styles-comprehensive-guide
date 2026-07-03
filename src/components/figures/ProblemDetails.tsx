import { useLang } from '../../i18n/lang';

/*
 * problem-details (m19) — an RFC 9457 application/problem+json error body, annotated, then mapped to the
 * same logical error in gRPC and GraphQL. Left: the JSON with type/status/detail/errors called out by
 * colour (type = branch-on-this key). Bottom: one error, three channels (REST problem+json · gRPC
 * grpc-status + details · GraphQL errors[].extensions.code). "application/problem+json", "grpc-status"
 * and "INVALID_ARGUMENT" stay English in both locales (canaries). Colours: violet = type, red = status,
 * amber = detail, cyan = errors extension.
 */

const BODY = 'var(--font-body)';
const MONO = 'var(--font-mono)';

export function ProblemDetails() {
  const { t } = useLang();

  return (
    <svg
      viewBox="0 0 720 336"
      className="fig-svg"
      role="img"
      aria-label={t({
        en: 'An RFC 9457 application/problem+json error body for a 422 response. Members: type is a URI naming the problem kind and is the stable key clients branch on; title is a short human summary; status echoes 422; detail explains this occurrence; instance identifies this occurrence; and an errors array is an extension member listing field violations. Below, the same logical error mapped to three styles: REST uses application/problem+json with a type; gRPC uses a grpc-status code 3 INVALID_ARGUMENT plus google.rpc.Status details; GraphQL returns 200 with an errors array carrying extensions.code.',
        uk: 'Тіло помилки RFC 9457 application/problem+json для відповіді 422. Члени: type — це URI, що називає вид проблеми, і стабільний ключ, на який розгалужуються клієнти; title — короткий людський підсумок; status дублює 422; detail пояснює цей випадок; instance ідентифікує цей випадок; а масив errors — extension-член зі списком порушень полів. Нижче та сама логічна помилка змапована на три стилі: REST використовує application/problem+json з type; gRPC використовує код grpc-status 3 INVALID_ARGUMENT плюс деталі google.rpc.Status; GraphQL повертає 200 з масивом errors, що несе extensions.code.',
      })}
    >
      {/* ── the problem+json body ── */}
      <rect x={20} y={16} width={452} height={218} rx={8} fill="var(--s2)" stroke="var(--line2)" strokeWidth={1} />
      <rect x={20} y={16} width={4} height={218} rx={2} fill="var(--c-danger)" />

      <text x={38} y={42} fontSize={12.5} fontFamily={MONO} fill="var(--c-danger)" fontWeight={700}>422</text>
      <text x={72} y={42} fontSize={12.5} fontFamily={MONO} fill="var(--tx2)">Unprocessable Content</text>
      <text x={38} y={60} fontSize={10} fontFamily={MONO} fill="var(--tx3)">Content-Type: application/problem+json</text>

      {/* body — key column x=50, value column x=134 (positioned segments, no inline tspan flow) */}
      <text x={38} y={84} fontSize={11} fontFamily={MONO} fill="var(--tx2)">{'{'}</text>

      <text x={50} y={104} fontSize={11} fontFamily={MONO} fill="var(--accent)" fontWeight={700}>&quot;type&quot;:</text>
      <text x={134} y={104} fontSize={11} fontFamily={MONO} fill="var(--tx)">&quot;/problems/invalid-amount&quot;,</text>

      <text x={50} y={123} fontSize={11} fontFamily={MONO} fill="var(--tx2)">&quot;title&quot;:</text>
      <text x={134} y={123} fontSize={11} fontFamily={MONO} fill="var(--tx3)">&quot;Invalid amount&quot;,</text>

      <text x={50} y={142} fontSize={11} fontFamily={MONO} fill="var(--tx2)">&quot;status&quot;:</text>
      <text x={134} y={142} fontSize={11} fontFamily={MONO} fill="var(--c-danger)" fontWeight={700}>422,</text>

      <text x={50} y={161} fontSize={11} fontFamily={MONO} fill="var(--tx2)">&quot;detail&quot;:</text>
      <text x={134} y={161} fontSize={11} fontFamily={MONO} fill="var(--c-analytics)">&quot;amount must be &gt; 0&quot;,</text>

      <text x={50} y={180} fontSize={11} fontFamily={MONO} fill="var(--tx2)">&quot;instance&quot;:</text>
      <text x={134} y={180} fontSize={11} fontFamily={MONO} fill="var(--tx3)">&quot;/payments/6f1a&quot;,</text>

      <text x={50} y={199} fontSize={11} fontFamily={MONO} fill="var(--accent-2)" fontWeight={700}>&quot;errors&quot;:</text>
      <text x={134} y={199} fontSize={11} fontFamily={MONO} fill="var(--tx2)">{'[{ "field": "amount" }]'}</text>

      <text x={38} y={219} fontSize={11} fontFamily={MONO} fill="var(--tx2)">{'}'}</text>

      {/* ── annotations (colour-keyed to the body) ── */}
      {[
        { y: 104, c: 'var(--accent)', text: { en: 'type — the key you branch on', uk: 'type — ключ для розгалуження' } },
        { y: 142, c: 'var(--c-danger)', text: { en: 'status — echoes the HTTP code', uk: 'status — дублює HTTP-код' } },
        { y: 161, c: 'var(--c-analytics)', text: { en: 'detail — human, this occurrence', uk: 'detail — людське, цей випадок' } },
        { y: 199, c: 'var(--accent-2)', text: { en: 'errors[] — extension member', uk: 'errors[] — extension-член' } },
      ].map((a) => (
        <g key={a.y}>
          <line x1={476} y1={a.y - 4} x2={490} y2={a.y - 4} stroke={a.c} strokeWidth={1.2} />
          <circle cx={496} cy={a.y - 4} r={3} fill={a.c} />
          <text x={504} y={a.y - 1} fontSize={9} fontFamily={BODY} fill="var(--tx2)">{t(a.text)}</text>
        </g>
      ))}

      {/* ── the same error, three channels ── */}
      <text x={20} y={258} fontSize={10.5} fontFamily={BODY} fill="var(--tx2)" fontWeight={600}>
        {t({ en: 'The same error, three channels', uk: 'Та сама помилка, три канали' })}
      </text>

      {[
        { x: 20, label: 'REST', color: 'var(--accent)', l2: 'application/problem+json', l3: { en: '→ branch on type', uk: '→ розгалуження на type' } },
        { x: 250, label: 'gRPC', color: 'var(--accent-2)', l2: 'grpc-status: 3', l3: { en: 'INVALID_ARGUMENT + details', uk: 'INVALID_ARGUMENT + details' } },
        { x: 480, label: 'GraphQL', color: 'var(--c-analytics)', l2: '200 · errors[]', l3: { en: 'extensions.code', uk: 'extensions.code' } },
      ].map((c) => (
        <g key={c.label}>
          <rect x={c.x} y={268} width={220} height={58} rx={8} fill="var(--s2)" stroke="var(--line2)" strokeWidth={1} />
          <rect x={c.x} y={268} width={4} height={58} rx={2} fill={c.color} />
          <text x={c.x + 16} y={288} fontSize={11} fontFamily={MONO} fontWeight={700} fill={c.color}>{c.label}</text>
          <text x={c.x + 16} y={306} fontSize={10} fontFamily={MONO} fill="var(--tx)">{c.l2}</text>
          <text x={c.x + 16} y={320} fontSize={9} fontFamily={BODY} fill="var(--tx3)">{t(c.l3)}</text>
        </g>
      ))}
    </svg>
  );
}
