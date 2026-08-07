import { Notification, NotificationType } from '../../src/domain/entities/Notification';
import { IdType } from '../../src/domain/shared/IdType';
import { DuplicateNotificationEventError } from '../../src/domain/errors/DuplicateNotificationEventError';

const notificationUpsert = jest.fn();
const notificationUpdateMany = jest.fn();

jest.mock('../../src/infrastructure/database/prisma/prisma-connection', () => ({
  prisma: {
    notification: {
      upsert: notificationUpsert,
      updateMany: notificationUpdateMany,
    },
  },
}));

import { PrismaNotificationRepository } from '../../src/infrastructure/database/prisma/repositories/PrismaNotificationRepository';

// Mirrors the shape of Prisma's `PrismaClientKnownRequestError` (code +
// meta.target) without importing the generated `client.ts` module, which
// pulls in ESM-only `import.meta` code that ts-jest cannot parse.
function uniqueConstraintViolation(target: string[]): Error & { code: string; meta: { target: string[] } } {
  const error = new Error('Unique constraint failed') as Error & {
    code: string;
    meta: { target: string[] };
  };
  error.name = 'PrismaClientKnownRequestError';
  error.code = 'P2002';
  error.meta = { target };

  return error;
}

describe('PrismaNotificationRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('upserts the notification including the sourceEventKey', async () => {
      const notification = new Notification(
        IdType.create('notification-1'),
        IdType.create('user-1'),
        'Seu pedido foi entregue!',
        NotificationType.ORDER_DELIVERED,
        'order-1',
        'order-1:ORDER_DELIVERED',
      );

      notificationUpsert.mockResolvedValue(undefined);

      const repository = new PrismaNotificationRepository();
      await repository.save(notification);

      expect(notificationUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notification-1' },
          create: expect.objectContaining({ sourceEventKey: 'order-1:ORDER_DELIVERED' }),
        }),
      );
    });

    it('translates a sourceEventKey unique constraint violation into DuplicateNotificationEventError', async () => {
      const notification = new Notification(
        IdType.create('notification-2'),
        IdType.create('user-1'),
        'Seu pedido foi entregue!',
        NotificationType.ORDER_DELIVERED,
        'order-1',
        'order-1:ORDER_DELIVERED',
      );

      notificationUpsert.mockRejectedValue(uniqueConstraintViolation(['sourceEventKey']));

      const repository = new PrismaNotificationRepository();

      await expect(repository.save(notification)).rejects.toThrow(
        DuplicateNotificationEventError,
      );
    });

    it('does not swallow unrelated unique constraint violations', async () => {
      const notification = new Notification(
        IdType.create('notification-3'),
        IdType.create('user-1'),
        'Seu pedido foi entregue!',
        NotificationType.ORDER_DELIVERED,
        'order-1',
        'order-1:ORDER_DELIVERED',
      );

      const otherError = uniqueConstraintViolation(['id']);

      notificationUpsert.mockRejectedValue(otherError);

      const repository = new PrismaNotificationRepository();

      await expect(repository.save(notification)).rejects.toBe(otherError);
    });

    it('propagates unexpected errors unchanged', async () => {
      const notification = new Notification(
        IdType.create('notification-4'),
        IdType.create('user-1'),
        'Seu pedido foi entregue!',
        NotificationType.ORDER_DELIVERED,
        'order-1',
        'order-1:ORDER_DELIVERED',
      );

      const dbError = new Error('Database connection failed');
      notificationUpsert.mockRejectedValue(dbError);

      const repository = new PrismaNotificationRepository();

      await expect(repository.save(notification)).rejects.toBe(dbError);
    });
  });

  describe('markAllAsRead', () => {
    it('updates only unread notifications owned by the requested user', async () => {
      notificationUpdateMany.mockResolvedValue({ count: 2 });

      const repository = new PrismaNotificationRepository();
      const updatedCount = await repository.markAllAsRead(IdType.create('user-1'));

      expect(notificationUpdateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', read: false },
        data: { read: true },
      });
      expect(updatedCount).toBe(2);
    });
  });
});
