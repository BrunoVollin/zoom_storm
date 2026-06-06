import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { ProductController } from './controllers/ProductController';

export function buildRouter(): Hono {
  const app = new Hono();

  app.use('*', cors());

  const product = new ProductController();

  app.get('/hello', (c) => product.hello(c));

  return app;
}
