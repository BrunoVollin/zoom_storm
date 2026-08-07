import { serve } from '@hono/node-server';
import { env } from '../../config/env';
import { buildRouter } from './router';
import { PrismaProductRepository } from '../database/prisma/repositories/PrismaProductRepository';
import { PrismaFlashOfferRepository } from '../database/prisma/repositories/PrismaFlashOfferRepository';
import { PrismaInventoryReservationRepository } from '../database/prisma/repositories/PrismaInventoryReservationRepository';
import { PrismaReviewEligibilityRepository } from '../database/prisma/repositories/PrismaReviewEligibilityRepository';
import { closeDatabaseConnections } from '../database/prisma/prisma-connection';
import {
  mongoClient,
  closeMongoConnection,
} from '../database/mongodb/mongodb-connection';
import { MongoProductQueryRepository } from '../database/mongodb/repositories/MongoProductQueryRepository';
import { KafkaProducerClient } from '../messaging/KafkaProducerClient';
import { KafkaEventPublisher } from '../messaging/KafkaEventPublisher';
import { OutboxRelay } from '../messaging/OutboxRelay';
import { FlashOfferReplenisherWorker } from '../workers/FlashOfferReplenisherWorker';
import { ReplenishExpiredFlashOffersUseCase } from '../../application/usecases/ReplenishExpiredFlashOffersUseCase';
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
import { ReserveInventoryUseCase } from '../../application/usecases/ReserveInventoryUseCase';
import { ConfirmInventoryReservationUseCase } from '../../application/usecases/ConfirmInventoryReservationUseCase';
import { ReleaseInventoryReservationUseCase } from '../../application/usecases/ReleaseInventoryReservationUseCase';
import { GetInventoryReservationUseCase } from '../../application/usecases/GetInventoryReservationUseCase';
import { ExpireInventoryReservationsUseCase } from '../../application/usecases/ExpireInventoryReservationsUseCase';
import { InventoryReservationExpirationWorker } from '../workers/InventoryReservationExpirationWorker';
import { RegisterDeliveredOrderReviewEligibilitiesUseCase } from '../../application/usecases/RegisterDeliveredOrderReviewEligibilitiesUseCase';
import { OrderReviewEligibilityHandler } from '../messaging/OrderReviewEligibilityHandler';
import { OrderReviewEligibilityConsumer } from '../messaging/OrderReviewEligibilityConsumer';

const PORT = env.http.port;

const productRepository = new PrismaProductRepository();
const productQueryRepository = new MongoProductQueryRepository();
const flashOfferRepository = new PrismaFlashOfferRepository();
const inventoryReservationRepository =
  new PrismaInventoryReservationRepository();
const reviewEligibilityRepository = new PrismaReviewEligibilityRepository();

const kafkaProducer = new KafkaProducerClient();
const eventPublisher = new KafkaEventPublisher(kafkaProducer);
const outboxRelay = new OutboxRelay(eventPublisher);
const orderReviewEligibilityConsumer = new OrderReviewEligibilityConsumer(
  new OrderReviewEligibilityHandler(
    new RegisterDeliveredOrderReviewEligibilitiesUseCase(
      reviewEligibilityRepository,
    ),
  ),
);

const replenishExpiredFlashOffersUseCase =
  new ReplenishExpiredFlashOffersUseCase(flashOfferRepository);
const flashOfferReplenisherWorker = new FlashOfferReplenisherWorker(
  replenishExpiredFlashOffersUseCase,
);
flashOfferReplenisherWorker.start();

const inventoryReservationExpirationWorker =
  new InventoryReservationExpirationWorker(
    new ExpireInventoryReservationsUseCase(inventoryReservationRepository),
    env.inventory.expirationPollIntervalMs,
  );
inventoryReservationExpirationWorker.start();

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
  createReview: new CreateReviewUseCase(
    productRepository,
    reviewEligibilityRepository,
  ),
  listActiveFlashOffers: new ListActiveFlashOffersQuery(flashOfferRepository),
  listFlashOffers: new ListFlashOffersQuery(flashOfferRepository),
  createFlashOffer: new CreateFlashOfferUseCase(flashOfferRepository),
  updateFlashOffer: new UpdateFlashOfferUseCase(flashOfferRepository),
  deleteFlashOffer: new DeleteFlashOfferUseCase(flashOfferRepository),
  reserveInventory: new ReserveInventoryUseCase(inventoryReservationRepository),
  confirmInventory: new ConfirmInventoryReservationUseCase(
    inventoryReservationRepository,
  ),
  releaseInventory: new ReleaseInventoryReservationUseCase(
    inventoryReservationRepository,
  ),
  getInventoryReservation: new GetInventoryReservationUseCase(
    inventoryReservationRepository,
  ),
});

mongoClient
  .connect()
  .then(async () => {
    outboxRelay.start();
    await orderReviewEligibilityConsumer.start();

    const server = serve({ fetch: app.fetch, port: PORT }, () => {
      console.log(
        `products-service HTTP API running on http://localhost:${PORT}`,
      );
    });

    async function shutdown() {
      server.close();
      outboxRelay.stop();
      flashOfferReplenisherWorker.stop();
      inventoryReservationExpirationWorker.stop();
      await orderReviewEligibilityConsumer.stop();
      await kafkaProducer.disconnect();
      await closeDatabaseConnections();
      await closeMongoConnection();
      process.exit(0);
    }

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  })
  .catch((error) => {
    console.error('[ProductsService] Fatal bootstrap error:', error);
    process.exit(1);
  });
