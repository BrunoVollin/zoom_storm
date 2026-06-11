import { randomUUID } from 'node:crypto';
import { UseCase } from '@bff-application/contracts/UseCase';
import { PendingAuthorizationStore } from '@bff-application/contracts/PendingAuthorizationStore';
import { SessionRepository } from '@bff-domain/repositories/SessionRepository';
import { Session } from '@bff-domain/entities/Session';
import { KeycloakAuthService } from '@bff-infrastructure/keycloak/KeycloakAuthService';
import { env } from '../../config/env';

export interface CallbackInput {
  currentUrl: URL;
  state: string;
}

export type CallbackOutput =
  | { outcome: 'authenticated'; session: Session }
  | { outcome: 'invalid_state' };

export class CallbackUseCase implements UseCase<CallbackInput, CallbackOutput> {
  constructor(
    private readonly keycloakAuthService: KeycloakAuthService,
    private readonly pendingAuthorizationStore: PendingAuthorizationStore,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(input: CallbackInput): Promise<CallbackOutput> {
    const pending = await this.pendingAuthorizationStore.consume(input.state);
    if (!pending) return { outcome: 'invalid_state' };

    const { tokens, user } = await this.keycloakAuthService.exchangeCode({
      currentUrl: input.currentUrl,
      state: pending.state,
      nonce: pending.nonce,
      codeVerifier: pending.codeVerifier,
    });

    const session: Session = {
      id: randomUUID(),
      user,
      tokens,
      createdAt: Math.floor(Date.now() / 1000),
    };

    await this.sessionRepository.save(session, env.session.ttlSeconds);

    return { outcome: 'authenticated', session };
  }
}
