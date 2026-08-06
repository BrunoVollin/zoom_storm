import { CartItem } from '../../src/domain/entities/cart/CartItem';
import { createIdFromString } from '../factories/IdFactory';
import { createProduct, createTransport } from '../factories/ProductFactory';

describe('CartItem', () => {
  describe('getVolume', () => {
    it('multiplies the product volume (m3) by the quantity', () => {
      const product = createProduct({
        transport: createTransport(15, 13, 23),
      });
      const item = new CartItem(createIdFromString('item-1'), product, 2);

      expect(item.getVolume()).toBeCloseTo(0.004485 * 2, 6);
    });

    it('produces a plausible (non-astronomical) total volume for a typical product', () => {
      const product = createProduct({
        transport: createTransport(15, 13, 23),
      });
      const item = new CartItem(createIdFromString('item-1'), product, 1);

      // A single small product should be a small fraction of a cubic meter.
      expect(item.getVolume()).toBeLessThan(0.01);
      expect(item.getVolume()).toBeGreaterThan(0);
    });
  });

  describe('getWeight', () => {
    it('multiplies the product weight by the quantity (regression, unaffected by volume fix)', () => {
      const product = createProduct({ weight: 1.5 });
      const item = new CartItem(createIdFromString('item-1'), product, 3);

      expect(item.getWeight()).toBe(4.5);
    });
  });

  describe('getPrice', () => {
    it('multiplies the product price by the quantity (regression, unaffected by volume fix)', () => {
      const product = createProduct({ price: 1000 });
      const item = new CartItem(createIdFromString('item-1'), product, 2);

      expect(item.getPrice()).toBe(2000);
    });
  });
});
