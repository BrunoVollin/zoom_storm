import './register-env';

import { closeDatabaseConnections } from '@infrastructure/database/prisma/prisma-connection';
import { PrismaCartRepository } from '@infrastructure/database/prisma/repositories/PrismaCartRepository';
import { PrismaCouponRepository } from '@infrastructure/database/prisma/repositories/PrismaCouponRepository';
import { PrismaProductRepository } from '@infrastructure/database/prisma/repositories/PrismaProductRepository';
import { CreateCartUseCase } from '@application/usecases/CreateCartUseCase';
import { IdType } from '@src/domain/shared/IdType';
import { AddItemToCartUseCase } from '@src/application/usecases/AddItemToCartUseCase';

(async () => {
  try {
    // console.log('🔄 Salvando produto...');
    // const useCase = new CreateCartUseCase(
    //   new PrismaProductRepository(),
    //   new PrismaCouponRepository(),
    //   new PrismaCartRepository(),
    // );

    // const r = await useCase.execute({
    //   userId: 'user-1',
    //   products: [
    //     { id: 'product-1', quantity: 2 },
    //   ],
    //   coupons: [],
    // });

    const uc = new AddItemToCartUseCase(
      new PrismaProductRepository(),
      new PrismaCartRepository(),
    );

    uc;

    const products = await new PrismaCartRepository().findById(
      IdType.create('fe34959c-a183-4334-b784-942783021608'),
    );

    console.log(JSON.stringify(products, null, 2));
  } catch (error) {
    console.error('❌ Erro durante a execução do sandbox:', error);
  } finally {
    await closeDatabaseConnections();
    console.log('🔌 Conexões encerradas.');
  }
})();
