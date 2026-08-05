import { serve } from '@hono/node-server';
import { env } from '../../config/env';
import { buildRouter } from './router';
import { PrismaNotificationRepository } from '../database/prisma/repositories/PrismaNotificationRepository';
import { closeDatabaseConnections } from '../database/prisma/prisma-connection';
import { ListNotificationsQuery } from '../../application/queries/ListNotificationsQuery';
import { MarkNotificationReadUseCase } from '../../application/usecases/MarkNotificationReadUseCase';

const PORT = env.http.port;

const notificationRepository = new PrismaNotificationRepository();

const app = buildRouter({
  listNotifications: new ListNotificationsQuery(notificationRepository),
  markNotificationRead: new MarkNotificationReadUseCase(notificationRepository),
});

const server = serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`notifications-service HTTP API running on http://localhost:${PORT}`);
});

async function shutdown() {
  server.close();
  await closeDatabaseConnections();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
