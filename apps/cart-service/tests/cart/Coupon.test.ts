import { CouponPercentByTime } from '../../src/domain/entities/coupon/Coupon';
import {
  createInvalidCoupon,
  createValidCoupon,
} from '../factories/CouponFactory';

describe('Coupon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Invalid Coupon', () => {
    it('should return false for invalid coupon', () => {
      const coupon = createInvalidCoupon();

      expect(coupon.isValid()).toBe(false);
    });

    it('should return zero discount for invalid coupon', () => {
      const coupon = createInvalidCoupon();

      const discount = coupon.getDiscount(100);

      expect(discount).toBe(0);
    });
  });

  describe('Valid Coupon', () => {
    it('should return true for valid coupon', () => {
      const coupon = createValidCoupon();

      expect(coupon.isValid()).toBe(true);
    });

    it('should return correct discount for valid coupon', () => {
      const coupon = createValidCoupon({
        percent: 0.2,
      });

      const discount = coupon.getDiscount(100);

      expect(discount).toBe(20);
    });

    it('should calculate discount based on percentage', () => {
      const coupon = createValidCoupon({ percent: 0.15 });

      const discount = coupon.getDiscount(200);

      expect(discount).toBe(30);
    });

    it('rounds percentage discounts to whole cents', () => {
      const coupon = createValidCoupon({ percent: 0.1 });

      expect(coupon.getDiscount(999)).toBe(100);
    });
  });

  describe('Time-based revalidation', () => {
    it('is valid when read (constructed) before the window expires', () => {
      const coupon = createValidCoupon({
        today: new Date('2026-06-15'),
        start: new Date('2026-06-01'),
        end: new Date('2026-06-30'),
      });

      expect(coupon.isValid()).toBe(true);
    });

    it('is invalid when read (constructed) after the same window expires', () => {
      const coupon = createValidCoupon({
        today: new Date('2026-07-01'),
        start: new Date('2026-06-01'),
        end: new Date('2026-06-30'),
      });

      expect(coupon.isValid()).toBe(false);
    });

    it('does not cache validity across instances - each read must pass its own current time', () => {
      const start = new Date('2026-06-01');
      const end = new Date('2026-06-30');

      const stillWithinWindow = new CouponPercentByTime(
        createValidCoupon().id,
        'promo',
        new Date('2026-06-15'),
        start,
        end,
        0.1,
      );
      const afterExpiration = new CouponPercentByTime(
        createValidCoupon().id,
        'promo',
        new Date('2026-07-05'),
        start,
        end,
        0.1,
      );

      expect(stillWithinWindow.isValid()).toBe(true);
      expect(afterExpiration.isValid()).toBe(false);
    });
  });
});
