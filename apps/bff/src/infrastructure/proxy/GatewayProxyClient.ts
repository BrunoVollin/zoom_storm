import type { Context } from 'hono';
import { Session } from '@bff-domain/entities/Session';
import { env } from '../../config/env';

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

  const init: RequestInit & { duplex?: string } = {
    method: c.req.method,
    headers,
    body: hasBody ? c.req.raw.body : undefined,
    duplex: hasBody ? 'half' : undefined,
  };

  const response = await fetch(targetUrl, init);

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete('set-cookie');

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}
