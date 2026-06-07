import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  isProduction: process.env.NODE_ENV === 'production',
  http: {
    port: Number(process.env.BFF_PORT) || 8088,
    baseUrl: process.env.BFF_BASE_URL || 'http://localhost:8088',
  },
  keycloak: {
    issuerUrl: process.env.KEYCLOAK_ISSUER_URL || '',
    clientId: process.env.KEYCLOAK_CLIENT_ID || '',
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
  },
  gateway: {
    url: process.env.GATEWAY_URL || 'http://localhost:8087',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  session: {
    cookieName: process.env.SESSION_COOKIE_NAME || '__Host-session',
    cookieSecret: process.env.COOKIE_SECRET || '',
    ttlSeconds: Number(process.env.SESSION_TTL_SECONDS) || 60 * 60 * 24 * 7,
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
};
