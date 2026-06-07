import { UseCase } from '@bff-application/contracts/UseCase';
import { SessionRepository } from '@bff-domain/repositories/SessionRepository';
import {
  Session,
  isAccessTokenExpiring,
  isRefreshTokenExpired,
} from '@bff-domain/entities/Session';
import { KeycloakAuthService } from '@bff-infrastructure/keycloak/KeycloakAuthService';
import { env } from '../../config/env';

const ACCESS_TOKEN_EXPIRY_THRESHOLD_SECONDS = 30;
const REFRESH_LOCK_TTL_SECONDS = 10;
const REFRESH_LOCK_RETRY_DELAY_MS = 150;
const REFRESH_LOCK_MAX_RETRIES = 20;

export interface RefreshTokenInput {
  session: Session;
}

export type RefreshTokenOutput =
  | { outcome: 'unchanged'; session: Session }
  | { outcome: 'refreshed'; session: Session }
  | { outcome: 'expired' };

export class RefreshTokenUseCase implements UseCase<
  RefreshTokenInput,
  RefreshTokenOutput
> {
  constructor(
    private readonly keycloakAuthService: KeycloakAuthService,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    const { session } = input;

    if (
      !isAccessTokenExpiring(session, ACCESS_TOKEN_EXPIRY_THRESHOLD_SECONDS)
    ) {
      return { outcome: 'unchanged', session };
    }

    if (isRefreshTokenExpired(session)) {
      await this.sessionRepository.delete(session.id);

      return { outcome: 'expired' };
    }

    return this.refreshUnderLock(session);
  }

  private async refreshUnderLock(
    session: Session,
  ): Promise<RefreshTokenOutput> {
    const acquired = await this.sessionRepository.acquireRefreshLock(
      session.id,
      REFRESH_LOCK_TTL_SECONDS,
    );

    if (!acquired) return this.waitForConcurrentRefresh(session);

    try {
      const { tokens } = await this.keycloakAuthService.refresh(
        session.tokens.refreshToken,
      );

      const refreshed: Session = { ...session, tokens };

      await this.sessionRepository.save(refreshed, env.session.ttlSeconds);

      return { outcome: 'refreshed', session: refreshed };
    } finally {
      await this.sessionRepository.releaseRefreshLock(session.id);
    }
  }

  private async waitForConcurrentRefresh(
    session: Session,
  ): Promise<RefreshTokenOutput> {
    for (let attempt = 0; attempt < REFRESH_LOCK_MAX_RETRIES; attempt += 1) {
      await new Promise((resolve) =>
        setTimeout(resolve, REFRESH_LOCK_RETRY_DELAY_MS),
      );

      const current = await this.sessionRepository.findById(session.id);
      if (!current) return { outcome: 'expired' };

      if (
        !isAccessTokenExpiring(current, ACCESS_TOKEN_EXPIRY_THRESHOLD_SECONDS)
      ) {
        return { outcome: 'refreshed', session: current };
      }
    }

    return { outcome: 'expired' };
  }
}
