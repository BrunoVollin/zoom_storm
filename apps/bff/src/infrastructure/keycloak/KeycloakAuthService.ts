import * as client from 'openid-client';
import { env } from '../../config/env';
import { SessionTokens, SessionUser } from '@bff-domain/entities/Session';

export interface AuthorizationRequest {
  authorizationUrl: string;
  state: string;
  nonce: string;
  codeVerifier: string;
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

export class KeycloakAuthService {
  private configuration: client.Configuration | undefined;

  private async getConfiguration(): Promise<client.Configuration> {
    if (this.configuration) return this.configuration;

    this.configuration = await client.discovery(
      new URL(env.keycloak.issuerUrl),
      env.keycloak.clientId,
      env.keycloak.clientSecret || undefined,
      undefined,
      env.isProduction
        ? undefined
        : { execute: [client.allowInsecureRequests] },
    );

    return this.configuration;
  }

  async buildAuthorizationRequest(
    redirectUri: string,
  ): Promise<AuthorizationRequest> {
    const configuration = await this.getConfiguration();

    const codeVerifier = client.randomPKCECodeVerifier();
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
    const state = client.randomState();
    const nonce = client.randomNonce();

    const authorizationUrl = client.buildAuthorizationUrl(configuration, {
      redirect_uri: redirectUri,
      scope: 'openid profile email offline_access',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
      nonce,
    });

    return {
      authorizationUrl: authorizationUrl.toString(),
      state,
      nonce,
      codeVerifier,
    };
  }

  async exchangeCode(input: ExchangeCodeInput): Promise<ExchangeResult> {
    const configuration = await this.getConfiguration();

    const tokenResponse = await client.authorizationCodeGrant(
      configuration,
      input.currentUrl,
      {
        expectedState: input.state,
        expectedNonce: input.nonce,
        pkceCodeVerifier: input.codeVerifier,
        idTokenExpected: true,
      },
    );

    return this.toExchangeResult(tokenResponse);
  }

  async refresh(refreshToken: string): Promise<ExchangeResult> {
    const configuration = await this.getConfiguration();

    const tokenResponse = await client.refreshTokenGrant(
      configuration,
      refreshToken,
    );

    return this.toExchangeResult(tokenResponse);
  }

  async buildEndSessionUrl(
    idToken: string | undefined,
    postLogoutRedirectUri: string,
  ): Promise<string> {
    const configuration = await this.getConfiguration();

    const url = client.buildEndSessionUrl(configuration, {
      post_logout_redirect_uri: postLogoutRedirectUri,
      ...(idToken ? { id_token_hint: idToken } : {}),
    });

    return url.toString();
  }

  private toExchangeResult(
    tokenResponse: Awaited<ReturnType<typeof client.authorizationCodeGrant>>,
  ): ExchangeResult {
    const claims = tokenResponse.claims();
    const now = Math.floor(Date.now() / 1000);

    if (!claims)
      throw new Error('Keycloak response did not include an ID token');

    const refreshExpiresIn = Number(
      (tokenResponse as unknown as { refresh_expires_in?: number })
        .refresh_expires_in ?? 1800,
    );

    const tokens: SessionTokens = {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token ?? '',
      idToken: tokenResponse.id_token,
      expiresAt: now + (tokenResponse.expires_in ?? 60),
      refreshExpiresAt: now + refreshExpiresIn,
    };

    const user: SessionUser = {
      subject: String(claims.sub),
      name: typeof claims.name === 'string' ? claims.name : undefined,
      email: typeof claims.email === 'string' ? claims.email : undefined,
    };

    return { tokens, user };
  }
}
