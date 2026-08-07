import { UseCase } from '@bff-application/contracts/UseCase';
import { PendingAuthorizationStore } from '@bff-application/contracts/PendingAuthorizationStore';
import {
  AuthService,
  AuthorizationFlow,
  IdentityProvider,
} from '@bff-domain/repositories/AuthService';

const PENDING_AUTHORIZATION_TTL_SECONDS = 5 * 60;

export interface LoginInput {
  redirectUri: string;
  flow?: AuthorizationFlow;
  identityProvider?: IdentityProvider;
}

export interface LoginOutput {
  authorizationUrl: string;
}

export class LoginUseCase implements UseCase<LoginInput, LoginOutput> {
  constructor(
    private readonly authService: AuthService,
    private readonly pendingAuthorizationStore: PendingAuthorizationStore,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const request = await this.authService.buildAuthorizationRequest(input);

    await this.pendingAuthorizationStore.save(
      {
        state: request.state,
        nonce: request.nonce,
        codeVerifier: request.codeVerifier,
        redirectUri: input.redirectUri,
      },
      PENDING_AUTHORIZATION_TTL_SECONDS,
    );

    return { authorizationUrl: request.authorizationUrl };
  }
}
