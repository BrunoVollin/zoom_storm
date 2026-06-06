import { serve } from '@hono/node-server';
import { env } from '../../config/env';
import { buildRouter } from './router';

const PORT = env.http.port;

const app = buildRouter();

const server = serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`products-service HTTP API running on http://localhost:${PORT}`);
});

async function shutdown() {
  server.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
