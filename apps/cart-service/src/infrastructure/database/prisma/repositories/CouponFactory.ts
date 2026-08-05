import {
  Coupon,
  CouponFixedAmount,
  CouponPercentByTime,
} from '../../../../domain/entities/coupon/Coupon';
import { IdType } from '../../../../domain/shared/IdType';

export interface CouponRow {
  id: string;
  name: string;
  start: Date;
  end: Date;
  type: string;
  percent: number | null;
  amount: number | null;
}

/**
 * Shared by `PrismaCouponRepository` and `PrismaCartRepository` (which also
 * reconstructs coupons attached to a cart) so the type→subclass mapping
 * lives in exactly one place.
 */
export function couponFromRow(row: CouponRow): Coupon {
  const id = IdType.create(row.id);

  if (row.type === 'FIXED') {
    return new CouponFixedAmount(
      id,
      row.name,
      new Date(),
      row.start,
      row.end,
      row.amount ?? 0,
    );
  }

  return new CouponPercentByTime(
    id,
    row.name,
    new Date(),
    row.start,
    row.end,
    row.percent ?? 0,
  );
}
