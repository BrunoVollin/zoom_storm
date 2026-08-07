import type { MiddlewareHandler } from 'hono';
import { Status as QueryStatus } from '../../src/application/contracts/Query';
import { Status as UseCaseStatus } from '../../src/application/contracts/UseCase';
import { ListNotificationsQuery } from '../../src/application/queries/ListNotificationsQuery';
import { MarkAllNotificationsReadUseCase } from '../../src/application/usecases/MarkAllNotificationsReadUseCase';
import { MarkNotificationReadUseCase } from '../../src/application/usecases/MarkNotificationReadUseCase';

jest.mock(
  '../../src/infrastructure/http/middlewares/requireAuthMiddleware',
  () => ({
    requireAuth: (async (c, next) => {
      c.set('userId', 'user-1');
      await next();
    }) as MiddlewareHandler,
  }),
);

import { buildRouter } from '../../src/infrastructure/http/router';

describe('notification router', () => {
  it('wires PATCH /notifications/read-all to the authenticated user use case', async () => {
    const markAllExecute = jest.fn().mockResolvedValue({
      status: UseCaseStatus.SUCCESS,
      updatedCount: 4,
    });
    const app = buildRouter({
      listNotifications: {
        execute: jest.fn().mockResolvedValue({
          status: QueryStatus.SUCCESS,
          notifications: [],
          unreadCount: 0,
        }),
      } as unknown as ListNotificationsQuery,
      markNotificationRead: {
        execute: jest.fn(),
      } as unknown as MarkNotificationReadUseCase,
      markAllNotificationsRead: {
        execute: markAllExecute,
      } as unknown as MarkAllNotificationsReadUseCase,
    });

    const response = await app.request('/notifications/read-all', {
      method: 'PATCH',
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: UseCaseStatus.SUCCESS,
      updatedCount: 4,
    });
    expect(markAllExecute).toHaveBeenCalledWith({ userId: 'user-1' });
  });

  it('maps mark-all persistence failures to an unprocessable response', async () => {
    const app = buildRouter({
      listNotifications: { execute: jest.fn() } as unknown as ListNotificationsQuery,
      markNotificationRead: {
        execute: jest.fn(),
      } as unknown as MarkNotificationReadUseCase,
      markAllNotificationsRead: {
        execute: jest.fn().mockResolvedValue({
          status: UseCaseStatus.ERROR,
          message: 'Database unavailable',
        }),
      } as unknown as MarkAllNotificationsReadUseCase,
    });

    const response = await app.request('/notifications/read-all', {
      method: 'PATCH',
    });

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      status: UseCaseStatus.ERROR,
      message: 'Database unavailable',
    });
  });
});
