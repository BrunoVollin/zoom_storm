import { serve } from '@hono/node-server';
import { env } from '../../config/env';
import { createRedisConnection } from '@bff-infrastructure/session/redis-connection';
import { buildRouter } from './router';

const PORT = env.http.port;

const redis = createRedisConnection();
const app = buildRouter(redis);

const server = serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`bff running on http://localhost:${PORT}`);
  console.log(`  → /auth/*              (Keycloak authentication)`);
  console.log(`  → /cart/*, /products/* → ${env.gateway.url}`);
});

async function shutdown() {
  server.close();
  await redis.quit();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
