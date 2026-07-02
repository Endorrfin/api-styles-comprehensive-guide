import { useLang } from '../../i18n/lang';

/*
 * soap-envelope (m7) — the SOAP message anatomy as nested boxes: the Envelope wraps an optional Header
 * (machine-processed concerns — the WS-Security block with signature/timestamp/token, addressing) and
 * the mandatory Body (the operation payload — or a structured Fault on failure). Colours: violet =
 * envelope/header machinery, cyan = business payload, danger = the Fault alternative.
 * Ref: W3C SOAP 1.2 Part 1; OASIS WS-Security 1.1.
 */

export function SoapEnvelope() {
  const { t } = useLang();

  return (
    <svg
      viewBox="0 0 720 320"
      className="fig-svg"
      role="img"
      aria-label={t({
        en: 'A SOAP envelope: the outer Envelope element contains an optional Header carrying WS-Security (signature, timestamp, token) and addressing, and a mandatory Body carrying the operation payload — or a structured Fault with code, reason and detail when the call fails.',
        uk: 'SOAP-конверт: зовнішній елемент Envelope містить опційний Header із WS-Security (підпис, timestamp, токен) та адресацією, і обовʼязковий Body з payload операції — або структурованим Fault із code, reason і detail, коли виклик падає.',
      })}
    >
      {/* Envelope */}
      <rect x="16" y="14" width="688" height="292" rx="10" fill="var(--s2)" stroke="var(--accent)" strokeWidth="1.4" />
      <text x="34" y="38" fill="var(--accent)" fontSize="12.5" fontFamily="var(--font-mono)" fontWeight="700">
        &lt;soap:Envelope&gt;
      </text>
      <text x="688" y="38" textAnchor="end" fill="var(--tx3)" fontSize="9.5" fontFamily="var(--font-body)">
        {t({ en: 'one XML document per message', uk: 'один XML-документ на повідомлення' })}
      </text>

      {/* Header */}
      <rect x="34" y="52" width="652" height="96" rx="8" fill="var(--c-storage-soft)" stroke="var(--accent)" strokeWidth="1" strokeDasharray="6 4" />
      <text x="50" y="74" fill="var(--accent)" fontSize="11.5" fontFamily="var(--font-mono)" fontWeight="700">
        &lt;soap:Header&gt;
      </text>
      <text x="686" y="74" textAnchor="end" fill="var(--tx3)" fontSize="9.5" fontFamily="var(--font-body)">
        {t({ en: 'optional · machine-processed · intermediaries may act on it', uk: 'опційний · машинно-оброблюваний · проміжні вузли можуть діяти' })}
      </text>
      {/* WS-Security block */}
      <rect x="50" y="86" width="380" height="48" rx="6" fill="var(--s3)" stroke="var(--line2)" strokeWidth="1" />
      <text x="64" y="106" fill="var(--tx)" fontSize="11" fontFamily="var(--font-mono)" fontWeight="700">
        WS-Security
      </text>
      <text x="64" y="124" fill="var(--tx3)" fontSize="10" fontFamily="var(--font-mono)">
        Signature · Timestamp · Token (X.509 / SAML)
      </text>
      <rect x="446" y="86" width="224" height="48" rx="6" fill="var(--s3)" stroke="var(--line2)" strokeWidth="1" />
      <text x="460" y="106" fill="var(--tx)" fontSize="11" fontFamily="var(--font-mono)" fontWeight="700">
        WS-Addressing
      </text>
      <text x="460" y="124" fill="var(--tx3)" fontSize="10" fontFamily="var(--font-mono)">
        MessageID · ReplyTo · Action
      </text>

      {/* Body */}
      <rect x="34" y="162" width="652" height="128" rx="8" fill="var(--accent-2-soft)" stroke="var(--accent-2)" strokeWidth="1.2" />
      <text x="50" y="184" fill="var(--accent-2)" fontSize="11.5" fontFamily="var(--font-mono)" fontWeight="700">
        &lt;soap:Body&gt;
      </text>
      <text x="686" y="184" textAnchor="end" fill="var(--tx3)" fontSize="9.5" fontFamily="var(--font-body)">
        {t({ en: 'mandatory · the business payload', uk: 'обовʼязковий · бізнес-payload' })}
      </text>
      {/* payload */}
      <rect x="50" y="196" width="380" height="80" rx="6" fill="var(--s2)" stroke="var(--accent-2)" strokeWidth="1" />
      <text x="64" y="218" fill="var(--tx)" fontSize="11" fontFamily="var(--font-mono)" fontWeight="700">
        &lt;pay:TransferFunds&gt;
      </text>
      <text x="64" y="236" fill="var(--tx2)" fontSize="10" fontFamily="var(--font-mono)">
        fromIban · toIban · amount
      </text>
      <text x="64" y="254" fill="var(--tx3)" fontSize="9.5" fontFamily="var(--font-body)">
        {t({ en: 'validated by the WSDL’s XML Schema', uk: 'валідується XML Schema з WSDL' })}
      </text>
      {/* Fault alternative */}
      <rect x="446" y="196" width="224" height="80" rx="6" fill="var(--c-danger-soft)" stroke="var(--c-danger)" strokeWidth="1" strokeDasharray="5 4" />
      <text x="460" y="218" fill="var(--c-danger)" fontSize="11" fontFamily="var(--font-mono)" fontWeight="700">
        &lt;soap:Fault&gt;
      </text>
      <text x="460" y="236" fill="var(--tx2)" fontSize="10" fontFamily="var(--font-mono)">
        Code · Reason · Detail
      </text>
      <text x="460" y="254" fill="var(--tx3)" fontSize="9.5" fontFamily="var(--font-body)">
        {t({ en: 'errors are structured XML, not HTTP statuses', uk: 'помилки — структурований XML, не статуси' })}
      </text>
    </svg>
  );
}
