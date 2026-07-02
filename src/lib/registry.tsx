// Registry — content references figures and sims by KEY (CLAUDE.md §4), resolved here.
// Each sim/figure is React.lazy so Vite emits a per-component chunk; blocks.tsx wraps renders in
// <Suspense>. check:data validates that every key used in the data resolves here; smoke asserts the
// component-file count equals the key count (no orphan components, no dangling keys).
import { lazy, type ComponentType } from 'react';

// Adapt a named-export lazy import to the { default } shape React.lazy requires.
function lazyNamed<M extends Record<string, ComponentType>>(
  factory: () => Promise<M>,
  name: keyof M & string,
): ComponentType {
  return lazy(() => factory().then((m) => ({ default: m[name] }))) as unknown as ComponentType;
}

// ── Sims ─────────────────────────────────────────────────────────────────────
export const sims: Record<string, ComponentType> = {
  'rest-request-lifecycle': lazyNamed(
    () => import('../components/sims/RestRequestLifecycleSim'),
    'RestRequestLifecycleSim',
  ), // S2 · golden
  // CHANGED (s3): style-compass — signature interactive for m2 + the landing hero.
  'style-compass': lazyNamed(() => import('../components/sims/StyleCompassSim'), 'StyleCompassSim'),
  // CHANGED (s4): http-multiplexing — signature interactive for m3 (HTTP/1.1 vs 2 vs 3 + packet loss).
  'http-multiplexing': lazyNamed(() => import('../components/sims/HttpMultiplexingSim'), 'HttpMultiplexingSim'),
  // CHANGED (s5): grpc-wire — signature interactive for m10 (protobuf byte encoder vs JSON).
  'grpc-wire': lazyNamed(() => import('../components/sims/GrpcWireSim'), 'GrpcWireSim'),
  // CHANGED (s6): graphql-nplus1 — signature interactive for m9 (resolver fan-out vs DataLoader batch).
  'graphql-nplus1': lazyNamed(() => import('../components/sims/GraphqlNplus1Sim'), 'GraphqlNplus1Sim'),
  // CHANGED (s7): websocket-frames — signature interactive for m12 (handshake + full-duplex timeline).
  'websocket-frames': lazyNamed(() => import('../components/sims/WebsocketFramesSim'), 'WebsocketFramesSim'),
  // CHANGED (s8): webrtc-connect — signature interactive for m14 (signaling → ICE → DTLS → P2P data).
  'webrtc-connect': lazyNamed(() => import('../components/sims/WebrtcConnectSim'), 'WebrtcConnectSim'),
  // CHANGED (s9): webhook-delivery — signature interactive for m15 (at-least-once + backoff + dedup).
  'webhook-delivery': lazyNamed(() => import('../components/sims/WebhookDeliverySim'), 'WebhookDeliverySim'),
};

// ── Figures ───────────────────────────────────────────────────────────────────
export const figures: Record<string, ComponentType> = {
  'rest-anatomy': lazyNamed(() => import('../components/figures/RestAnatomy'), 'RestAnatomy'), // S2
  'http-status-classes': lazyNamed(
    () => import('../components/figures/HttpStatusClasses'),
    'HttpStatusClasses',
  ), // S2
  // CHANGED (s3): figures for m1 (foundations on-ramp) + m2 (decision axes).
  'api-boundary': lazyNamed(() => import('../components/figures/ApiBoundary'), 'ApiBoundary'),
  'in-process-vs-network': lazyNamed(
    () => import('../components/figures/InProcessVsNetwork'),
    'InProcessVsNetwork',
  ),
  'decision-axes': lazyNamed(() => import('../components/figures/DecisionAxes'), 'DecisionAxes'),
  'coupling-spectrum': lazyNamed(
    () => import('../components/figures/CouplingSpectrum'),
    'CouplingSpectrum',
  ),
  // CHANGED (s4): figures for m3 (HTTP connection models) + m4 (relative encoding size).
  'http-connection-models': lazyNamed(
    () => import('../components/figures/HttpConnectionModels'),
    'HttpConnectionModels',
  ),
  'encoding-size': lazyNamed(() => import('../components/figures/EncodingSize'), 'EncodingSize'),
  // CHANGED (s5): grpc-call-types — the four gRPC call shapes for m10.
  'grpc-call-types': lazyNamed(() => import('../components/figures/GrpcCallTypes'), 'GrpcCallTypes'),
  // CHANGED (s6): graphql-over-under-fetching — REST vs GraphQL fetching for m9.
  'graphql-over-under-fetching': lazyNamed(
    () => import('../components/figures/GraphqlOverUnderFetching'),
    'GraphqlOverUnderFetching',
  ),
  // CHANGED (s7): websocket-frame-anatomy — the RFC 6455 frame bit layout for m12.
  'websocket-frame-anatomy': lazyNamed(
    () => import('../components/figures/WebsocketFrameAnatomy'),
    'WebsocketFrameAnatomy',
  ),
  // CHANGED (s8): webrtc-connection-paths — the signaling/STUN/TURN triangle vs the P2P path for m14.
  'webrtc-connection-paths': lazyNamed(
    () => import('../components/figures/WebrtcConnectionPaths'),
    'WebrtcConnectionPaths',
  ),
  // CHANGED (s9): sse-stream-anatomy — the text/event-stream format + reconnect loop for m13.
  'sse-stream-anatomy': lazyNamed(
    () => import('../components/figures/SseStreamAnatomy'),
    'SseStreamAnatomy',
  ),
};

export const getSim = (key: string): ComponentType | undefined => sims[key];
export const getFigure = (key: string): ComponentType | undefined => figures[key];
