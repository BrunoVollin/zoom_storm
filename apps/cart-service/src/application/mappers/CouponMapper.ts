import {
  Coupon,
  CouponFixedAmount,
  CouponPercentByTime,
  CouponType,
} from '@src/domain/entities/coupon/Coupon';

export class CouponMapper {
  static toPrimitives(coupon: Coupon) {
    return {
      id: coupon.id.toString(),
      name: coupon.getName(),
      type: coupon.getType(),
      start: coupon.start,
      end: coupon.end,
      version: coupon.version,
      deletedAt: coupon.deletedAt,
      isValid: coupon.isValid(),
      percent:
        coupon instanceof CouponPercentByTime ? coupon.percent : undefined,
      amount: coupon instanceof CouponFixedAmount ? coupon.amount : undefined,
    };
  }
}

export type CouponPrimitives = ReturnType<typeof CouponMapper.toPrimitives>;

export { CouponType };
