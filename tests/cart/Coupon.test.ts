import {
  createInvalidCoupon,
  createValidCoupon,
} from "../factories/CouponFactory";

describe("Coupon", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Invalid Coupon", () => {
    it("should return false for invalid coupon", () => {
      const coupon = createInvalidCoupon();

      expect(coupon.isValid()).toBe(false);
    });

    it("should return zero discount for invalid coupon", () => {
      const coupon = createInvalidCoupon();

      const discount = coupon.getDiscount(100);

      expect(discount).toBe(0);
    });
  });

  describe("Valid Coupon", () => {
    it("should return true for valid coupon", () => {
      const coupon = createValidCoupon();

      expect(coupon.isValid()).toBe(true);
    });

    it("should return correct discount for valid coupon", () => {
      const coupon = createValidCoupon({
        percent: 0.2,
      });

      const discount = coupon.getDiscount(100);

      expect(discount).toBe(20);
    });

    it("should calculate discount based on percentage", () => {
      const coupon = createValidCoupon({ percent: 0.15 });

      const discount = coupon.getDiscount(200);

      expect(discount).toBe(30);
    });
  });
});
