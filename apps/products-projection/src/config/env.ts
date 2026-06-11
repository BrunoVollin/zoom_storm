import dotenv from 'dotenv';

dotenv.config();

export const env = {
  kafka: {
    clientId: process.env.PRODUCTS_PROJECTION_KAFKA_CLIENT_ID || 'zoom-app',
    brokers: (process.env.PRODUCTS_PROJECTION_KAFKA_BROKERS ?? '').split(','),
    groupId:
      process.env.PRODUCTS_PROJECTION_KAFKA_GROUP_ID ||
      'products-projection-worker',
    topics: (process.env.PRODUCTS_PROJECTION_KAFKA_TOPICS ?? '').split(','),
  },
  mongo: {
    uri: process.env.PRODUCTS_PROJECTION_MONGO_URI || '',
    dbName: process.env.PRODUCTS_PROJECTION_MONGO_DB_NAME || '',
  },
};
