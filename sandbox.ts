import './register-env';

import { closeDatabaseConnections } from './apps/cart-service/src/infrastructure/database/prisma/prisma-connection';
import { PrismaCartRepository } from './apps/cart-service/src/infrastructure/database/prisma/repositories/PrismaCartRepository';
import { PrismaCouponRepository } from './apps/cart-service/src/infrastructure/database/prisma/repositories/PrismaCouponRepository';
import { PrismaProductRepository } from './apps/cart-service/src/infrastructure/database/prisma/repositories/PrismaProductRepository';
import { CreateCartUseCase } from './apps/cart-service/src/application/usecases/CreateCartUseCase';
import { AddItemToCartUseCase } from './apps/cart-service/src/application/usecases/AddItemToCartUseCase';
import { ApplyCouponUseCase } from './apps/cart-service/src/application/usecases/ApplyCouponUseCase';
import { CalculateShippingUseCase } from './apps/cart-service/src/application/usecases/CalculateShippingUseCase';
import { UpdateItemQuantityUseCase } from './apps/cart-service/src/application/usecases/UpdateItemQuantityUseCase';
import { RemoveItemFromCartUseCase } from './apps/cart-service/src/application/usecases/RemoveItemFromCartUseCase';
import { RemoveCouponUseCase } from './apps/cart-service/src/application/usecases/RemoveCouponUseCase';
import { CheckoutUseCase } from './apps/cart-service/src/application/usecases/CheckoutUseCase';
import { FreightRoadCalculator } from './apps/cart-service/src/domain/entities/freight/FreightCalculator';
import { KafkaEventPublisher } from './apps/cart-service/src/infrastructure/messaging/KafkaEventPublisher';
import { KafkaProducerClient } from './apps/cart-service/src/infrastructure/messaging/KafkaProducerClient';
import util from 'node:util';
import { createValidCoupon } from 'apps/cart-service/tests/factories/CouponFactory';
import { IdType } from '@src/domain/shared/IdType';

(async () => {
  try {
    // repositories
    const productRepository = new PrismaProductRepository();
    const cartRepository = new PrismaCartRepository();
    const couponRepository = new PrismaCouponRepository();
    const eventPublisher = new KafkaEventPublisher(new KafkaProducerClient());

    // ---------- Create Products ---------- //

    // await productRepository.save(
    //   createProduct({
    //     id: IdType.create('product-4'),
    //     name: 'Product 4',
    //     price: 4000,
    //   }),
    // );
    
    // ---------- Create Coupon ---------- //
    await couponRepository.save(
      createValidCoupon({
        id: IdType.create('coupon-1'),
      }),
    );

    // ---------- CreateCartUseCase ---------- //
    // const createCartUsecase = new CreateCartUseCase(
    //   cartRepository,
    //   couponRepository,
    //   productRepository,
    //   eventPublisher,
    // );

    // const r = await createCartUsecase.execute({
    //   userId: 'user-11',
    //   products: [{ id: 'product-1', quantity: 10 }],
    //   coupons: [],
    // });
    // console.log(
    //   util.inspect(r, {
    //     depth: null,
    //     colors: true,
    //     compact: false,
    //   }),
    // );

    // ---------- Exemplos de uso de cada use case ---------- //

    // 1) Adicionar itens ao carrinho
    // const addItemToCartUseCase = new AddItemToCartUseCase(
    //   productRepository,
    //   cartRepository,
    //   eventPublisher,
    // );
    // const addResult = await addItemToCartUseCase.execute({
    //   cartId: 'cart-id-aqui',
    //   products: [{ id: 'product-1', quantity: 2 }],
    // });

    // 2) Aplicar cupom
    const applyCouponUseCase = new ApplyCouponUseCase(
      cartRepository,
      couponRepository,
      eventPublisher,
    );
    const couponResult = await applyCouponUseCase.execute({
      cartId: 'c0e3b468-5e9e-42ba-8197-6c1ad95a7e59',
      couponId: 'coupon-1',
    });

    console.log(couponResult);

    // 3) Calcular frete
    // const calculateShippingUseCase = new CalculateShippingUseCase(
    //   cartRepository,
    //   new FreightRoadCalculator(),
    // );
    // const shippingResult = await calculateShippingUseCase.execute({
    //   cartId: 'cart-id-aqui',
    //   distance: 1000,
    // });

    // 4) Atualizar quantidade de um item
    // const updateItemQuantityUseCase = new UpdateItemQuantityUseCase(
    //   cartRepository,
    //   productRepository,
    // );
    // const updateResult = await updateItemQuantityUseCase.execute({
    //   cartId: 'cart-id-aqui',
    //   itemId: 'item-id-aqui',
    //   quantity: 5,
    // });

    // 5) Remover item do carrinho
    // const removeItemFromCartUseCase = new RemoveItemFromCartUseCase(
    //   cartRepository,
    // );
    // const removeItemResult = await removeItemFromCartUseCase.execute({
    //   cartId: 'cart-id-aqui',
    //   itemId: 'item-id-aqui',
    // });

    // 6) Remover cupom do carrinho
    // const removeCouponUseCase = new RemoveCouponUseCase(cartRepository);
    // const removeCouponResult = await removeCouponUseCase.execute({
    //   cartId: 'cart-id-aqui',
    //   couponId: 'coupon-1',
    // });

    // 7) Finalizar checkout
    // const checkoutUseCase = new CheckoutUseCase(cartRepository);
    // const checkoutResult = await checkoutUseCase.execute({
    //   cartId: 'cart-id-aqui',
    //   shipping: 2500,
    // });
  } catch (error) {
    console.error('❌ Erro durante a execução do sandbox:', error);
  } finally {
    await closeDatabaseConnections();
    console.log('🔌 Conexões encerradas.');
  }
})();
