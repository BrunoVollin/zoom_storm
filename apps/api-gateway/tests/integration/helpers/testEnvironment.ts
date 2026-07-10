import type { Hono } from 'hono';
import { serve } from '@hono/node-server';
import type { ServerType } from '@hono/node-server';
import { CartQuery } from '@application/Queries/CartQuery';
import { CreateCartUseCase } from '@application/usecases/CreateCartUseCase';
import { AddItemToCartUseCase } from '@application/usecases/AddItemToCartUseCase';
import { RemoveItemFromCartUseCase } from '@application/usecases/RemoveItemFromCartUseCase';
import { UpdateItemQuantityUseCase } from '@application/usecases/UpdateItemQuantityUseCase';
import { ApplyCouponUseCase } from '@application/usecases/ApplyCouponUseCase';
import { RemoveCouponUseCase } from '@application/usecases/RemoveCouponUseCase';
import { CalculateShippingUseCase } from '@application/usecases/CalculateShippingUseCase';
import { CheckoutUseCase } from '@application/usecases/CheckoutUseCase';
import { FreightRoadCalculator } from '@domain/entities/freight/FreightCalculator';
import {
  InMemoryProductStore,
  InMemoryProductRepository,
  InMemoryProductQueryRepository,
} from './inMemoryProductStore';
import {
  InMemoryCartRepository,
  InMemoryCartQueryRepository,
  InMemoryCartProductRepository,
} from './inMemoryCartRepositories';
import { InMemoryCouponRepository } from './inMemoryCouponRepository';

interface RunningServer {
  port: number;
  close: () => Promise<void>;
}

function startServer(app: Hono): Promise<RunningServer> {
  return new Promise((resolve) => {
    const server: ServerType = serve({ fetch: app.fetch, port: 0 }, (info) => {
      resolve({
        port: info.port,
        close: () => new Promise((res) => server.close(() => res())),
      });
    });
  });
}

export interface TestEnvironment {
  gatewayUrl: string;
  productStore: InMemoryProductStore;
  cartRepository: InMemoryCartRepository;
  couponRepository: InMemoryCouponRepository;
  stopProductsService: () => Promise<void>;
  stopCartService: () => Promise<void>;
  stop: () => Promise<void>;
}

/**
 * Boots real instances of the products-service, cart-service and api-gateway
 * Hono apps over real HTTP (via @hono/node-server on ephemeral ports), wired
 * with their real routers/controllers/use cases/domain logic.
 *
 * The only swapped pieces are the outermost infrastructure adapters:
 * Postgres/Mongo/Kafka are replaced by in-memory repositories and a no-op
 * event publisher, so the suite is hermetic and does not depend on the
 * docker-compose stack or on Kafka projection consumers to converge.
 */
export async function startTestEnvironment(): Promise<TestEnvironment> {
  // Ensure products-service admin routes and cart-service auth don't require
  // a real Keycloak token in the test run, regardless of the local .env file.
  process.env.PRODUCTS_SERVICE_SKIP_AUTH = 'true';
  process.env.CART_SERVICE_SKIP_AUTH = 'true';

  const { buildRouter: buildCartRouter } =
    await import('@infrastructure/http/router');

  const productStore = new InMemoryProductStore();
  const productRepository = new InMemoryProductRepository(productStore);
  const productQueryRepository = new InMemoryProductQueryRepository(
    productStore,
  );

  const { buildRouter: buildProductsRouter } =
    await import('../../../../products-service/src/infrastructure/http/router');
  const { ListProductsQuery } =
    await import('../../../../products-service/src/application/queries/ListProductsQuery');
  const { GetProductByIdQuery } =
    await import('../../../../products-service/src/application/queries/GetProductByIdQuery');
  const { CreateProductUseCase } =
    await import('../../../../products-service/src/application/usecases/CreateProductUseCase');
  const { UpdateProductUseCase } =
    await import('../../../../products-service/src/application/usecases/UpdateProductUseCase');
  const { DeleteProductUseCase } =
    await import('../../../../products-service/src/application/usecases/DeleteProductUseCase');

  const productsApp = buildProductsRouter({
    listProducts: new ListProductsQuery(productQueryRepository),
    getProductById: new GetProductByIdQuery(productQueryRepository),
    createProduct: new CreateProductUseCase(productRepository),
    updateProduct: new UpdateProductUseCase(productRepository),
    deleteProduct: new DeleteProductUseCase(productRepository),
  });

  const productsServer = await startServer(productsApp);

  const cartRepository = new InMemoryCartRepository();
  const cartQueryRepository = new InMemoryCartQueryRepository(cartRepository);
  const cartProductRepository = new InMemoryCartProductRepository(productStore);
  const couponRepository = new InMemoryCouponRepository();

  const cartApp = buildCartRouter({
    getCart: new CartQuery(cartQueryRepository),
    createCart: new CreateCartUseCase(
      cartRepository,
      couponRepository,
      cartProductRepository,
    ),
    addItemToCart: new AddItemToCartUseCase(
      cartProductRepository,
      cartRepository,
    ),
    removeItemFromCart: new RemoveItemFromCartUseCase(cartRepository),
    updateItemQuantity: new UpdateItemQuantityUseCase(
      cartRepository,
      cartProductRepository,
    ),
    applyCoupon: new ApplyCouponUseCase(cartRepository, couponRepository),
    removeCoupon: new RemoveCouponUseCase(cartRepository),
    calculateShipping: new CalculateShippingUseCase(
      cartRepository,
      new FreightRoadCalculator(),
    ),
    checkout: new CheckoutUseCase(cartRepository),
  });

  const cartServer = await startServer(cartApp);

  process.env.PRODUCTS_SERVICE_URL = `http://localhost:${productsServer.port}`;
  process.env.CART_SERVICE_URL = `http://localhost:${cartServer.port}`;

  const { buildRouter: buildGatewayRouter } =
    await import('../../../src/infrastructure/http/router');

  const gatewayApp = buildGatewayRouter();
  const gatewayServer = await startServer(gatewayApp);

  return {
    gatewayUrl: `http://localhost:${gatewayServer.port}`,
    productStore,
    cartRepository,
    couponRepository,
    stopProductsService: productsServer.close,
    stopCartService: cartServer.close,
    stop: async () => {
      await gatewayServer.close();
      await cartServer.close();
      await productsServer.close();
    },
  };
}
