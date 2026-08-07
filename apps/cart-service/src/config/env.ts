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
  productsService: {
    url: process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3001',
    internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || '',
  },
  order: {
    originCity: process.env.ORDER_ORIGIN_CITY || 'São Paulo',
    // How long a paid order sits in each simulated transit step
    // (PAID -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED) before the
    // OrderDeliverySimulatorWorker advances it automatically.
    transitStepMinutes: Number(process.env.ORDER_TRANSIT_STEP_MINUTES) || 2,
    simulatorPollIntervalMs:
      Number(process.env.ORDER_SIMULATOR_POLL_INTERVAL_MS) || 30_000,
    expirationPollIntervalMs:
      Number(process.env.ORDER_EXPIRATION_POLL_INTERVAL_MS) || 30_000,
  },
};
