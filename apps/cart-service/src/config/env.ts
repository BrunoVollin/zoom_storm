import dotenv from 'dotenv';

dotenv.config();

export const env = {
  http: {
    port: Number(process.env.CART_SERVICE_PORT) || 3000,
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
  mongo: {
    uri: process.env.CART_SERVICE_MONGO_URI || '',
    dbName: process.env.CART_SERVICE_MONGO_DB_NAME || '',
  },
  kafka: {
    clientId: process.env.CART_SERVICE_KAFKA_CLIENT_ID || 'cart-service',
    brokers: (process.env.CART_SERVICE_KAFKA_BROKERS ?? 'localhost:9022').split(
      ',',
    ),
  },
  keycloak: {
    issuerUrl: process.env.KEYCLOAK_ISSUER_URL || '',
    jwksUri: process.env.KEYCLOAK_JWKS_URI || '',
  },
  auth: {
    skip: process.env.CART_SERVICE_SKIP_AUTH === 'true',
  },
  order: {
    originCity: process.env.ORDER_ORIGIN_CITY || 'São Paulo',
  },
};
