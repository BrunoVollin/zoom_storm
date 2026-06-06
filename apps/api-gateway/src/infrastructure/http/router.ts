import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from '../../config/env';
import { proxyRequest } from './proxy';

export function buildRouter(): Hono {
  const app = new Hono();

  app.use('*', cors());

  app.get('/health', (c) => c.json({ status: 'ok' }, 200));

  app.all('/cart/*', (c) => {
    const path = c.req.path.replace('/cart', '');
    const query = new URL(c.req.url).search;

    return proxyRequest(c, `${env.services.cart}${path}${query}`);
  });

  app.all('/products/*', (c) => {
    const path = c.req.path.replace('/products', '');
    const query = new URL(c.req.url).search;

    return proxyRequest(c, `${env.services.products}${path}${query}`);
  });

  return app;
}
