import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { NotificationController } from './controllers/NotificationController';
import { ListNotificationsQuery } from '../../application/queries/ListNotificationsQuery';
import { MarkNotificationReadUseCase } from '../../application/usecases/MarkNotificationReadUseCase';
import { requireAuth } from './middlewares/requireAuthMiddleware';

interface Dependencies {
  listNotifications: ListNotificationsQuery;
  markNotificationRead: MarkNotificationReadUseCase;
}

export function buildRouter(deps: Dependencies): Hono {
  const app = new Hono();

  app.use('*', cors());

  const notification = new NotificationController(
    deps.listNotifications,
    deps.markNotificationRead,
  );

  app.get('/health', (c) => c.json({ status: 'ok' }, 200));

  app.get('/notifications', requireAuth, (c) => notification.list(c));
  app.patch('/notifications/:id/read', requireAuth, (c) => notification.markRead(c));

  return app;
}
