import dotenv from 'dotenv';

dotenv.config();

export const env = {
  kafka: {
    clientId: process.env.CART_PROJECTION_KAFKA_CLIENT_ID || 'zoom-app',
    brokers: (process.env.CART_PROJECTION_KAFKA_BROKERS ?? '').split(','),
    groupId:
      process.env.CART_PROJECTION_KAFKA_GROUP_ID || 'cart-projection-worker',
    topics: (process.env.CART_PROJECTION_KAFKA_TOPICS ?? '').split(','),
  },
  mongo: {
    uri: process.env.CART_PROJECTION_MONGO_URI || '',
    dbName: process.env.CART_PROJECTION_MONGO_DB_NAME || '',
  },
};
