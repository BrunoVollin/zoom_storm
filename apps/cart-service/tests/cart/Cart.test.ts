import { Product } from '../../src/domain/entities/product/Product';
import { CartItem } from '../../src/domain/entities/cart/CartItem';
import { Cart } from '../../src/domain/entities/cart/Cart';
import { IdType } from '../../src/domain/shared/IdType';
import { createIdFromString } from '../factories/IdFactory';
import { createProduct, createTransport } from '../factories/ProductFactory';
import {
  createInvalidCoupon,
  createValidCoupon,
} from '../factories/CouponFactory';

describe('Cart', () => {
  let userId: IdType;
  let cartId: IdType;
  let product1: Product;
  let product2: Product;

  beforeEach(() => {
    userId = createIdFromString('user-1');
    cartId = createIdFromString('cart-1');
    product1 = createProduct({
      id: createIdFromString('product-1'),
      name: 'Bluza',
      price: 1000,
    });
    product2 = createProduct({
      id: createIdFromString('product-2'),
      name: 'Bluza20',
      price: 2000,
      transport: createTransport(2, 2, 2),
    });

    jest.clearAllMocks();
  });

  describe('Add Items', () => {
    it('should count 1 item when adding one item', () => {
      const cart = new Cart(userId, cartId);

      cart.addItem(new CartItem(createIdFromString('item-1'), product1, 1));

      expect(cart.getItems().length).toBe(1);
      expect(cart.calcSubtotal()).toBe(1000);
    });

    it('should calculate subtotal correctly with multiple items', () => {
      const cart = new Cart(userId, cartId);

      cart.addItem(new CartItem(createIdFromString('item-1'), product1, 2));
      cart.addItem(new CartItem(createIdFromString('item-2'), product2, 1));

      expect(cart.getItems().length).toBe(2);
      expect(cart.calcSubtotal()).toBe(4000);
    });
  });

  describe('Remove Items', () => {
    it('should remove item and recalculate subtotal', () => {
      const cart = new Cart(userId, cartId);
      const itemId = createIdFromString('item-1');

      cart.addItem(new CartItem(itemId, product1, 2));
      cart.removeItem(itemId);

      expect(cart.getItems().length).toBe(0);
      expect(cart.calcSubtotal()).toBe(0);
    });
  });

  describe('Apply Valid Coupon', () => {
    it('should apply valid coupon and calculate correct total', () => {
      const cart = new Cart(userId, cartId);
      const validCoupon = createValidCoupon();

      cart.addCoupon(validCoupon);
      cart.addItem(new CartItem(createIdFromString('item-1'), product1, 1));

      const total = cart.calcTotal();

      expect(total).toBe(900);
    });
  });

  describe('Apply Expired Coupon', () => {
    it('should not apply expired coupon to total', () => {
      const cart = new Cart(userId, cartId);
      const expiredCoupon = createInvalidCoupon();

      cart.addCoupon(expiredCoupon);
      cart.addItem(new CartItem(createIdFromString('item-1'), product1, 1));

      expect(cart.calcTotal()).toBe(1000);
    });
  });
});
