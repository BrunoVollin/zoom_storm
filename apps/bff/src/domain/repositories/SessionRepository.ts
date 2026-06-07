import { Session } from '@bff-domain/entities/Session';

export interface SessionRepository {
  save(session: Session, ttlSeconds: number): Promise<void>;
  findById(sessionId: string): Promise<Session | null>;
  delete(sessionId: string): Promise<void>;
  acquireRefreshLock(sessionId: string, ttlSeconds: number): Promise<boolean>;
  releaseRefreshLock(sessionId: string): Promise<void>;
}
