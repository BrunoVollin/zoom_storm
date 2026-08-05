import { Notification, NotificationType } from '../../../../domain/entities/Notification';
import { NotificationRepository } from '../../../../domain/repositories/NotificationRepository';
import { IdType } from '../../../../domain/shared/IdType';
import { prisma } from '../prisma-connection';

export class PrismaNotificationRepository implements NotificationRepository {
  async save(notification: Notification): Promise<void> {
    await prisma.notification.upsert({
      where: { id: notification.getId().toString() },
      create: {
        id: notification.getId().toString(),
        userId: notification.userId.toString(),
        message: notification.message,
        type: notification.type,
        orderId: notification.orderId,
        read: notification.isRead(),
      },
      update: {
        read: notification.isRead(),
      },
    });
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

  private static toDomain(row: {
    id: string;
    userId: string;
    message: string;
    type: string;
    orderId: string | null;
    read: boolean;
    createdAt: Date;
  }): Notification {
    return new Notification(
      IdType.create(row.id),
      IdType.create(row.userId),
      row.message,
      row.type as NotificationType,
      row.orderId,
      row.read,
      row.createdAt,
    );
  }
}
