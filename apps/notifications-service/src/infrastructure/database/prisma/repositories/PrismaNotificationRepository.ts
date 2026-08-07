import { Notification, NotificationType } from '../../../../domain/entities/Notification';
import { NotificationRepository } from '../../../../domain/repositories/NotificationRepository';
import { IdType } from '../../../../domain/shared/IdType';
import { DuplicateNotificationEventError } from '../../../../domain/errors/DuplicateNotificationEventError';
import { prisma } from '../prisma-connection';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

// Duck-typed check instead of `instanceof Prisma.PrismaClientKnownRequestError`
// on purpose: importing the generated `client.ts` module here (rather than
// only through `prisma-connection.ts`) pulls in ESM-only `import.meta` code
// that Jest/ts-jest cannot parse under CommonJS, breaking unit tests that
// mock `prisma-connection`.
function isUniqueConstraintViolationOn(error: unknown, field: string): boolean {
  if (typeof error !== 'object' || error === null) return false;

  const { code, meta } = error as { code?: unknown; meta?: { target?: unknown } };
  if (code !== UNIQUE_CONSTRAINT_VIOLATION) return false;

  const target = meta?.target;
  return Array.isArray(target) && target.includes(field);
}

export class PrismaNotificationRepository implements NotificationRepository {
  async save(notification: Notification): Promise<void> {
    try {
      await prisma.notification.upsert({
        where: { id: notification.getId().toString() },
        create: {
          id: notification.getId().toString(),
          userId: notification.userId.toString(),
          message: notification.message,
          type: notification.type,
          orderId: notification.orderId,
          sourceEventKey: notification.sourceEventKey,
          read: notification.isRead(),
        },
        update: {
          read: notification.isRead(),
        },
      });
    } catch (error) {
      if (isUniqueConstraintViolationOn(error, 'sourceEventKey')) {
        throw new DuplicateNotificationEventError(notification.sourceEventKey ?? '');
      }

      throw error;
    }
  }

  async findById(id: IdType): Promise<Notification | null> {
    const row = await prisma.notification.findUnique({ where: { id: id.toString() } });
    if (!row) return null;

    return PrismaNotificationRepository.toDomain(row);
  }

  async findByUserId(userId: IdType): Promise<Notification[]> {
    const rows = await prisma.notification.findMany({
      where: { userId: userId.toString() },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return rows.map(PrismaNotificationRepository.toDomain);
  }

  async countUnread(userId: IdType): Promise<number> {
    return prisma.notification.count({
      where: { userId: userId.toString(), read: false },
    });
  }

  async markAllAsRead(userId: IdType): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId: userId.toString(), read: false },
      data: { read: true },
    });

    return result.count;
  }

  private static toDomain(row: {
    id: string;
    userId: string;
    message: string;
    type: string;
    orderId: string | null;
    sourceEventKey: string | null;
    read: boolean;
    createdAt: Date;
  }): Notification {
    return new Notification(
      IdType.create(row.id),
      IdType.create(row.userId),
      row.message,
      row.type as NotificationType,
      row.orderId,
      row.sourceEventKey,
      row.read,
      row.createdAt,
    );
  }
}
