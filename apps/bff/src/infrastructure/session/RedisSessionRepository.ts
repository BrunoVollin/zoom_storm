import { Redis } from 'ioredis';
import { Session } from '@bff-domain/entities/Session';
import { SessionRepository } from '@bff-domain/repositories/SessionRepository';

const SESSION_KEY_PREFIX = 'bff:session:';
const REFRESH_LOCK_PREFIX = 'bff:session-refresh-lock:';

export class RedisSessionRepository implements SessionRepository {
  constructor(private readonly redis: Redis) {}

  private sessionKey(sessionId: string): string {
    return `${SESSION_KEY_PREFIX}${sessionId}`;
  }

  private refreshLockKey(sessionId: string): string {
    return `${REFRESH_LOCK_PREFIX}${sessionId}`;
  }

  async save(session: Session, ttlSeconds: number): Promise<void> {
    await this.redis.set(
      this.sessionKey(session.id),
      JSON.stringify(session),
      'EX',
      ttlSeconds,
    );
  }

  async findById(sessionId: string): Promise<Session | null> {
    const raw = await this.redis.get(this.sessionKey(sessionId));
    if (!raw) return null;

    return JSON.parse(raw) as Session;
  }

  async delete(sessionId: string): Promise<void> {
    await this.redis.del(this.sessionKey(sessionId));
  }

  async acquireRefreshLock(
    sessionId: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const result = await this.redis.set(
      this.refreshLockKey(sessionId),
      '1',
      'EX',
      ttlSeconds,
      'NX',
    );

    return result === 'OK';
  }

  async releaseRefreshLock(sessionId: string): Promise<void> {
    await this.redis.del(this.refreshLockKey(sessionId));
  }
}
