import { CouponFixedAmount } from '../../src/domain/entities/coupon/Coupon';
import { createIdFromString } from '../factories/IdFactory';

describe('CouponFixedAmount', () => {
  const start = new Date('2026-01-01T00:00:00.000Z');
  const end = new Date('2026-01-31T23:59:59.000Z');

  describe('isValid', () => {
    it('is valid when "today" falls within the start/end window', () => {
      const today = new Date('2026-01-15T00:00:00.000Z');
      const coupon = new CouponFixedAmount(
        createIdFromString('coupon-1'),
        'BLACKFRIDAY',
        today,
        start,
        end,
        500,
      );

      expect(coupon.isValid()).toBe(true);
    });

    it('is invalid before the start date', () => {
      const today = new Date('2025-12-31T00:00:00.000Z');
      const coupon = new CouponFixedAmount(
        createIdFromString('coupon-1'),
        'BLACKFRIDAY',
        today,
        start,
        end,
        500,
      );

      expect(coupon.isValid()).toBe(false);
    });

    it('is invalid after the end date', () => {
      const today = new Date('2026-02-01T00:00:00.000Z');
      const coupon = new CouponFixedAmount(
        createIdFromString('coupon-1'),
        'BLACKFRIDAY',
        today,
        start,
        end,
        500,
      );

      expect(coupon.isValid()).toBe(false);
    });
  });

  describe('getName', () => {
    it('returns the coupon name', () => {
      const coupon = new CouponFixedAmount(
        createIdFromString('coupon-1'),
        'BLACKFRIDAY',
        start,
        start,
        end,
        500,
      );

      expect(coupon.getName()).toBe('BLACKFRIDAY');
    });
  });

  describe('getDiscount', () => {
    it('returns the fixed amount when it is smaller than the total and the coupon is valid', () => {
      const today = new Date('2026-01-15T00:00:00.000Z');
      const coupon = new CouponFixedAmount(
        createIdFromString('coupon-1'),
        'BLACKFRIDAY',
        today,
        start,
        end,
        500,
      );

      expect(coupon.getDiscount(1000)).toBe(500);
    });

    it('caps the discount at the total when the fixed amount exceeds it', () => {
      const today = new Date('2026-01-15T00:00:00.000Z');
      const coupon = new CouponFixedAmount(
        createIdFromString('coupon-1'),
        'BLACKFRIDAY',
        today,
        start,
        end,
        5000,
      );

      expect(coupon.getDiscount(1000)).toBe(1000);
    });

    it('returns zero when the coupon is not valid', () => {
      const today = new Date('2026-02-01T00:00:00.000Z');
      const coupon = new CouponFixedAmount(
        createIdFromString('coupon-1'),
        'BLACKFRIDAY',
        today,
        start,
        end,
        500,
      );

      expect(coupon.getDiscount(1000)).toBe(0);
    });
  });
});
