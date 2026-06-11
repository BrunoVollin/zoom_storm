import { UseCase } from '@bff-application/contracts/UseCase';
import { SessionRepository } from '@bff-domain/repositories/SessionRepository';
import { Session } from '@bff-domain/entities/Session';
import { KeycloakAuthService } from '@bff-infrastructure/keycloak/KeycloakAuthService';

export interface LogoutInput {
  session: Session;
  global: boolean;
  postLogoutRedirectUri: string;
}

export type LogoutOutput =
  | { outcome: 'local' }
  | { outcome: 'global'; redirectUrl: string };

export class LogoutUseCase implements UseCase<LogoutInput, LogoutOutput> {
  constructor(
    private readonly keycloakAuthService: KeycloakAuthService,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(input: LogoutInput): Promise<LogoutOutput> {
    await this.sessionRepository.delete(input.session.id);

    if (!input.global) return { outcome: 'local' };

    const redirectUrl = await this.keycloakAuthService.buildEndSessionUrl(
      input.session.tokens.idToken,
      input.postLogoutRedirectUri,
    );

    return { outcome: 'global', redirectUrl };
  }
}
