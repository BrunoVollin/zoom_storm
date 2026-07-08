import { Cart } from '../../src/domain/entities/cart/Cart';
import { CartItem } from '../../src/domain/entities/cart/CartItem';
import { createIdFromString } from '../factories/IdFactory';
import { createProduct } from '../factories/ProductFactory';
import { createValidCoupon } from '../factories/CouponFactory';

const cartUpsert = jest.fn();
const cartItemDeleteMany = jest.fn();
const cartItemUpsert = jest.fn();
const cartCouponDeleteMany = jest.fn();
const cartCouponUpsert = jest.fn();
const outboxEventCreate = jest.fn();

const tx = {
  cart: { upsert: cartUpsert },
  cartItem: { deleteMany: cartItemDeleteMany, upsert: cartItemUpsert },
  cartCoupon: { deleteMany: cartCouponDeleteMany, upsert: cartCouponUpsert },
  outboxEvent: { create: outboxEventCreate },
};

jest.mock('../../src/infrastructure/database/prisma/prisma-connection', () => ({
  prisma: {
    $transaction: (callback: (tx: unknown) => Promise<void>) => callback(tx),
  },
}));

import { PrismaCartRepository } from '../../src/infrastructure/database/prisma/repositories/PrismaCartRepository';

describe('PrismaCartRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('deletes only the items/coupons that were removed instead of wiping everything', async () => {
      const cart = new Cart(
        createIdFromString('user-1'),
        createIdFromString('cart-1'),
      );
      const product = createProduct({ id: createIdFromString('product-1') });

      cart.addItem(new CartItem(createIdFromString('item-1'), product, 2));
      cart.addCoupon(createValidCoupon());

      const repository = new PrismaCartRepository();
      await repository.save(cart);

      expect(cartItemDeleteMany).toHaveBeenCalledWith({
        where: { cartId: 'cart-1', id: { notIn: ['item-1'] } },
      });
      expect(cartCouponDeleteMany).toHaveBeenCalledWith({
        where: { cartId: 'cart-1', couponId: { notIn: ['coupon-1'] } },
      });
    });

    it('upserts each remaining item and coupon instead of recreating them', async () => {
      const cart = new Cart(
        createIdFromString('user-1'),
        createIdFromString('cart-1'),
      );
      const product = createProduct({ id: createIdFromString('product-1') });

      cart.addItem(new CartItem(createIdFromString('item-1'), product, 2));
      cart.addCoupon(createValidCoupon());

      const repository = new PrismaCartRepository();
      await repository.save(cart);

      expect(cartItemUpsert).toHaveBeenCalledTimes(1);
      expect(cartItemUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'item-1' } }),
      );

      expect(cartCouponUpsert).toHaveBeenCalledTimes(1);
      expect(cartCouponUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { cartId_couponId: { cartId: 'cart-1', couponId: 'coupon-1' } },
        }),
      );
    });

    it('deletes every existing item/coupon when the cart ends up empty', async () => {
      const cart = new Cart(
        createIdFromString('user-1'),
        createIdFromString('cart-1'),
      );

      const repository = new PrismaCartRepository();
      await repository.save(cart);

      expect(cartItemDeleteMany).toHaveBeenCalledWith({
        where: { cartId: 'cart-1', id: { notIn: [] } },
      });
      expect(cartCouponDeleteMany).toHaveBeenCalledWith({
        where: { cartId: 'cart-1', couponId: { notIn: [] } },
      });
      expect(cartItemUpsert).not.toHaveBeenCalled();
      expect(cartCouponUpsert).not.toHaveBeenCalled();
    });
  });
});
