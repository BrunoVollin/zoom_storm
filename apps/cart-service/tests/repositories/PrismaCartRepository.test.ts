import { Cart } from '../../src/domain/entities/cart/Cart';
import { CartItem } from '../../src/domain/entities/cart/CartItem';
import { createIdFromString } from '../factories/IdFactory';
import { createProduct } from '../factories/ProductFactory';
import { createValidCoupon } from '../factories/CouponFactory';

const cartFindUnique = jest.fn();
const cartCreate = jest.fn();
const cartUpdateMany = jest.fn();
const cartItemDeleteMany = jest.fn();
const cartItemUpsert = jest.fn();
const cartCouponDeleteMany = jest.fn();
const cartCouponUpsert = jest.fn();
const outboxEventCreate = jest.fn();

const tx = {
  cart: {
    findUnique: cartFindUnique,
    create: cartCreate,
    updateMany: cartUpdateMany,
  },
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
import { ConcurrencyConflictError } from '../../src/domain/errors/ConcurrencyConflictError';

describe('PrismaCartRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cartFindUnique.mockResolvedValue(null);
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
          where: {
            cartId_couponId: { cartId: 'cart-1', couponId: 'coupon-1' },
          },
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

  describe('optimistic locking', () => {
    it('creates the cart row without a version check when it does not exist yet', async () => {
      const cart = new Cart(
        createIdFromString('user-1'),
        createIdFromString('cart-1'),
      );

      cartFindUnique.mockResolvedValue(null);

      const repository = new PrismaCartRepository();
      await repository.save(cart);

      expect(cartCreate).toHaveBeenCalledWith({
        data: { id: 'cart-1', userId: 'user-1' },
      });
      expect(cartUpdateMany).not.toHaveBeenCalled();
    });

    it('bumps the version guarded by the version it was read with', async () => {
      const cart = new Cart(
        createIdFromString('user-1'),
        createIdFromString('cart-1'),
        3,
      );

      cartFindUnique.mockResolvedValue({ version: 3 });
      cartUpdateMany.mockResolvedValue({ count: 1 });

      const repository = new PrismaCartRepository();
      await repository.save(cart);

      expect(cartUpdateMany).toHaveBeenCalledWith({
        where: { id: 'cart-1', version: 3 },
        data: { version: { increment: 1 } },
      });
      expect(cartCreate).not.toHaveBeenCalled();
    });

    it('throws ConcurrencyConflictError when another write already bumped the version', async () => {
      const cart = new Cart(
        createIdFromString('user-1'),
        createIdFromString('cart-1'),
        3,
      );

      cartFindUnique.mockResolvedValue({ version: 4 });
      cartUpdateMany.mockResolvedValue({ count: 0 });

      const repository = new PrismaCartRepository();

      await expect(repository.save(cart)).rejects.toThrow(
        ConcurrencyConflictError,
      );
      expect(cartItemDeleteMany).not.toHaveBeenCalled();
    });
  });
});
