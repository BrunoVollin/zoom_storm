import { Kafka } from 'kafkajs';
import { MongoDbClient } from './src/config/mongodb';
import { ProductRepository } from './src/repository/product.repository';
import { ProductEventHandler } from './src/handlers/product-event.handler';
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

    const handler = new ProductEventHandler(productRepository);

    await consumer.connect();
    console.log('[Kafka] Consumer connected.');

    await consumer.subscribe({ topics: env.kafka.topics, fromBeginning: true });

    setupGracefulShutdown(consumer);

    await consumer.run({ eachMessage: handler.handle });
  } catch (error) {
    console.error('[Bootstrap] Fatal error starting the service:', error);
    process.exit(1);
  }
}

bootstrap();
