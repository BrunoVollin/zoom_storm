import { registerOTel } from '@vercel/otel';

// Next.js stable instrumentation hook — runs once when the server starts.
// Reads OTEL_EXPORTER_OTLP_ENDPOINT (apps/web/.env.local) to reach the same
// local OTel Collector every backend service exports to (see otel/tracing.ts
// at the repo root and docker-compose.yml for the collector/Tempo/Loki/
// Prometheus/Grafana stack).
export function register() {
  registerOTel({
    serviceName: 'web',
    instrumentationConfig: {
      // @vercel/otel only injects the traceparent header into outgoing
      // fetch() calls for Vercel deployment URLs by default — everything
      // else (including our local BFF) needs to be allow-listed explicitly,
      // otherwise the trace chain breaks at the web -> bff hop and every
      // downstream service shows up as its own disconnected trace root in
      // the Tempo service graph.
      fetch: {
        propagateContextUrls: [process.env.BFF_BASE_URL ?? 'http://localhost:8088'],
      },
    },
  });
}
