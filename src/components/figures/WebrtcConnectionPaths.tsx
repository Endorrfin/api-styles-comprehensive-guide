import { useLang } from '../../i18n/lang';

/*
 * webrtc-connection-paths (m14) — the WebRTC triangle. TOP: the signaling server (yours: WS/SSE/HTTP)
 * carries ONLY SDP offers/answers + trickled ICE candidates (dashed, violet). BOTTOM: the media/data
 * path runs peer↔peer (solid, cyan) carrying SRTP media + SCTP data channels, keyed by DTLS — with the
 * TURN relay (amber, dotted) as the fallback when NAT defeats direct connectivity; TURN forwards
 * ciphertext it cannot read. A small STUN box shows address discovery. Colours match the sim: violet =
 * signaling, cyan = peer↔peer, amber = TURN. Ref: RFC 8825; MDN WebRTC connectivity.
 */

export function WebrtcConnectionPaths() {
  const { t } = useLang();

  return (
    <svg
      viewBox="0 0 720 310"
      className="fig-svg"
      role="img"
      aria-label={t({
        en: 'The WebRTC triangle: both peers talk to a signaling server (SDP and ICE candidates only), query STUN for their public address, and then send SRTP media and SCTP data directly peer-to-peer over DTLS — falling back to a TURN relay when NAT blocks the direct path.',
        uk: 'Трикутник WebRTC: обидва peers говорять із signaling-сервером (лише SDP та ICE candidates), питають STUN про свою публічну адресу, а тоді шлють SRTP-медіа та SCTP-дані напряму peer-to-peer через DTLS — з відкатом на TURN relay, коли NAT блокує прямий шлях.',
      })}
    >
      {/* ── Signaling server (top) ── */}
      <rect x="272" y="14" width="176" height="44" rx="8" fill="var(--c-storage-soft)" stroke="var(--accent)" strokeWidth="1.2" />
      <text x="360" y="32" textAnchor="middle" fill="var(--tx)" fontSize="12" fontFamily="var(--font-mono)" fontWeight="700">
        {t({ en: 'signaling server', uk: 'signaling-сервер' })}
      </text>
      <text x="360" y="48" textAnchor="middle" fill="var(--tx3)" fontSize="9.5" fontFamily="var(--font-body)">
        {t({ en: 'YOURS — WS / SSE / HTTP', uk: 'ТВІЙ — WS / SSE / HTTP' })}
      </text>

      {/* signaling legs (dashed violet) */}
      <line x1="100" y1="208" x2="292" y2="60" stroke="var(--accent)" strokeWidth="1.6" strokeDasharray="6 5" />
      <line x1="620" y1="208" x2="428" y2="60" stroke="var(--accent)" strokeWidth="1.6" strokeDasharray="6 5" />
      {/* both legs carry the same payloads — label them identically */}
      <text x="158" y="122" textAnchor="middle" fill="var(--accent)" fontSize="10.5" fontFamily="var(--font-mono)" transform="rotate(-37 158 122)">
        ⇄ SDP · ICE candidates
      </text>
      <text x="566" y="124" textAnchor="middle" fill="var(--accent)" fontSize="10.5" fontFamily="var(--font-mono)" transform="rotate(37 566 124)">
        ⇄ SDP · ICE candidates
      </text>

      {/* ── STUN (address discovery) ── */}
      <rect x="318" y="96" width="84" height="34" rx="7" fill="var(--s2)" stroke="var(--line2)" strokeWidth="1" />
      <text x="360" y="111" textAnchor="middle" fill="var(--tx2)" fontSize="10.5" fontFamily="var(--font-mono)" fontWeight="700">
        STUN
      </text>
      <text x="360" y="124" textAnchor="middle" fill="var(--tx3)" fontSize="8.5" fontFamily="var(--font-body)">
        {t({ en: '“what’s my address?”', uk: '«яка моя адреса?»' })}
      </text>
      <line x1="128" y1="212" x2="316" y2="118" stroke="var(--tx3)" strokeWidth="1" strokeDasharray="2 4" opacity="0.7" />
      <line x1="592" y1="212" x2="404" y2="118" stroke="var(--tx3)" strokeWidth="1" strokeDasharray="2 4" opacity="0.7" />

      {/* ── Peers (bottom corners) ── */}
      <rect x="24" y="208" width="128" height="48" rx="8" fill="var(--accent-2-soft)" stroke="var(--accent-2)" strokeWidth="1.2" />
      <text x="88" y="228" textAnchor="middle" fill="var(--tx)" fontSize="12.5" fontFamily="var(--font-mono)" fontWeight="700">
        Peer A
      </text>
      <text x="88" y="244" textAnchor="middle" fill="var(--tx3)" fontSize="9" fontFamily="var(--font-body)">
        {t({ en: 'browser · behind NAT', uk: 'браузер · за NAT' })}
      </text>
      <rect x="568" y="208" width="128" height="48" rx="8" fill="var(--accent-2-soft)" stroke="var(--accent-2)" strokeWidth="1.2" />
      <text x="632" y="228" textAnchor="middle" fill="var(--tx)" fontSize="12.5" fontFamily="var(--font-mono)" fontWeight="700">
        Peer B
      </text>
      <text x="632" y="244" textAnchor="middle" fill="var(--tx3)" fontSize="9" fontFamily="var(--font-body)">
        {t({ en: 'browser · behind NAT', uk: 'браузер · за NAT' })}
      </text>

      {/* ── Direct P2P path (solid cyan) ── */}
      <line x1="152" y1="224" x2="568" y2="224" stroke="var(--accent-2)" strokeWidth="2.4" />
      <text x="360" y="216" textAnchor="middle" fill="var(--accent-2)" fontSize="11" fontFamily="var(--font-mono)" fontWeight="700">
        ⇄ SRTP {t({ en: 'media', uk: 'медіа' })} · SCTP data — DTLS
      </text>

      {/* ── TURN fallback (dotted amber) ── */}
      <rect x="320" y="258" width="80" height="34" rx="7" fill="var(--c-analytics-soft)" stroke="var(--c-analytics)" strokeWidth="1.2" />
      <text x="360" y="273" textAnchor="middle" fill="var(--c-analytics)" fontSize="10.5" fontFamily="var(--font-mono)" fontWeight="700">
        TURN
      </text>
      <text x="360" y="286" textAnchor="middle" fill="var(--tx3)" fontSize="8.5" fontFamily="var(--font-body)">
        relay
      </text>
      <line x1="132" y1="256" x2="318" y2="272" stroke="var(--c-analytics)" strokeWidth="1.4" strokeDasharray="2 4" />
      <line x1="402" y1="272" x2="588" y2="256" stroke="var(--c-analytics)" strokeWidth="1.4" strokeDasharray="2 4" />
      <text x="222" y="284" textAnchor="middle" fill="var(--c-analytics)" fontSize="9.5" fontFamily="var(--font-body)">
        {t({ en: 'fallback when NAT blocks P2P', uk: 'відкат, коли NAT блокує P2P' })}
      </text>
      <text x="498" y="284" textAnchor="middle" fill="var(--c-analytics)" fontSize="9.5" fontFamily="var(--font-body)">
        {t({ en: 'forwards ciphertext it can’t read', uk: 'пересилає шифротекст, який не читає' })}
      </text>
    </svg>
  );
}
