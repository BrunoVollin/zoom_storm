import { Notification } from '../entities/Notification';
import { IdType } from '../shared/IdType';

export interface NotificationRepository {
  /**
   * Persists a notification. When `notification.sourceEventKey` collides
   * with an existing row (i.e. the same order event was already
   * processed), implementations must reject with
   * `DuplicateNotificationEventError` instead of creating a duplicate row.
   */
  save(notification: Notification): Promise<void>;
  findById(id: IdType): Promise<Notification | null>;
  findByUserId(userId: IdType): Promise<Notification[]>;
  countUnread(userId: IdType): Promise<number>;
  markAllAsRead(userId: IdType): Promise<number>;
}
