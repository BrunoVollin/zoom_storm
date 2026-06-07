export interface PendingAuthorization {
  state: string;
  nonce: string;
  codeVerifier: string;
  redirectUri: string;
}

export interface PendingAuthorizationStore {
  save(pending: PendingAuthorization, ttlSeconds: number): Promise<void>;
  consume(state: string): Promise<PendingAuthorization | null>;
}
