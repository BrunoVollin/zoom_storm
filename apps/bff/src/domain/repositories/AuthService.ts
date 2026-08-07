import { SessionTokens, SessionUser } from '@bff-domain/entities/Session';

export interface AuthorizationRequest {
  authorizationUrl: string;
  state: string;
  nonce: string;
  codeVerifier: string;
}

export type AuthorizationFlow = 'login' | 'register';

export type IdentityProvider = 'google';

export interface BuildAuthorizationRequestInput {
  redirectUri: string;
  flow?: AuthorizationFlow;
  identityProvider?: IdentityProvider;
}

export interface ExchangeCodeInput {
  currentUrl: URL;
  state: string;
  nonce: string;
  codeVerifier: string;
}

export interface ExchangeResult {
  tokens: SessionTokens;
  user: SessionUser;
}

export interface AuthService {
  buildAuthorizationRequest(
    input: BuildAuthorizationRequestInput,
  ): Promise<AuthorizationRequest>;
  exchangeCode(input: ExchangeCodeInput): Promise<ExchangeResult>;
  refresh(refreshToken: string): Promise<ExchangeResult>;
  buildEndSessionUrl(
    idToken: string | undefined,
    postLogoutRedirectUri: string,
  ): Promise<string>;
}
