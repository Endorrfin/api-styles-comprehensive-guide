import { useLang } from '../../i18n/lang';

/*
 * outbox-saga (m21) — two panels, one discipline:
 *   1. LEFT · the dual-write bug (db commit lands, broker publish is lost — two systems, two failures)
 *      vs the transactional outbox: business row + event row in ONE local transaction; a relay
 *      (poller/CDC) publishes from the table at-least-once → the consumer dedups by event id.
 *   2. RIGHT · a saga: local transactions chained forward by events (create → charge → reserve);
 *      when a step fails, COMPENSATING actions run backwards (release → refund → cancel).
 * Technical tokens (outbox, Relay, compensation, PENDING, tx) stay English in both locales — they are
 * the smoke canaries. Colours: violet = service/tx, cyan = relay/broker, green = the atomic commit,
 * danger = the lost publish / the failing step / compensations.
 * Ref: microservices.io — transactional-outbox, saga (Richardson).
 */

const BODY = 'var(--font-body)';
const MONO = 'var(--font-mono)';

export function OutboxSaga() {
  const { t } = useLang();

  return (
    <svg
      viewBox="0 0 720 312"
      className="fig-svg"
      role="img"
      aria-label={t({
        en: 'Left panel: the dual-write bug — a service commits to its database but the separate publish to the broker is lost; below it, the transactional outbox — the business row and the event row commit in one transaction, and a relay publishes from the outbox table to the broker at-least-once. Right panel: a saga — order, payment and inventory services chained by events; when the inventory step fails, compensating actions run backwards: refund the charge, cancel the order.',
        uk: 'Ліва панель: баг dual-write — сервіс комітить у свою базу, але окремий publish у broker губиться; нижче — transactional outbox: бізнес-рядок і рядок події комітяться в одній транзакції, а relay публікує з таблиці outbox у broker at-least-once. Права панель: saga — сервіси order, payment та inventory, зчеплені подіями; коли крок inventory падає, компенсувальні дії біжать назад: повернути списання, скасувати замовлення.',
      })}
    >
      {/* panel separator */}
      <line x1="372" y1="16" x2="372" y2="296" stroke="var(--line2)" strokeWidth="1" strokeDasharray="4 5" />

      {/* ─────────── Panel 1 · dual write vs outbox ─────────── */}
      <text x="14" y="26" fill="var(--accent)" fontSize="12" fontFamily={MONO} fontWeight={700}>
        {t({ en: 'Write + publish', uk: 'Запис + публікація' })}
      </text>

      {/* — the bug — */}
      <text x="14" y="48" fill="var(--c-danger)" fontSize="9.5" fontFamily={BODY} fontWeight={700}>
        {t({ en: 'dual write — two systems, two failures', uk: 'dual write — дві системи, дві відмови' })}
      </text>
      <rect x="14" y="56" width="84" height="26" rx="6" fill="var(--c-storage-soft)" stroke="var(--accent)" strokeWidth="1.2" />
      <text x="56" y="73" textAnchor="middle" fill="var(--tx)" fontSize="10" fontFamily={MONO} fontWeight={700}>Service</text>
      {/* commit lands */}
      <line x1="98" y1="63" x2="168" y2="63" stroke="var(--c-commit)" strokeWidth="1.5" />
      <polygon points="170,63 160,58 160,68" fill="var(--c-commit)" />
      <rect x="172" y="50" width="64" height="26" rx="6" fill="var(--s2)" stroke="var(--c-commit)" strokeWidth="1.2" />
      <text x="204" y="67" textAnchor="middle" fill="var(--tx)" fontSize="10" fontFamily={MONO}>DB ✓</text>
      {/* publish lost */}
      <line x1="98" y1="76" x2="168" y2="90" stroke="var(--c-danger)" strokeWidth="1.4" strokeDasharray="5 4" />
      <text x="180" y="95" fill="var(--c-danger)" fontSize="11" fontFamily={MONO} fontWeight={700}>✕</text>
      <rect x="192" y="80" width="64" height="26" rx="6" fill="var(--s2)" stroke="var(--line2)" strokeWidth="1" />
      <text x="224" y="97" textAnchor="middle" fill="var(--tx3)" fontSize="10" fontFamily={MONO}>Broker</text>
      <text x="262" y="72" fill="var(--tx3)" fontSize="8.5" fontFamily={BODY}>{t({ en: 'commit lands…', uk: 'commit є…' })}</text>
      <text x="262" y="97" fill="var(--c-danger)" fontSize="8.5" fontFamily={BODY}>{t({ en: '…publish lost', uk: '…publish загубено' })}</text>

      {/* — the outbox — */}
      <text x="14" y="122" fill="var(--c-commit)" fontSize="9.5" fontFamily={BODY} fontWeight={700}>
        {t({ en: 'transactional outbox — ONE commit', uk: 'transactional outbox — ОДИН commit' })}
      </text>
      <rect x="14" y="146" width="84" height="26" rx="6" fill="var(--c-storage-soft)" stroke="var(--accent)" strokeWidth="1.2" />
      <text x="56" y="163" textAnchor="middle" fill="var(--tx)" fontSize="10" fontFamily={MONO} fontWeight={700}>Service</text>
      <line x1="98" y1="159" x2="136" y2="159" stroke="var(--accent)" strokeWidth="1.5" />
      <polygon points="138,159 128,154 128,164" fill="var(--accent)" />

      {/* one DB, two rows, one tx boundary */}
      <rect x="140" y="128" width="150" height="76" rx="8" fill="var(--s2)" stroke="var(--c-commit)" strokeWidth="1.5" />
      <text x="215" y="143" textAnchor="middle" fill="var(--c-commit)" fontSize="8.5" fontFamily={MONO} fontWeight={700}>
        {t({ en: 'one local tx', uk: 'одна локальна tx' })}
      </text>
      <rect x="150" y="150" width="130" height="20" rx="4" fill="var(--c-storage-soft)" stroke="var(--accent)" strokeWidth="1" />
      <text x="215" y="164" textAnchor="middle" fill="var(--tx)" fontSize="9" fontFamily={MONO}>orders · #4217</text>
      <rect x="150" y="176" width="130" height="20" rx="4" fill="var(--accent-2-soft)" stroke="var(--accent-2)" strokeWidth="1" />
      <text x="215" y="190" textAnchor="middle" fill="var(--tx)" fontSize="9" fontFamily={MONO}>outbox · evt_91</text>

      {/* the relay */}
      <line x1="290" y1="186" x2="322" y2="186" stroke="var(--accent-2)" strokeWidth="1.5" />
      <polygon points="324,186 314,181 314,191" fill="var(--accent-2)" />
      <rect x="326" y="173" width="40" height="26" rx="6" fill="var(--accent-2-soft)" stroke="var(--accent-2)" strokeWidth="1.2" />
      <text x="346" y="190" textAnchor="middle" fill="var(--tx)" fontSize="9" fontFamily={MONO}>Relay</text>
      <line x1="346" y1="199" x2="346" y2="234" stroke="var(--accent-2)" strokeWidth="1.5" />
      <polygon points="346,236 341,226 351,226" fill="var(--accent-2)" />
      <rect x="306" y="238" width="60" height="24" rx="6" fill="var(--s2)" stroke="var(--accent-2)" strokeWidth="1.2" />
      <text x="336" y="254" textAnchor="middle" fill="var(--tx)" fontSize="9.5" fontFamily={MONO}>Broker</text>
      <text x="14" y="230" fill="var(--tx3)" fontSize="8.5" fontFamily={BODY}>
        {t({ en: 'poller / CDC · at-least-once →', uk: 'poller / CDC · at-least-once →' })}
      </text>
      <text x="14" y="244" fill="var(--tx3)" fontSize="8.5" fontFamily={BODY}>
        {t({ en: 'consumer dedups by evt id', uk: 'consumer дедуплікує за evt id' })}
      </text>

      {/* ─────────── Panel 2 · the saga ─────────── */}
      <text x="388" y="26" fill="var(--accent)" fontSize="12" fontFamily={MONO} fontWeight={700}>
        {t({ en: 'Saga — local tx + compensation', uk: 'Saga — локальні tx + compensation' })}
      </text>

      {/* three services */}
      <rect x="388" y="56" width="94" height="30" rx="7" fill="var(--c-storage-soft)" stroke="var(--accent)" strokeWidth="1.2" />
      <text x="435" y="75" textAnchor="middle" fill="var(--tx)" fontSize="10" fontFamily={MONO} fontWeight={700}>Order</text>
      <rect x="502" y="56" width="94" height="30" rx="7" fill="var(--c-storage-soft)" stroke="var(--accent)" strokeWidth="1.2" />
      <text x="549" y="75" textAnchor="middle" fill="var(--tx)" fontSize="10" fontFamily={MONO} fontWeight={700}>Payment</text>
      <rect x="616" y="56" width="94" height="30" rx="7" fill="var(--s2)" stroke="var(--c-danger)" strokeWidth="1.4" />
      <text x="663" y="75" textAnchor="middle" fill="var(--c-danger)" fontSize="10" fontFamily={MONO} fontWeight={700}>Inventory ✕</text>

      {/* forward chain */}
      <line x1="482" y1="66" x2="498" y2="66" stroke="var(--accent-2)" strokeWidth="1.5" />
      <polygon points="500,66 490,61 490,71" fill="var(--accent-2)" />
      <line x1="596" y1="66" x2="612" y2="66" stroke="var(--accent-2)" strokeWidth="1.5" />
      <polygon points="614,66 604,61 604,71" fill="var(--accent-2)" />
      <text x="435" y="46" textAnchor="middle" fill="var(--tx3)" fontSize="8.5" fontFamily={MONO}>1 create · PENDING</text>
      <text x="549" y="46" textAnchor="middle" fill="var(--tx3)" fontSize="8.5" fontFamily={MONO}>2 charge</text>
      <text x="663" y="46" textAnchor="middle" fill="var(--c-danger)" fontSize="8.5" fontFamily={MONO}>3 reserve — fails</text>

      {/* each step = local tx + its own outbox (two lines — the single line overflowed the viewBox) */}
      <text x="388" y="104" fill="var(--tx3)" fontSize="8.5" fontFamily={BODY}>
        {t({
          en: 'each step = a local tx publishing via its own outbox;',
          uk: 'кожен крок = локальна tx, що публікує через власний outbox;',
        })}
      </text>
      <text x="388" y="116" fill="var(--tx3)" fontSize="8.5" fontFamily={BODY}>
        {t({
          en: 'every step & compensation must be idempotent',
          uk: 'кожен крок і compensation мусять бути idempotent',
        })}
      </text>

      {/* compensation chain, backwards */}
      <line x1="616" y1="144" x2="600" y2="144" stroke="var(--c-danger)" strokeWidth="1.4" strokeDasharray="5 4" />
      <polygon points="598,144 608,139 608,149" fill="var(--c-danger)" />
      <line x1="502" y1="144" x2="496" y2="144" stroke="var(--c-danger)" strokeWidth="1.4" strokeDasharray="5 4" />
      <polygon points="494,144 504,139 504,149" fill="var(--c-danger)" />
      <rect x="502" y="132" width="94" height="24" rx="6" fill="var(--c-danger-soft)" stroke="var(--c-danger)" strokeWidth="1" />
      <text x="549" y="148" textAnchor="middle" fill="var(--c-danger)" fontSize="9" fontFamily={MONO}>refund</text>
      <rect x="388" y="132" width="104" height="24" rx="6" fill="var(--c-danger-soft)" stroke="var(--c-danger)" strokeWidth="1" />
      <text x="440" y="147" textAnchor="middle" fill="var(--c-danger)" fontSize="8.5" fontFamily={MONO}>cancel · COMPENSATED</text>
      <text x="660" y="164" textAnchor="middle" fill="var(--tx3)" fontSize="8.5" fontFamily={BODY}>
        {t({ en: 'compensation runs back', uk: 'compensation біжить назад' })}
      </text>

      {/* choreography vs orchestration footnote */}
      <line x1="388" y1="168" x2="710" y2="168" stroke="var(--line2)" strokeWidth="1" strokeDasharray="2 4" />
      <text x="388" y="188" fill="var(--tx2)" fontSize="9" fontFamily={BODY} fontWeight={700}>
        {t({ en: 'choreography', uk: 'choreography' })}
      </text>
      <text x="388" y="202" fill="var(--tx3)" fontSize="8.5" fontFamily={BODY}>
        {t({ en: 'services react to events — no coordinator,', uk: 'сервіси реагують на події — без' })}
      </text>
      <text x="388" y="214" fill="var(--tx3)" fontSize="8.5" fontFamily={BODY}>
        {t({ en: 'the workflow is emergent', uk: 'координатора, workflow емерджентний' })}
      </text>
      <text x="556" y="188" fill="var(--tx2)" fontSize="9" fontFamily={BODY} fontWeight={700}>
        {t({ en: 'orchestration', uk: 'orchestration' })}
      </text>
      <text x="556" y="202" fill="var(--tx3)" fontSize="8.5" fontFamily={BODY}>
        {t({ en: 'a coordinator drives steps & state —', uk: 'координатор веде кроки і стан —' })}
      </text>
      <text x="556" y="214" fill="var(--tx3)" fontSize="8.5" fontFamily={BODY}>
        {t({ en: 'ask it where #4217 is stuck', uk: 'спитай його, де застряг #4217' })}
      </text>

      {/* bottom takeaway */}
      <text x="388" y="252" fill="var(--tx2)" fontSize="9" fontFamily={BODY}>
        {t({
          en: '“all or nothing” becomes eventual: PENDING until',
          uk: '«все або нічого» стає eventual: PENDING, доки',
        })}
      </text>
      <text x="388" y="266" fill="var(--tx2)" fontSize="9" fontFamily={BODY}>
        {t({
          en: 'the chain confirms — or compensations apologize',
          uk: 'ланцюг не підтвердиться — або compensations вибачаться',
        })}
      </text>
    </svg>
  );
}
