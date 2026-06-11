export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  idToken?: string;
  expiresAt: number;
  refreshExpiresAt: number;
}

export interface SessionUser {
  subject: string;
  name?: string;
  email?: string;
}

export interface Session {
  id: string;
  user: SessionUser;
  tokens: SessionTokens;
  createdAt: number;
}

export function isAccessTokenExpiring(
  session: Session,
  thresholdSeconds: number,
): boolean {
  const now = Math.floor(Date.now() / 1000);

  return session.tokens.expiresAt - now <= thresholdSeconds;
}

export function isRefreshTokenExpired(session: Session): boolean {
  const now = Math.floor(Date.now() / 1000);

  return session.tokens.refreshExpiresAt <= now;
}
