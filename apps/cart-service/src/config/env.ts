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
    brokers: (process.env.CART_SERVICE_KAFKA_BROKERS ?? 'localhost:9092').split(','),
  },
};
