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
import { PrismaSavedAddressRepository } from '../database/prisma/repositories/PrismaSavedAddressRepository';
import { PrismaPaymentAttemptRepository } from '../database/prisma/repositories/PrismaPaymentAttemptRepository';
import { PrismaLoyaltyReservationRepository } from '../database/prisma/repositories/PrismaLoyaltyReservationRepository';
import { PrismaShippingQuoteRepository } from '../database/prisma/repositories/PrismaShippingQuoteRepository';
import { MongoProductRepository } from '../database/mongodb/repositories/MongoProductRepository';
import { KafkaProducerClient } from '../messaging/KafkaProducerClient';
import { KafkaEventPublisher } from '../messaging/KafkaEventPublisher';
import { OutboxRelay } from '../messaging/OutboxRelay';
import { OrderDeliverySimulatorWorker } from '../messaging/OrderDeliverySimulatorWorker';
import { FreightRoadCalculator } from '../../domain/entities/freight/FreightCalculator';
import { ViaCepAdapter } from '../http/adapters/ViaCepAdapter';
import { HttpInventoryReservationService } from '../http/adapters/HttpInventoryReservationService';
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
import { CancelOrderUseCase } from '../../application/usecases/CancelOrderUseCase';
import { ExpireOrderUseCase } from '../../application/usecases/ExpireOrderUseCase';
import { AddToWishlistUseCase } from '../../application/usecases/AddToWishlistUseCase';
import { RemoveFromWishlistUseCase } from '../../application/usecases/RemoveFromWishlistUseCase';
import { GetLoyaltyBalanceQuery } from '../../application/Queries/GetLoyaltyBalanceQuery';
import { RedeemLoyaltyPointsUseCase } from '../../application/usecases/RedeemLoyaltyPointsUseCase';
import { RemoveLoyaltyRedemptionUseCase } from '../../application/usecases/RemoveLoyaltyRedemptionUseCase';
import { RevalidateCartCouponsUseCase } from '../../application/usecases/RevalidateCartCouponsUseCase';
import { ReserveLoyaltyPointsUseCase } from '../../application/usecases/ReserveLoyaltyPointsUseCase';
import { ConsumeLoyaltyReservationUseCase } from '../../application/usecases/ConsumeLoyaltyReservationUseCase';
import { ReleaseLoyaltyReservationUseCase } from '../../application/usecases/ReleaseLoyaltyReservationUseCase';
import { ExpireLoyaltyReservationsUseCase } from '../../application/usecases/ExpireLoyaltyReservationsUseCase';
import { GetUserProfileQuery } from '../../application/Queries/GetUserProfileQuery';
import { UpdateUserProfileUseCase } from '../../application/usecases/UpdateUserProfileUseCase';
import { ListSavedCardsQuery } from '../../application/Queries/ListSavedCardsQuery';
import { AddSavedCardUseCase } from '../../application/usecases/AddSavedCardUseCase';
import { DeleteSavedCardUseCase } from '../../application/usecases/DeleteSavedCardUseCase';
import { UpdateSavedCardUseCase } from '../../application/usecases/UpdateSavedCardUseCase';
import { SetDefaultSavedCardUseCase } from '../../application/usecases/SetDefaultSavedCardUseCase';
import { ListSavedAddressesQuery } from '../../application/Queries/ListSavedAddressesQuery';
import { AddSavedAddressUseCase } from '../../application/usecases/AddSavedAddressUseCase';
import { UpdateSavedAddressUseCase } from '../../application/usecases/UpdateSavedAddressUseCase';
import { DeleteSavedAddressUseCase } from '../../application/usecases/DeleteSavedAddressUseCase';
import { SetDefaultSavedAddressUseCase } from '../../application/usecases/SetDefaultSavedAddressUseCase';
import { ListCouponsUseCase } from '../../application/usecases/ListCouponsUseCase';
import { CreateCouponUseCase } from '../../application/usecases/CreateCouponUseCase';
import { UpdateCouponUseCase } from '../../application/usecases/UpdateCouponUseCase';
import { DeleteCouponUseCase } from '../../application/usecases/DeleteCouponUseCase';
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
import { OrderExpirationWorker } from '../workers/OrderExpirationWorker';

const PORT = env.http.port;

