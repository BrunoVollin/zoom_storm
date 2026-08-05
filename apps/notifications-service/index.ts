import { Kafka } from 'kafkajs';
import { env } from './src/config/env';
import { createRedisConnection } from './src/infrastructure/redis/redis-connection';
import { RedisNotificationPublisher } from './src/infrastructure/redis/RedisNotificationPublisher';
import { PrismaNotificationRepository } from './src/infrastructure/database/prisma/repositories/PrismaNotificationRepository';
import { closeDatabaseConnections } from './src/infrastructure/database/prisma/prisma-connection';
import { CreateNotificationFromOrderEventUseCase } from './src/application/usecases/CreateNotificationFromOrderEventUseCase';
import { OrderEventHandler } from './src/infrastructure/messaging/order-event.handler';

const kafka = new Kafka({
  clientId: env.kafka.clientId,
  brokers: env.kafka.brokers,
});

const consumer = kafka.consumer({ groupId: env.kafka.groupId });
const redis = createRedisConnection();

function setupGracefulShutdown() {
  const handleShutdown = async (signal: string): Promise<void> => {
    console.log(`\n[System] Received ${signal}. Disconnecting...`);
    try {
      await consumer.disconnect();
      await redis.quit();
      await closeDatabaseConnections();
      console.log('[System] Disconnected safely.');
      process.exit(0);
    } catch (err) {
      console.error('[System] Error during shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}

async function bootstrap() {
  try {
    const notificationRepository = new PrismaNotificationRepository();
    const notificationPublisher = new RedisNotificationPublisher(redis);
    const createNotificationFromOrderEventUseCase = new CreateNotificationFromOrderEventUseCase(
      notificationRepository,
      notificationPublisher,
    );
    const orderEventHandler = new OrderEventHandler(createNotificationFromOrderEventUseCase);

    await consumer.connect();
    console.log('[Kafka] Consumer connected.');

    await consumer.subscribe({ topics: env.kafka.topics, fromBeginning: true });

    setupGracefulShutdown();

    await consumer.run({
      eachMessage: orderEventHandler.handle,
    });
  } catch (error) {
    console.error('[Bootstrap] Fatal error starting the microservice:', error);
    process.exit(1);
  }
}

bootstrap();
