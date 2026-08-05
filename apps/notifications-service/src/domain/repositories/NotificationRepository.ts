import { Notification } from '../entities/Notification';
import { IdType } from '../shared/IdType';

export interface NotificationRepository {
  save(notification: Notification): Promise<void>;
  findById(id: IdType): Promise<Notification | null>;
  findByUserId(userId: IdType): Promise<Notification[]>;
  countUnread(userId: IdType): Promise<number>;
}
