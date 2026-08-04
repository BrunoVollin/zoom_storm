// Shared OpenTelemetry bootstrap for every backend service in this repo.
//
// Preloaded via `tsx watch -r ./otel/tracing.ts` (see the `dev:*` scripts in
// the root package.json), the same idiom already used by `register-env.ts`
// for cart-service. This MUST run before the service's own entry file is
// required, so that http/pg/mongodb/kafkajs/ioredis get patched before the
// app code ever requires them.
//
// This relies on root package.json's `"type": "commonjs"`, which makes tsx
// compile every `import` to a `require()` call — that's what lets Node's
// classic `--require`/`-r` preload hook (and OTel's Module._load patching)
// work at all. If this repo ever switches to `"type": "module"`, this file
// needs to be re-wired via `NODE_OPTIONS="--import"` + `module.register()`
// instead, since `--require` doesn't apply to native ESM.
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import { trace, context } from '@opentelemetry/api';

// The OTel exporters do NOT auto-append the per-signal path when you pass an
// explicit `url` — that auto-append only happens when the exporter is left
// to read OTEL_EXPORTER_OTLP_ENDPOINT itself with no `url` override. Since we
// need a code-level default (dotenv hasn't run yet at `-r` preload time), we
// build the full per-signal URL by hand here.
const OTLP_BASE = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318';
const serviceName = process.env.OTEL_SERVICE_NAME ?? 'zoom-storm-unknown-service';

const sdk = new NodeSDK({
  resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: serviceName }),
  traceExporter: new OTLPTraceExporter({ url: `${OTLP_BASE}/v1/traces` }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({ url: `${OTLP_BASE}/v1/metrics` }),
    exportIntervalMillis: 10_000,
  }),
  logRecordProcessors: [
    new BatchLogRecordProcessor({ exporter: new OTLPLogExporter({ url: `${OTLP_BASE}/v1/logs` }) }),
  ],
  instrumentations: [
    getNodeAutoInstrumentations({
      // instrumentation-undici's header injection for outgoing fetch() calls
      // is timing-dependent (it relies on diagnostics_channel events lining
      // up with the currently active AsyncLocalStorage context at dispatch
      // time) and was observed to intermittently fail to propagate
      // traceparent across the bff -> api-gateway -> services hops in this
      // app, even though isolated repros of the same fetch/stream/middleware
      // patterns didn't reproduce it deterministically. The proxy clients
      // (apps/bff/.../GatewayProxyClient.ts, apps/api-gateway/.../proxy.ts)
      // create their own CLIENT span and inject the header manually instead,
      // which has been 100% reliable — so undici's own instrumentation is
      // disabled here to avoid a redundant/conflicting second injection.
      '@opentelemetry/instrumentation-undici': { enabled: false },
    }),
    new PrismaInstrumentation(),
  ],
});

sdk.start();

// There is no logging library anywhere in this repo (only console.*), so we
// bridge console output to the OTel Logs API here instead of touching every
// call site across all 7 services. The LogRecord carries trace_id/span_id
// automatically from the active span, but we also stamp them into the plain
// text body so Grafana's Loki datasource can link log lines back to Tempo
// via a `derivedFields` regex, regardless of how a given Loki version maps
// OTLP log attributes internally.
const otelLogger = logs.getLogger(serviceName);
const LOG_LEVELS = {
  log: SeverityNumber.INFO,
  info: SeverityNumber.INFO,
  warn: SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
  debug: SeverityNumber.DEBUG,
} as const;

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

(Object.keys(LOG_LEVELS) as (keyof typeof LOG_LEVELS)[]).forEach((level) => {
  const original = console[level].bind(console);
  console[level] = (...args: unknown[]) => {
    original(...args);
    try {
      const body = args.map((a) => (typeof a === 'string' ? a : safeStringify(a))).join(' ');
      const spanContext = trace.getSpan(context.active())?.spanContext();
      otelLogger.emit({
        body: spanContext
          ? `${body} trace_id=${spanContext.traceId} span_id=${spanContext.spanId}`
          : body,
        severityNumber: LOG_LEVELS[level],
        severityText: level.toUpperCase(),
      });
    } catch {
      // Telemetry must never break application logging.
    }
  };
});

// Best-effort flush on shutdown. Every service in this repo already
// registers its own SIGINT/SIGTERM handler that calls process.exit() once
// its own cleanup resolves (see apps/*/src/infrastructure/http/server.ts and
// apps/*/src/shutdown.ts). Those handlers are registered AFTER this one
// (since this file loads via `-r`, before the entry point), so they race
// this async shutdown() and may call process.exit() before the OTLP flush
// requests complete — the last few spans/logs/metrics before a shutdown can
// be lost. The short exportIntervalMillis above mitigates this by keeping
// most telemetry already flushed periodically. Fully fixing this would
// require every service to await a shared flush before exiting, which is
// out of scope here.
let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  try {
    await sdk.shutdown();
  } catch (err) {
    console.error('[otel] shutdown flush failed', err);
  }
}
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
