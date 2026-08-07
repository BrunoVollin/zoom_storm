import { serve } from '@hono/node-server';
import { env } from '../../config/env';
import { buildRouter } from './router';
import { PrismaCartRepository } from '../database/prisma/repositories/PrismaCartRepository';
import { PrismaCouponRepository } from '../database/prisma/repositories/PrismaCouponRepository';
import { PrismaOrderRepository } from '../database/prisma/repositories/PrismaOrderRepository';
import { PrismaWishlistRepository } from '../database/prisma/repositories/PrismaWishlistRepository';
import { PrismaLoyaltyRepository } from '../database/prisma/repositories/PrismaLoyaltyRepository';
import { PrismaUserProfileRepository } from '../database/prisma/repositories/PrismaUserProfileRepository';
import { PrismaSavedCardRepository } from '../database/prisma/repositories/PrismaSavedCardRepository';
import { MongoProductRepository } from '../database/mongodb/repositories/MongoProductRepository';
import { KafkaProducerClient } from '../messaging/KafkaProducerClient';
import { KafkaEventPublisher } from '../messaging/KafkaEventPublisher';
import { OutboxRelay } from '../messaging/OutboxRelay';
import { OrderDeliverySimulatorWorker } from '../messaging/OrderDeliverySimulatorWorker';
import { FreightRoadCalculator } from '../../domain/entities/freight/FreightCalculator';
import { ViaCepAdapter } from '../http/adapters/ViaCepAdapter';
import { CreateCartUseCase } from '../../application/usecases/CreateCartUseCase';
import { AddItemToCartUseCase } from '../../application/usecases/AddItemToCartUseCase';
import { RemoveItemFromCartUseCase } from '../../application/usecases/RemoveItemFromCartUseCase';
import { UpdateItemQuantityUseCase } from '../../application/usecases/UpdateItemQuantityUseCase';
import { ApplyCouponUseCase } from '../../application/usecases/ApplyCouponUseCase';
import { RemoveCouponUseCase } from '../../application/usecases/RemoveCouponUseCase';
import { CalculateShippingUseCase } from '../../application/usecases/CalculateShippingUseCase';
import { CheckoutUseCase } from '../../application/usecases/CheckoutUseCase';
import { UpdateOrderStatusUseCase } from '../../application/usecases/UpdateOrderStatusUseCase';
import { PayOrderUseCase } from '../../application/usecases/PayOrderUseCase';
import { AddToWishlistUseCase } from '../../application/usecases/AddToWishlistUseCase';
import { RemoveFromWishlistUseCase } from '../../application/usecases/RemoveFromWishlistUseCase';
import { GetLoyaltyBalanceQuery } from '../../application/Queries/GetLoyaltyBalanceQuery';
import { RedeemLoyaltyPointsUseCase } from '../../application/usecases/RedeemLoyaltyPointsUseCase';
import { GetUserProfileQuery } from '../../application/Queries/GetUserProfileQuery';
import { UpdateUserProfileUseCase } from '../../application/usecases/UpdateUserProfileUseCase';
import { ListSavedCardsQuery } from '../../application/Queries/ListSavedCardsQuery';
import { AddSavedCardUseCase } from '../../application/usecases/AddSavedCardUseCase';
import { DeleteSavedCardUseCase } from '../../application/usecases/DeleteSavedCardUseCase';
import { LookupCepQuery } from '../../application/Queries/LookupCepQuery';
import { closeDatabaseConnections } from '../database/prisma/prisma-connection';
import {
  mongoClient,
  closeMongoConnection,
} from '../database/mongodb/mongodb-connection';
import { MongoCartQueryRepository } from '../database/mongodb/repositories/MongoCartQueryRepository';
import { CartQuery } from '../../application/Queries/CartQuery';
import { ListOrdersQuery } from '../../application/Queries/ListOrdersQuery';
import { OrderQuery } from '../../application/Queries/OrderQuery';
import { ListWishlistQuery } from '../../application/Queries/ListWishlistQuery';

const PORT = env.http.port;

const cartRepository = new PrismaCartRepository();
const productRepository = new MongoProductRepository();
const couponRepository = new PrismaCouponRepository();
const orderRepository = new PrismaOrderRepository();
const wishlistRepository = new PrismaWishlistRepository();
const loyaltyRepository = new PrismaLoyaltyRepository();
const userProfileRepository = new PrismaUserProfileRepository();
const savedCardRepository = new PrismaSavedCardRepository();

