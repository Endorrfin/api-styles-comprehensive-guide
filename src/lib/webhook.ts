/*
 * webhook.ts — pure, deterministic engine for the `webhook-delivery` signature sim (CLAUDE.md §6, m15).
 * No React, no DOM, no randomness, no real HTTP — so scripts/test-webhook.ts can assert each scenario's
 * script exactly and the component (WebhookDeliverySim) is a thin renderer over it.
 *
 * The model: one event's delivery life on a stepped clock, in three deterministic endpoint scenarios,
 * with a consumer-side idempotency (dedup) switch:
 *   - 'healthy' — first attempt verifies, processes, acks 200;
 *   - 'flaky'   — attempt 1 fails (500); attempt 2 processes but the ACK IS LOST (timeout), so the
 *                 provider MUST retry (at-least-once!); attempt 3 re-delivers the same webhook-id —
 *                 dedup ON skips it, dedup OFF applies the effect twice (the double-charge bug);
 *   - 'down'    — every attempt times out across an exponential backoff run → dead-letter + alert.
 * Rules baked in by construction (guarded by the golden test):
 *   - the payload is signed (HMAC over id.timestamp.payload) before the first attempt;
 *   - every attempt re-delivers the SAME webhook-id (evt_42) — retries are re-deliveries, not new events;
 *   - the consumer verifies the signature before any processing;
 *   - backoff between attempts grows exponentially (1 s → 4 s → 16 s, ×4);
 *   - delivery is at-least-once: a lost ack after a successful effect still causes a retry.
 * Refs: Standard Webhooks spec (https://github.com/standard-webhooks/standard-webhooks);
 * Stripe webhooks (https://docs.stripe.com/webhooks).
 */

export type Scenario = 'healthy' | 'flaky' | 'down';
export const SCENARIOS: readonly Scenario[] = ['healthy', 'flaky', 'down'] as const;

export type Side = 'provider' | 'consumer';

export type EventKind =
  | 'event' // provider: the domain event occurs and is enqueued
  | 'sign' // provider: HMAC-SHA256 over id.timestamp.payload
  | 'attempt' // provider→consumer: POST delivery attempt #n
  | 'verify' // consumer: signature + timestamp check
  | 'process' // consumer: the business effect is applied
  | 'duplicate' // consumer: same webhook-id seen again → skipped (dedup on)
  | 'response' // consumer→provider: HTTP status, or a lost-ack timeout
  | 'backoff' // provider: waiting before the next attempt
  | 'dead-letter'; // provider: retries exhausted → DLQ + alert

export interface WhEvent {
  /** clock tick (0-based) */
  t: number;
  side: Side;
  kind: EventKind;
  /** short label; technical tokens stay English in both languages */
  label: string;
  /** which delivery attempt this event belongs to (1-based) */
  attempt?: number;
  /** for 'response': the HTTP status; undefined = timeout (lost ack / endpoint down) */
  status?: number;
  /** semantic success flag (verify ok, effect applied once vs a double effect, 2xx response) */
  ok?: boolean;
}

/** The exponential backoff schedule (seconds) between attempts — ×4 each time. */
export const BACKOFF_S: readonly number[] = [1, 4, 16] as const;

const ev = (
  t: number,
  side: Side,
  kind: EventKind,
  label: string,
  extra?: { attempt?: number; status?: number; ok?: boolean },
): WhEvent => ({ t, side, kind, label, ...extra });

/*
 * Build the deterministic script for a scenario. `dedup` models a consumer that stores processed
 * webhook-ids (an idempotency key) — it only changes the 'flaky' story, where the third attempt
 * re-delivers an already-processed event.
 */
export function timeline(s: Scenario, dedup: boolean): WhEvent[] {
  const out: WhEvent[] = [];
  let t = 0;

  // ── The event is born and signed once — retries re-deliver, they never re-sign a new identity ─────
  out.push(ev(t++, 'provider', 'event', 'event evt_42: invoice.paid → queue'));
  out.push(ev(t++, 'provider', 'sign', 'sign: HMAC-SHA256(id.timestamp.payload)'));

  const attempt = (n: number): void => {
    out.push(ev(t++, 'provider', 'attempt', `POST /hooks · evt_42 · attempt #${n}`, { attempt: n }));
  };
  const backoff = (i: number): void => {
    out.push(ev(t++, 'provider', 'backoff', `backoff · retry in ${BACKOFF_S[i]} s`, { attempt: i + 1 }));
  };

  if (s === 'healthy') {
    attempt(1);
    out.push(ev(t++, 'consumer', 'verify', 'verify signature + timestamp ✓', { attempt: 1, ok: true }));
    out.push(ev(t++, 'consumer', 'process', 'process: mark invoice paid', { attempt: 1, ok: true }));
    out.push(ev(t, 'consumer', 'response', 'HTTP 200 OK', { attempt: 1, status: 200, ok: true }));
    return out;
  }

  if (s === 'flaky') {
    // Attempt 1 — the handler blows up before the effect: a clean 500, nothing processed.
    attempt(1);
    out.push(ev(t++, 'consumer', 'verify', 'verify signature + timestamp ✓', { attempt: 1, ok: true }));
    out.push(ev(t++, 'consumer', 'response', 'HTTP 500 (handler crashed)', { attempt: 1, status: 500, ok: false }));
    backoff(0);
    // Attempt 2 — the effect IS applied, but the ack never reaches the provider (lost on the wire).
    attempt(2);
    out.push(ev(t++, 'consumer', 'verify', 'verify signature + timestamp ✓', { attempt: 2, ok: true }));
    out.push(ev(t++, 'consumer', 'process', 'process: mark invoice paid', { attempt: 2, ok: true }));
    out.push(ev(t++, 'consumer', 'response', 'timeout — 200 sent, ack lost', { attempt: 2, ok: false }));
    backoff(1);
    // Attempt 3 — the provider re-delivers the SAME evt_42: at-least-once in action.
    attempt(3);
    out.push(ev(t++, 'consumer', 'verify', 'verify signature + timestamp ✓', { attempt: 3, ok: true }));
    if (dedup) {
      out.push(ev(t++, 'consumer', 'duplicate', 'evt_42 already processed → skip', { attempt: 3, ok: true }));
    } else {
      out.push(ev(t++, 'consumer', 'process', 'process: invoice paid AGAIN — double effect!', { attempt: 3, ok: false }));
    }
    out.push(ev(t, 'consumer', 'response', 'HTTP 200 OK', { attempt: 3, status: 200, ok: true }));
    return out;
  }

  // 'down' — nobody home: timeouts across the whole backoff run, then the dead-letter queue.
  for (let n = 1; n <= BACKOFF_S.length + 1; n++) {
    attempt(n);
    out.push(ev(t++, 'provider', 'response', 'no response — timeout', { attempt: n, ok: false }));
    if (n <= BACKOFF_S.length) backoff(n - 1);
  }
  out.push(ev(t, 'provider', 'dead-letter', 'retries exhausted → dead-letter + alert', { ok: false }));
  return out;
}

/** The final tick of a scenario's script. */
export function lastTick(tl: WhEvent[]): number {
  return tl.reduce((max, e) => Math.max(max, e.t), 0);
}

/** How many times the business effect was applied — the number the whole module is about. */
export function effects(tl: WhEvent[]): number {
  return tl.filter((e) => e.kind === 'process').length;
}

/** Delivery attempts made. */
export function attempts(tl: WhEvent[]): number {
  return tl.filter((e) => e.kind === 'attempt').length;
}
