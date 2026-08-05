import { Notification } from '../../domain/entities/Notification';

export class NotificationMapper {
  static toPrimitives(notification: Notification) {
    return {
      id: notification.id.toString(),
      message: notification.message,
      type: notification.type,
      orderId: notification.orderId,
      read: notification.isRead(),
      createdAt: notification.createdAt.toISOString(),
    };
  }
}

export type NotificationPrimitives = ReturnType<typeof NotificationMapper.toPrimitives>;