const kafkaProducer = new KafkaProducerClient();
const eventPublisher = new KafkaEventPublisher(kafkaProducer);
const outboxRelay = new OutboxRelay(eventPublisher);

const updateOrderStatusUseCase = new UpdateOrderStatusUseCase(
  orderRepository,
  env.order.originCity,
);
const orderDeliverySimulatorWorker = new OrderDeliverySimulatorWorker(
  orderRepository,
  updateOrderStatusUseCase,
  env.order.transitStepMinutes * 60_000,
  env.order.simulatorPollIntervalMs,
);

const freightCalculator = new FreightRoadCalculator();
const cepLookupService = new ViaCepAdapter();

const cartQueryRepository = new MongoCartQueryRepository();

const app = buildRouter({
  getCart: new CartQuery(cartQueryRepository),
  createCart: new CreateCartUseCase(
    cartRepository,
    couponRepository,
    productRepository,
  ),
  addItemToCart: new AddItemToCartUseCase(productRepository, cartRepository),
  removeItemFromCart: new RemoveItemFromCartUseCase(cartRepository),
  updateItemQuantity: new UpdateItemQuantityUseCase(
    cartRepository,
    productRepository,
  ),
  applyCoupon: new ApplyCouponUseCase(cartRepository, couponRepository),
  removeCoupon: new RemoveCouponUseCase(cartRepository),
  calculateShipping: new CalculateShippingUseCase(
    cartRepository,
    freightCalculator,
    cepLookupService,
  ),
  checkout: new CheckoutUseCase(cartRepository, orderRepository, cepLookupService),
  listOrders: new ListOrdersQuery(orderRepository),
  getOrder: new OrderQuery(orderRepository),
  updateOrderStatus: updateOrderStatusUseCase,
  payOrder: new PayOrderUseCase(orderRepository, loyaltyRepository),
  listWishlist: new ListWishlistQuery(wishlistRepository),
  addToWishlist: new AddToWishlistUseCase(productRepository, wishlistRepository),
  removeFromWishlist: new RemoveFromWishlistUseCase(wishlistRepository),
  getLoyaltyBalance: new GetLoyaltyBalanceQuery(loyaltyRepository),
  redeemLoyaltyPoints: new RedeemLoyaltyPointsUseCase(
    cartRepository,
    couponRepository,
    loyaltyRepository,
  ),
  getUserProfile: new GetUserProfileQuery(userProfileRepository),
  updateUserProfile: new UpdateUserProfileUseCase(userProfileRepository),
  listSavedCards: new ListSavedCardsQuery(savedCardRepository),
  addSavedCard: new AddSavedCardUseCase(savedCardRepository),
  deleteSavedCard: new DeleteSavedCardUseCase(savedCardRepository),
  lookupCep: new LookupCepQuery(cepLookupService),
});

outboxRelay.start();

// orderDeliverySimulatorWorker only reads/writes Order via PrismaOrderRepository
// (Postgres), so it must not be gated by the Mongo connection promise below.
try {
  orderDeliverySimulatorWorker.start();
} catch (error) {
  console.error('Failed to start orderDeliverySimulatorWorker:', error);
}

// The HTTP server must not be gated behind the MongoDB connection promise:
// most cart-service routes (coupons, orders, checkout, saved cards, ...) are
// backed by Postgres/Prisma and don't depend on Mongo at all. Previously the
// whole process stayed silent (no log, no port bind) whenever the Mongo
// handshake stalled or never settled. Now the server always starts, and the
// Mongo connection is established in the background with its own logging so
// a failure is always visible instead of hanging the entire service.
const server = serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`cart-service HTTP API running on http://localhost:${PORT}`);
});

mongoClient
  .connect()
  .then(() => {
    console.log('cart-service connected to MongoDB');
  })
  .catch((error) => {
    console.error(
      'Failed to connect to MongoDB. Routes backed by Mongo (products, cart queries) will fail until connectivity is restored:',
      error,
    );
  });

async function shutdown() {
  server.close();
  outboxRelay.stop();
  orderDeliverySimulatorWorker.stop();
  await kafkaProducer.disconnect();
  await closeDatabaseConnections();
  await closeMongoConnection();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
