import type { Redis } from 'ioredis';
import { Notification } from '../../domain/entities/Notification';
import { NotificationPublisher } from '../../domain/repositories/NotificationPublisher';
import { NotificationMapper } from '../../application/mappers/NotificationMapper';

export class RedisNotificationPublisher implements NotificationPublisher {
  constructor(private readonly redis: Redis) {}

  async publish(notification: Notification): Promise<void> {
    const channel = `notifications:user:${notification.userId.toString()}`;

    await this.redis.publish(channel, JSON.stringify(NotificationMapper.toPrimitives(notification)));
  }
}
