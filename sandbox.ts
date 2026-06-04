import './register-env';

import { closeDatabaseConnections } from './apps/cart-service/src/infrastructure/database/prisma/prisma-connection';
import { PrismaCartRepository } from './apps/cart-service/src/infrastructure/database/prisma/repositories/PrismaCartRepository';
import { PrismaCouponRepository } from './apps/cart-service/src/infrastructure/database/prisma/repositories/PrismaCouponRepository';
import { PrismaProductRepository } from './apps/cart-service/src/infrastructure/database/prisma/repositories/PrismaProductRepository';
import { CreateCartUseCase } from './apps/cart-service/src/application/usecases/CreateCartUseCase';
import { IdType } from './apps/cart-service/src/domain/shared/IdType';
import { AddItemToCartUseCase } from './apps/cart-service/src/application/usecases/AddItemToCartUseCase';
import { KafkaEventPublisher } from './apps/cart-service/src/infrastructure/messaging/KafkaEventPublisher';
import { KafkaProducerClient } from './apps/cart-service/src/infrastructure/messaging/KafkaProducerClient';
import { createProduct } from './apps/cart-service/tests/factories/ProductFactory';

(async () => {
  try {
    console.log('🔄 Salvando produto...');
    const useCase = new CreateCartUseCase(
      new PrismaCartRepository(),
      new PrismaCouponRepository(),
      new KafkaEventPublisher(new KafkaProducerClient()),
      new PrismaProductRepository(),
    );

    // // create product
    // const product = createProduct();
    // await new PrismaProductRepository().save(product);

    const r = await useCase.execute({
      userId: 'user-5',
      products: [{ id: 'product-1', quantity: 2 }],
      coupons: [],
    });
    console.log(r);
    // const uc = new AddItemToCartUseCase(
    //   new PrismaProductRepository(),
    //   new PrismaCartRepository(),
    // );

    // uc;

    // const products = await new PrismaCartRepository().findById(
    //   IdType.create('fe34959c-a183-4334-b784-942783021608'),
    // );`

    // console.log(JSON.stringify(products, null, 2));
  } catch (error) {
    console.error('❌ Erro durante a execução do sandbox:', error);
  } finally {
    await closeDatabaseConnections();
    console.log('🔌 Conexões encerradas.');
  }
})();
