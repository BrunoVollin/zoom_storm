import { serve } from '@hono/node-server';
import { env } from '../../config/env';
import { createRedisConnection } from '@bff-infrastructure/session/redis-connection';
import { buildRouter } from './router';

const PORT = env.http.port;

const redis = createRedisConnection();
// ioredis requires a dedicated connection once put into subscriber mode
// (PSUBSCRIBE), separate from the one used for session storage.
const notificationsRedis = createRedisConnection();

const { app, injectWebSocket } = buildRouter(redis, notificationsRedis);

const server = serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`bff running on http://localhost:${PORT}`);
  console.log(`  → /auth/*              (Keycloak authentication)`);
  console.log(`  → /cart/*, /products/*, /notifications/* → ${env.gateway.url}`);
  console.log(`  → /ws                  (notifications WebSocket)`);
});

injectWebSocket(server);

async function shutdown() {
  server.close();
  await redis.quit();
  await notificationsRedis.quit();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
