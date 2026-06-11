import { Kafka } from 'kafkajs';
import { MongoDbClient } from './src/config/mongodb';

import { ProductRepository } from './src/repository/product.repository';
import { ProductSavedHandler } from './src/handlers/product-saved.handler';
import { setupGracefulShutdown } from './src/shutdown';
import { env } from './src/config/env';

const kafka = new Kafka({
  clientId: env.kafka.clientId,
  brokers: env.kafka.brokers,
});

const consumer = kafka.consumer({ groupId: env.kafka.groupId });
const mongoClient = new MongoDbClient(env.mongo.uri, env.mongo.dbName);

async function bootstrap() {
  try {
    const productRepository = new ProductRepository(mongoClient);
    await productRepository.init();
    console.log('[Database] MongoDB connected.');

    const productSavedHandler = new ProductSavedHandler(productRepository);

    await consumer.connect();
    console.log('[Kafka] Consumer connected.');

    await consumer.subscribe({ topics: env.kafka.topics, fromBeginning: true });

    setupGracefulShutdown(consumer);

    await consumer.run({
      eachMessage: productSavedHandler.handle,
    });
  } catch (error) {
    console.error('[Bootstrap] Fatal error starting the microservice:', error);
    process.exit(1);
  }
}

bootstrap();
