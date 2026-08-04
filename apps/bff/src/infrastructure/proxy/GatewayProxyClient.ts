import type { Context } from 'hono';
import { propagation, trace, context, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { Session } from '@bff-domain/entities/Session';
import { env } from '../../config/env';

const tracer = trace.getTracer('bff-gateway-proxy');

export async function proxyToGateway(
  c: Context,
  session: Session | undefined,
  path: string,
): Promise<Response> {
  const query = new URL(c.req.url).search;
  const targetUrl = `${env.gateway.url}${path}${query}`;

  const headers = new Headers(c.req.raw.headers);
  headers.delete('host');
  headers.delete('cookie');
  if (session) {
    headers.set('authorization', `Bearer ${session.tokens.accessToken}`);
  } else {
    headers.delete('authorization');
  }

  const hasBody = !['GET', 'HEAD'].includes(c.req.method);

  // instrumentation-undici's own header injection proved unreliable for this
  // hop (see otel/tracing.ts), so we create the CLIENT span and inject the
  // trace context ourselves, synchronously, before the fetch() call.
  return tracer.startActiveSpan(
    `${c.req.method} ${env.gateway.url}`,
    { kind: SpanKind.CLIENT, attributes: { 'http.request.method': c.req.method, 'url.full': targetUrl } },
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

        const response = await fetch(targetUrl, init);
        span.setAttribute('http.response.status_code', response.status);

        const responseHeaders = new Headers(response.headers);
        responseHeaders.delete('set-cookie');

        return new Response(response.body, {
          status: response.status,
          headers: responseHeaders,
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
