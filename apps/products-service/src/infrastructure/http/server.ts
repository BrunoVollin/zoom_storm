import { serve } from '@hono/node-server';
import { env } from '../../config/env';
import { buildRouter } from './router';
import { PrismaProductRepository } from '../database/prisma/repositories/PrismaProductRepository';
import { PrismaFlashOfferRepository } from '../database/prisma/repositories/PrismaFlashOfferRepository';
import { closeDatabaseConnections } from '../database/prisma/prisma-connection';
import {
  mongoClient,
  closeMongoConnection,
} from '../database/mongodb/mongodb-connection';
import { MongoProductQueryRepository } from '../database/mongodb/repositories/MongoProductQueryRepository';
import { KafkaProducerClient } from '../messaging/KafkaProducerClient';
import { KafkaEventPublisher } from '../messaging/KafkaEventPublisher';
import { OutboxRelay } from '../messaging/OutboxRelay';
import { CreateProductUseCase } from '../../application/usecases/CreateProductUseCase';
import { UpdateProductUseCase } from '../../application/usecases/UpdateProductUseCase';
import { DeleteProductUseCase } from '../../application/usecases/DeleteProductUseCase';
import { CreateProductVariantUseCase } from '../../application/usecases/CreateProductVariantUseCase';
import { UpdateProductVariantUseCase } from '../../application/usecases/UpdateProductVariantUseCase';
import { DeleteProductVariantUseCase } from '../../application/usecases/DeleteProductVariantUseCase';
import { CreateReviewUseCase } from '../../application/usecases/CreateReviewUseCase';
import { CreateFlashOfferUseCase } from '../../application/usecases/CreateFlashOfferUseCase';
import { UpdateFlashOfferUseCase } from '../../application/usecases/UpdateFlashOfferUseCase';
import { DeleteFlashOfferUseCase } from '../../application/usecases/DeleteFlashOfferUseCase';
import { ListProductsQuery } from '../../application/queries/ListProductsQuery';
import { GetProductByIdQuery } from '../../application/queries/GetProductByIdQuery';
import { ListCategoriesQuery } from '../../application/queries/ListCategoriesQuery';
import { ListActiveFlashOffersQuery } from '../../application/queries/ListActiveFlashOffersQuery';
import { ListFlashOffersQuery } from '../../application/queries/ListFlashOffersQuery';

const PORT = env.http.port;

const productRepository = new PrismaProductRepository();
const productQueryRepository = new MongoProductQueryRepository();
const flashOfferRepository = new PrismaFlashOfferRepository();

const kafkaProducer = new KafkaProducerClient();
const eventPublisher = new KafkaEventPublisher(kafkaProducer);
const outboxRelay = new OutboxRelay(eventPublisher);

const app = buildRouter({
  listProducts: new ListProductsQuery(productQueryRepository),
  getProductById: new GetProductByIdQuery(productQueryRepository),
  listCategories: new ListCategoriesQuery(productQueryRepository),
  createProduct: new CreateProductUseCase(productRepository),
  updateProduct: new UpdateProductUseCase(productRepository),
  deleteProduct: new DeleteProductUseCase(productRepository),
  createProductVariant: new CreateProductVariantUseCase(productRepository),
  updateProductVariant: new UpdateProductVariantUseCase(productRepository),
  deleteProductVariant: new DeleteProductVariantUseCase(productRepository),
  createReview: new CreateReviewUseCase(productRepository),
  listActiveFlashOffers: new ListActiveFlashOffersQuery(flashOfferRepository),
  listFlashOffers: new ListFlashOffersQuery(flashOfferRepository),
  createFlashOffer: new CreateFlashOfferUseCase(flashOfferRepository),
  updateFlashOffer: new UpdateFlashOfferUseCase(flashOfferRepository),
  deleteFlashOffer: new DeleteFlashOfferUseCase(flashOfferRepository),
});

mongoClient.connect().then(() => {
  outboxRelay.start();

  const server = serve({ fetch: app.fetch, port: PORT }, () => {
    console.log(
      `products-service HTTP API running on http://localhost:${PORT}`,
    );
  });

  async function shutdown() {
    server.close();
    outboxRelay.stop();
    await kafkaProducer.disconnect();
    await closeDatabaseConnections();
    await closeMongoConnection();
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
});
