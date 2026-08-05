import { Notification } from '../entities/Notification';

export interface NotificationPublisher {
  publish(notification: Notification): Promise<void>;
}
