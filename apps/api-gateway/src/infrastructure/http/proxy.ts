import type { Context } from 'hono';
import { propagation, trace, context, SpanKind, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('api-gateway-proxy');

export async function proxyRequest(
  c: Context,
  targetUrl: string,
): Promise<Response> {
  const url = new URL(targetUrl);

  const headers = new Headers(c.req.raw.headers);
  headers.delete('host');

  const hasBody = !['GET', 'HEAD'].includes(c.req.method);

  // instrumentation-undici's own header injection proved unreliable for this
  // hop (see otel/tracing.ts), so we create the CLIENT span and inject the
  // trace context ourselves, synchronously, before the fetch() call.
  return tracer.startActiveSpan(
    `${c.req.method} ${url.origin}`,
    { kind: SpanKind.CLIENT, attributes: { 'http.request.method': c.req.method, 'url.full': url.toString() } },
    async (span) => {
      try {
        propagation.inject(context.active(), headers, {
          set: (carrier, key, value) => carrier.set(key, value),
        });

        const init: RequestInit & { duplex?: string } = {
          method: c.req.method,
          headers,
          body: hasBody ? c.req.raw.body : undefined,
          duplex: hasBody ? 'half' : undefined,
        };

        const response = await fetch(url.toString(), init);
        span.setAttribute('http.response.status_code', response.status);

        return new Response(response.body, {
          status: response.status,
          headers: response.headers,
        });
      } catch (err) {
        span.recordException(err as Error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw err;
      } finally {
        span.end();
      }
    },
  );
}
