import type { Redis } from 'ioredis';
import { NotificationsSocketGateway } from '../http/ws/NotificationsSocketGateway';

const CHANNEL_PATTERN = 'notifications:user:*';
const CHANNEL_PREFIX = 'notifications:user:';

export function subscribeToNotifications(
  redis: Redis,
  gateway: NotificationsSocketGateway,
): void {
  redis.psubscribe(CHANNEL_PATTERN, (err) => {
    if (err) console.error('[NotificationsSubscriber] Failed to subscribe:', err);
  });

  redis.on('pmessage', (_pattern, channel, message) => {
    if (!channel.startsWith(CHANNEL_PREFIX)) return;

    const userId = channel.slice(CHANNEL_PREFIX.length);

    try {
      gateway.broadcastToUser(userId, JSON.parse(message));
    } catch (error) {
      console.error('[NotificationsSubscriber] Failed to parse message:', error);
    }
  });
}
