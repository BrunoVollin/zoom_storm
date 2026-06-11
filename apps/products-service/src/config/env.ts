import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  http: {
    port: Number(process.env.PRODUCTS_SERVICE_PORT) || 3001,
  },
  database: {
    url: process.env.PRODUCTS_SERVICE_DATABASE_URL || '',
  },
  mongo: {
    uri: process.env.PRODUCTS_SERVICE_MONGO_URI || '',
    dbName: process.env.PRODUCTS_SERVICE_MONGO_DB_NAME || '',
  },
  kafka: {
    clientId:
      process.env.PRODUCTS_SERVICE_KAFKA_CLIENT_ID || 'products-service',
    brokers: (
      process.env.PRODUCTS_SERVICE_KAFKA_BROKERS ?? 'localhost:9092'
    ).split(','),
  },
  keycloak: {
    issuerUrl: process.env.KEYCLOAK_ISSUER_URL || '',
    jwksUri: process.env.KEYCLOAK_JWKS_URI || '',
  },
  auth: {
    skip: process.env.PRODUCTS_SERVICE_SKIP_AUTH === 'true',
  },
};
