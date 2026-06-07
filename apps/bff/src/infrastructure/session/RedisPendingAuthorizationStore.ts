import { Redis } from 'ioredis';
import {
  PendingAuthorization,
  PendingAuthorizationStore,
} from '@bff-application/contracts/PendingAuthorizationStore';

const PENDING_AUTH_KEY_PREFIX = 'bff:pending-auth:';

export class RedisPendingAuthorizationStore implements PendingAuthorizationStore {
  constructor(private readonly redis: Redis) {}

  private key(state: string): string {
    return `${PENDING_AUTH_KEY_PREFIX}${state}`;
  }

  async save(pending: PendingAuthorization, ttlSeconds: number): Promise<void> {
    await this.redis.set(
      this.key(pending.state),
      JSON.stringify(pending),
      'EX',
      ttlSeconds,
    );
  }

  async consume(state: string): Promise<PendingAuthorization | null> {
    const key = this.key(state);
    const raw = await this.redis.get(key);
    if (!raw) return null;

    await this.redis.del(key);

    return JSON.parse(raw) as PendingAuthorization;
  }
}
