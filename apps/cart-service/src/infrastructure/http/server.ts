import { serve } from '@hono/node-server';
import { env } from '../../config/env';
import { buildRouter } from './router';
import { PrismaCartRepository } from '../database/prisma/repositories/PrismaCartRepository';
import { PrismaProductRepository } from '../database/prisma/repositories/PrismaProductRepository';
import { PrismaCouponRepository } from '../database/prisma/repositories/PrismaCouponRepository';
import { KafkaProducerClient } from '../messaging/KafkaProducerClient';
import { KafkaEventPublisher } from '../messaging/KafkaEventPublisher';
import { FreightRoadCalculator } from '../../domain/entities/freight/FreightCalculator';
import { CreateCartUseCase } from '../../application/usecases/CreateCartUseCase';
import { AddItemToCartUseCase } from '../../application/usecases/AddItemToCartUseCase';
import { RemoveItemFromCartUseCase } from '../../application/usecases/RemoveItemFromCartUseCase';
import { UpdateItemQuantityUseCase } from '../../application/usecases/UpdateItemQuantityUseCase';
import { ApplyCouponUseCase } from '../../application/usecases/ApplyCouponUseCase';
import { RemoveCouponUseCase } from '../../application/usecases/RemoveCouponUseCase';
import { CalculateShippingUseCase } from '../../application/usecases/CalculateShippingUseCase';
import { CheckoutUseCase } from '../../application/usecases/CheckoutUseCase';
import { closeDatabaseConnections } from '../database/prisma/prisma-connection';
import { mongoClient, closeMongoConnection } from '../database/mongodb/mongodb-connection';
import { MongoCartQueryRepository } from '../database/mongodb/repositories/MongoCartQueryRepository';
import { CartQuery } from '../../application/Queries/CartQuery';

const PORT = env.http.port;

const cartRepository = new PrismaCartRepository();
const productRepository = new PrismaProductRepository();
const couponRepository = new PrismaCouponRepository();

const kafkaProducer = new KafkaProducerClient();
const eventPublisher = new KafkaEventPublisher(kafkaProducer);

const freightCalculator = new FreightRoadCalculator();

const cartQueryRepository = new MongoCartQueryRepository();

const app = buildRouter({
  getCart: new CartQuery(cartQueryRepository),
  createCart: new CreateCartUseCase(cartRepository, couponRepository, productRepository, eventPublisher),
  addItemToCart: new AddItemToCartUseCase(productRepository, cartRepository, eventPublisher),
  removeItemFromCart: new RemoveItemFromCartUseCase(cartRepository, eventPublisher),
  updateItemQuantity: new UpdateItemQuantityUseCase(cartRepository, productRepository, eventPublisher),
  applyCoupon: new ApplyCouponUseCase(cartRepository, couponRepository, eventPublisher),
  removeCoupon: new RemoveCouponUseCase(cartRepository, eventPublisher),
  calculateShipping: new CalculateShippingUseCase(cartRepository, freightCalculator),
  checkout: new CheckoutUseCase(cartRepository, eventPublisher),
});

mongoClient.connect().then(() => {
  const server = serve({ fetch: app.fetch, port: PORT }, () => {
    console.log(`cart-service HTTP API running on http://localhost:${PORT}`);
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
