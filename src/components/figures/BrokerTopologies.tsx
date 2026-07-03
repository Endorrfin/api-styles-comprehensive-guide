import { useLang } from '../../i18n/lang';

/*
 * broker-topologies (m16) — the three shapes async messaging takes, side by side:
 *   1. point-to-point synchronous request/response (REST/gRPC) — the caller waits;
 *   2. a queue whose messages are SHARED across competing consumers (AMQP / RabbitMQ) —
 *      each message goes to exactly one consumer;
 *   3. a retained, replayable LOG read independently by many consumer groups (Kafka) —
 *      each group tracks its own offset, messages are not deleted on read.
 * Role names (Producer/Consumer/Client/Server) and broker names stay English in both locales (they are
 * the smoke canaries). Colours: violet = sync path, cyan = queue/broker, amber = the log.
 * Ref: RabbitMQ AMQP 0-9-1 concepts; Apache Kafka design (partitions, consumer groups, offsets).
 */

const BODY = 'var(--font-body)';
const MONO = 'var(--font-mono)';

export function BrokerTopologies() {
  const { t } = useLang();

  return (
    <svg
      viewBox="0 0 720 232"
      className="fig-svg"
      role="img"
      aria-label={t({
        en: 'Three messaging topologies. Left: a synchronous point-to-point call — a client sends a request to a server and blocks for the response (REST, gRPC). Middle: a queue where a producer publishes messages that are shared one-each across competing consumers C1, C2, C3 (AMQP, RabbitMQ). Right: a retained append-only log where a producer appends messages and two consumer groups read independently, each tracking its own offset and able to replay (Kafka).',
        uk: 'Три топології обміну повідомленнями. Ліворуч: синхронний point-to-point виклик — клієнт шле запит серверу й блокується на відповідь (REST, gRPC). Посередині: черга, де producer публікує повідомлення, що діляться по одному між конкуруючими consumer-ами C1, C2, C3 (AMQP, RabbitMQ). Праворуч: збережений append-only лог, де producer дописує повідомлення, а дві consumer-групи читають незалежно, кожна відстежує свій offset і може реплеїти (Kafka).',
      })}
    >
      {/* panel separators */}
      <line x1="245" y1="16" x2="245" y2="208" stroke="var(--line2)" strokeWidth="1" strokeDasharray="4 5" />
      <line x1="481" y1="16" x2="481" y2="208" stroke="var(--line2)" strokeWidth="1" strokeDasharray="4 5" />

      {/* ─────────── Panel 1 · Point-to-point (sync) ─────────── */}
      <text x="16" y="28" fill="var(--accent)" fontSize="12" fontFamily={MONO} fontWeight={700}>
        {t({ en: 'Point-to-point', uk: 'Point-to-point' })}
      </text>
      <text x="16" y="44" fill="var(--tx3)" fontSize="9.5" fontFamily={BODY}>
        {t({ en: 'REST · gRPC — synchronous', uk: 'REST · gRPC — синхронний' })}
      </text>

      <rect x="71" y="66" width="110" height="32" rx="7" fill="var(--c-storage-soft)" stroke="var(--accent)" strokeWidth="1.2" />
      <text x="126" y="86" textAnchor="middle" fill="var(--tx)" fontSize="11" fontFamily={MONO} fontWeight={700}>Client</text>
      <rect x="71" y="150" width="110" height="32" rx="7" fill="var(--c-storage-soft)" stroke="var(--accent)" strokeWidth="1.2" />
      <text x="126" y="170" textAnchor="middle" fill="var(--tx)" fontSize="11" fontFamily={MONO} fontWeight={700}>Server</text>

      {/* request down (solid), response up (dashed) */}
      <line x1="110" y1="98" x2="110" y2="148" stroke="var(--accent)" strokeWidth="1.6" />
      <polygon points="110,150 105,140 115,140" fill="var(--accent)" />
      <text x="104" y="126" textAnchor="end" fill="var(--tx2)" fontSize="9" fontFamily={BODY}>{t({ en: 'request', uk: 'запит' })}</text>
      <line x1="144" y1="148" x2="144" y2="100" stroke="var(--tx3)" strokeWidth="1.3" strokeDasharray="4 3" />
      <polygon points="144,98 139,108 149,108" fill="var(--tx3)" />
      <text x="150" y="126" fill="var(--tx3)" fontSize="9" fontFamily={BODY}>{t({ en: 'response', uk: 'відповідь' })}</text>

      <text x="126" y="202" textAnchor="middle" fill="var(--tx3)" fontSize="9.5" fontFamily={BODY}>
        {t({ en: 'the caller blocks for the answer', uk: 'викликач блокується на відповідь' })}
      </text>

      {/* ─────────── Panel 2 · Queue (competing consumers) ─────────── */}
      <text x="261" y="28" fill="var(--accent-2)" fontSize="12" fontFamily={MONO} fontWeight={700}>
        {t({ en: 'Queue', uk: 'Queue' })}
      </text>
      <text x="261" y="44" fill="var(--tx3)" fontSize="9.5" fontFamily={BODY}>AMQP · RabbitMQ</text>

      <rect x="313" y="60" width="102" height="28" rx="7" fill="var(--accent-2-soft)" stroke="var(--accent-2)" strokeWidth="1.2" />
      <text x="364" y="79" textAnchor="middle" fill="var(--tx)" fontSize="10.5" fontFamily={MONO} fontWeight={700}>Producer</text>
      <line x1="364" y1="88" x2="364" y2="110" stroke="var(--accent-2)" strokeWidth="1.5" />
      <polygon points="364,112 359,102 369,102" fill="var(--accent-2)" />
      <text x="372" y="103" fill="var(--tx3)" fontSize="8" fontFamily={BODY}>{t({ en: 'via exchange', uk: 'via exchange' })}</text>

      {/* the queue with three distinct messages */}
      <rect x="300" y="112" width="128" height="26" rx="6" fill="var(--s2)" stroke="var(--accent-2)" strokeWidth="1.2" />
      <rect x="312" y="118" width="13" height="13" rx="2" fill="var(--accent)" />
      <rect x="340" y="118" width="13" height="13" rx="2" fill="var(--accent-2)" />
      <rect x="368" y="118" width="13" height="13" rx="2" fill="var(--c-analytics)" />
      <text x="418" y="128" textAnchor="middle" fill="var(--tx3)" fontSize="9" fontFamily={BODY}>queue</text>

      {/* three competing consumers, each gets ONE message */}
      <rect x="298" y="168" width="52" height="26" rx="6" fill="var(--s3)" stroke="var(--line2)" strokeWidth="1" />
      <text x="324" y="185" textAnchor="middle" fill="var(--tx)" fontSize="10" fontFamily={MONO} fontWeight={700}>C1</text>
      <rect x="358" y="168" width="52" height="26" rx="6" fill="var(--s3)" stroke="var(--line2)" strokeWidth="1" />
      <text x="384" y="185" textAnchor="middle" fill="var(--tx)" fontSize="10" fontFamily={MONO} fontWeight={700}>C2</text>
      <rect x="418" y="168" width="52" height="26" rx="6" fill="var(--s3)" stroke="var(--line2)" strokeWidth="1" />
      <text x="444" y="185" textAnchor="middle" fill="var(--tx)" fontSize="10" fontFamily={MONO} fontWeight={700}>C3</text>

      <line x1="330" y1="138" x2="324" y2="166" stroke="var(--accent)" strokeWidth="1.4" />
      <polygon points="324,168 320,159 329,160" fill="var(--accent)" />
      <line x1="368" y1="138" x2="384" y2="166" stroke="var(--accent-2)" strokeWidth="1.4" />
      <polygon points="384,168 380,159 389,160" fill="var(--accent-2)" />
      <line x1="400" y1="138" x2="440" y2="166" stroke="var(--c-analytics)" strokeWidth="1.4" />
      <polygon points="444,168 435,161 442,155" fill="var(--c-analytics)" />

      <text x="364" y="212" textAnchor="middle" fill="var(--tx3)" fontSize="9" fontFamily={BODY}>
        {t({ en: 'each message → exactly one consumer', uk: 'кожне повідомлення → рівно один consumer' })}
      </text>

      {/* ─────────── Panel 3 · Log (replayable, many groups) ─────────── */}
      <text x="497" y="28" fill="var(--c-analytics)" fontSize="12" fontFamily={MONO} fontWeight={700}>
        {t({ en: 'Log', uk: 'Log' })}
      </text>
      <text x="497" y="44" fill="var(--tx3)" fontSize="9.5" fontFamily={BODY}>Kafka</text>

      <rect x="546" y="58" width="100" height="26" rx="7" fill="var(--c-analytics-soft)" stroke="var(--c-analytics)" strokeWidth="1.2" />
      <text x="596" y="76" textAnchor="middle" fill="var(--tx)" fontSize="10.5" fontFamily={MONO} fontWeight={700}>Producer</text>
      <text x="700" y="104" textAnchor="end" fill="var(--tx3)" fontSize="9" fontFamily={BODY}>{t({ en: 'append →', uk: 'append →' })}</text>
      <line x1="596" y1="84" x2="596" y2="106" stroke="var(--c-analytics)" strokeWidth="1.5" />
      <polygon points="596,108 591,98 601,98" fill="var(--c-analytics)" />

      {/* the log: six offset cells, retained */}
      <rect x="497" y="108" width="204" height="30" rx="6" fill="var(--s2)" stroke="var(--c-analytics)" strokeWidth="1.2" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <rect x={501 + i * 33} y={112} width="29" height="22" rx="3" fill={i < 5 ? 'var(--s3)' : 'var(--c-analytics-soft)'} stroke="var(--line2)" strokeWidth="0.8" />
          <text x={515 + i * 33} y={127} textAnchor="middle" fill="var(--tx3)" fontSize="9" fontFamily={MONO}>{i}</text>
        </g>
      ))}

      {/* two consumer groups reading at their own offsets */}
      {/* Group B cursor at offset 1, Group A cursor at offset 5 */}
      <polygon points="548,140 543,150 553,150" fill="var(--c-query)" />
      <polygon points="680,140 675,150 685,150" fill="var(--c-commit)" />
      <rect x="497" y="168" width="96" height="26" rx="6" fill="var(--s2)" stroke="var(--c-query)" strokeWidth="1.1" />
      <text x="545" y="185" textAnchor="middle" fill="var(--tx)" fontSize="9.5" fontFamily={MONO} fontWeight={700}>Group B · off 1</text>
      <rect x="605" y="168" width="96" height="26" rx="6" fill="var(--s2)" stroke="var(--c-commit)" strokeWidth="1.1" />
      <text x="653" y="185" textAnchor="middle" fill="var(--tx)" fontSize="9.5" fontFamily={MONO} fontWeight={700}>Group A · off 5</text>
      <line x1="548" y1="150" x2="545" y2="168" stroke="var(--c-query)" strokeWidth="1.2" strokeDasharray="3 2" />
      <line x1="680" y1="150" x2="653" y2="168" stroke="var(--c-commit)" strokeWidth="1.2" strokeDasharray="3 2" />

      <text x="595" y="212" textAnchor="middle" fill="var(--tx3)" fontSize="9" fontFamily={BODY}>
        {t({ en: 'retained · each group its own offset · replayable', uk: 'збережено · кожна група свій offset · replay' })}
      </text>
    </svg>
  );
}
