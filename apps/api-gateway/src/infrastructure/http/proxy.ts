import type { Context } from 'hono';

export async function proxyRequest(
  c: Context,
  targetUrl: string,
): Promise<Response> {
  const url = new URL(targetUrl);

  const headers = new Headers(c.req.raw.headers);
  headers.delete('host');

  const hasBody = !['GET', 'HEAD'].includes(c.req.method);

  const init: RequestInit & { duplex?: string } = {
    method: c.req.method,
    headers,
    body: hasBody ? c.req.raw.body : undefined,
    duplex: hasBody ? 'half' : undefined,
  };

  const response = await fetch(url.toString(), init);

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}
