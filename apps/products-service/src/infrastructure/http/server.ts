import { serve } from '@hono/node-server';
import { env } from '../../config/env';
import { buildRouter } from './router';
import { PrismaProductRepository } from '../database/prisma/repositories/PrismaProductRepository';
import { closeDatabaseConnections } from '../database/prisma/prisma-connection';
import {
  mongoClient,
  closeMongoConnection,
} from '../database/mongodb/mongodb-connection';
import { MongoProductQueryRepository } from '../database/mongodb/repositories/MongoProductQueryRepository';
import { KafkaProducerClient } from '../messaging/KafkaProducerClient';
import { KafkaEventPublisher } from '../messaging/KafkaEventPublisher';
import { CreateProductUseCase } from '../../application/usecases/CreateProductUseCase';
import { UpdateProductUseCase } from '../../application/usecases/UpdateProductUseCase';
import { DeleteProductUseCase } from '../../application/usecases/DeleteProductUseCase';
import { ListProductsQuery } from '../../application/queries/ListProductsQuery';

const PORT = env.http.port;

const productRepository = new PrismaProductRepository();
const productQueryRepository = new MongoProductQueryRepository();

const kafkaProducer = new KafkaProducerClient();
const eventPublisher = new KafkaEventPublisher(kafkaProducer);

const app = buildRouter({
  listProducts: new ListProductsQuery(productQueryRepository),
  createProduct: new CreateProductUseCase(productRepository, eventPublisher),
  updateProduct: new UpdateProductUseCase(productRepository, eventPublisher),
  deleteProduct: new DeleteProductUseCase(productRepository, eventPublisher),
});

mongoClient.connect().then(() => {
  const server = serve({ fetch: app.fetch, port: PORT }, () => {
    console.log(
      `products-service HTTP API running on http://localhost:${PORT}`,
    );
  });

  async function shutdown() {
    server.close();
    await kafkaProducer.disconnect();
    await closeDatabaseConnections();
    await closeMongoConnection();
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
});