const cartRepository = new PrismaCartRepository();
const productRepository = new MongoProductRepository();
const couponRepository = new PrismaCouponRepository();
const orderRepository = new PrismaOrderRepository();
const wishlistRepository = new PrismaWishlistRepository();
const loyaltyRepository = new PrismaLoyaltyRepository();
const userProfileRepository = new PrismaUserProfileRepository();
const savedCardRepository = new PrismaSavedCardRepository();
const savedAddressRepository = new PrismaSavedAddressRepository();
const paymentAttemptRepository = new PrismaPaymentAttemptRepository();
const loyaltyReservationRepository = new PrismaLoyaltyReservationRepository();
const shippingQuoteRepository = new PrismaShippingQuoteRepository();
const inventoryReservationService = new HttpInventoryReservationService(
  env.productsService.url,
  env.productsService.internalServiceToken,
);

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
const releaseLoyaltyReservationUseCase = new ReleaseLoyaltyReservationUseCase(
  loyaltyReservationRepository,
);
const expireOrderUseCase = new ExpireOrderUseCase(
  orderRepository,
  inventoryReservationService,
  loyaltyReservationRepository,
  releaseLoyaltyReservationUseCase,
);
const expireLoyaltyReservationsUseCase = new ExpireLoyaltyReservationsUseCase(
  loyaltyReservationRepository,
);
const orderExpirationWorker = new OrderExpirationWorker(
  orderRepository,
  expireOrderUseCase,
  env.order.expirationPollIntervalMs,
  expireLoyaltyReservationsUseCase,
);

const freightCalculator = new FreightRoadCalculator();
const cepLookupService = new ViaCepAdapter();

const cartQueryRepository = new MongoCartQueryRepository();

const revalidateCartCouponsUseCase = new RevalidateCartCouponsUseCase(
  cartRepository,
  couponRepository,
);
const reserveLoyaltyPointsUseCase = new ReserveLoyaltyPointsUseCase(
  loyaltyRepository,
  loyaltyReservationRepository,
);
const consumeLoyaltyReservationUseCase = new ConsumeLoyaltyReservationUseCase(
  loyaltyRepository,
  loyaltyReservationRepository,
);

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
    savedAddressRepository,
    freightCalculator,
    shippingQuoteRepository,
  ),
  checkout: new CheckoutUseCase(
    cartRepository,
    orderRepository,
    savedAddressRepository,
    inventoryReservationService,
    shippingQuoteRepository,
    revalidateCartCouponsUseCase,
    reserveLoyaltyPointsUseCase,
  ),
  listOrders: new ListOrdersQuery(orderRepository),
  getOrder: new OrderQuery(orderRepository),
  updateOrderStatus: updateOrderStatusUseCase,
  payOrder: new PayOrderUseCase(
    orderRepository,
    loyaltyRepository,
    savedCardRepository,
    paymentAttemptRepository,
    inventoryReservationService,
    loyaltyReservationRepository,
    consumeLoyaltyReservationUseCase,
  ),
  cancelOrder: new CancelOrderUseCase(
    orderRepository,
    inventoryReservationService,
    loyaltyReservationRepository,
    releaseLoyaltyReservationUseCase,
  ),
  listWishlist: new ListWishlistQuery(wishlistRepository),
  addToWishlist: new AddToWishlistUseCase(productRepository, wishlistRepository),
  removeFromWishlist: new RemoveFromWishlistUseCase(wishlistRepository),
  getLoyaltyBalance: new GetLoyaltyBalanceQuery(loyaltyRepository),
  redeemLoyaltyPoints: new RedeemLoyaltyPointsUseCase(
    cartRepository,
    loyaltyRepository,
  ),
  removeLoyaltyRedemption: new RemoveLoyaltyRedemptionUseCase(cartRepository),
  getUserProfile: new GetUserProfileQuery(userProfileRepository),
  updateUserProfile: new UpdateUserProfileUseCase(userProfileRepository),
  listSavedCards: new ListSavedCardsQuery(savedCardRepository),
  addSavedCard: new AddSavedCardUseCase(savedCardRepository),
  updateSavedCard: new UpdateSavedCardUseCase(savedCardRepository),
  deleteSavedCard: new DeleteSavedCardUseCase(savedCardRepository),
  setDefaultSavedCard: new SetDefaultSavedCardUseCase(savedCardRepository),
  listSavedAddresses: new ListSavedAddressesQuery(savedAddressRepository),
  addSavedAddress: new AddSavedAddressUseCase(savedAddressRepository),
  updateSavedAddress: new UpdateSavedAddressUseCase(savedAddressRepository),
  deleteSavedAddress: new DeleteSavedAddressUseCase(savedAddressRepository),
  setDefaultSavedAddress: new SetDefaultSavedAddressUseCase(
    savedAddressRepository,
  ),
  lookupCep: new LookupCepQuery(cepLookupService),
  listCoupons: new ListCouponsUseCase(couponRepository),
  createCoupon: new CreateCouponUseCase(couponRepository),
  updateCoupon: new UpdateCouponUseCase(couponRepository),
  deleteCoupon: new DeleteCouponUseCase(couponRepository),
});

outboxRelay.start();

// orderDeliverySimulatorWorker only reads/writes Order via PrismaOrderRepository
// (Postgres), so it must not be gated by the Mongo connection promise below.
try {
  orderDeliverySimulatorWorker.start();
  orderExpirationWorker.start();
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
  orderExpirationWorker.stop();
  await kafkaProducer.disconnect();
  await closeDatabaseConnections();
  await closeMongoConnection();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
