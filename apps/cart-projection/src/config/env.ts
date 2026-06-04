import dotenv from 'dotenv';
dotenv.config();

export const env = {
  kafka: {
    clientId: 'zoom-app',
    brokers: (process.env.KAFKA_BROKERS ?? '').split(','),
    groupId: `teste-grupo-${Date.now()}`,
    topics: ['cart-events'],
  },
  mongo: {
    uri: process.env.MONGO_URI || '',
    dbName: process.env.MONGO_DB_NAME || '',
  },
};

console.log(env);
