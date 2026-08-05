import dotenv from 'dotenv';

dotenv.config();

export const env = {
  http: {
    port: Number(process.env.NOTIFICATIONS_SERVICE_PORT) || 3002,
  },
  database: {
    url: process.env.NOTIFICATIONS_SERVICE_DATABASE_URL || '',
  },
  kafka: {
    clientId: process.env.NOTIFICATIONS_SERVICE_KAFKA_CLIENT_ID || 'notifications-service',
    brokers: (process.env.NOTIFICATIONS_SERVICE_KAFKA_BROKERS ?? '').split(','),
    groupId: process.env.NOTIFICATIONS_SERVICE_KAFKA_GROUP_ID || 'notifications-service-worker',
    topics: (process.env.NOTIFICATIONS_SERVICE_KAFKA_TOPICS ?? 'order-events').split(','),
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  keycloak: {
    issuerUrl: process.env.KEYCLOAK_ISSUER_URL || '',
    jwksUri: process.env.KEYCLOAK_JWKS_URI || '',
  },
  auth: {
    skip: process.env.NOTIFICATIONS_SERVICE_SKIP_AUTH === 'true',
  },
};
