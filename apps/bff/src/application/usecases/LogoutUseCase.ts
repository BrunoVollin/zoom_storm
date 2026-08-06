import { UseCase } from '@bff-application/contracts/UseCase';
import { SessionRepository } from '@bff-domain/repositories/SessionRepository';
import { Session } from '@bff-domain/entities/Session';
import { AuthService } from '@bff-domain/repositories/AuthService';

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
    private readonly authService: AuthService,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(input: LogoutInput): Promise<LogoutOutput> {
    await this.sessionRepository.delete(input.session.id);

    if (!input.global) return { outcome: 'local' };

    const redirectUrl = await this.authService.buildEndSessionUrl(
      input.session.tokens.idToken,
      input.postLogoutRedirectUri,
    );

    return { outcome: 'global', redirectUrl };
  }
}
