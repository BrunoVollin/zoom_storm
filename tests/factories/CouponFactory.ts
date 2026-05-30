import { CouponPercentByTime } from "../../src/domain/entities/coupon/Coupon";
import { IdType } from "../../src/domain/shared/IdType";
import { createIdFromString } from "./IdFactory";

export function createValidCoupon(
  overrides?: Partial<{
    id: IdType;
    name: string;
    today: Date;
    start: Date;
    end: Date;
    percent: number;
  }>,
): CouponPercentByTime {
  const defaults = {
    id: createIdFromString("coupon-1"),
    name: "10%",
    today: new Date("2026-05-30"),
    start: new Date("2026-05-01"),
    end: new Date("2026-06-30"),
    percent: 0.1,
  };

  return new CouponPercentByTime(
    overrides?.id ?? defaults.id,
    overrides?.name ?? defaults.name,
    overrides?.today ?? defaults.today,
    overrides?.start ?? defaults.start,
    overrides?.end ?? defaults.end,
    overrides?.percent ?? defaults.percent,
  );
}

export function createInvalidCoupon(
  overrides?: Partial<{
    id: IdType;
    name: string;
    today: Date;
    start: Date;
    end: Date;
    percent: number;
  }>,
): CouponPercentByTime {
  const defaults = {
    id: createIdFromString("coupon-invalid"),
    name: "10% Expired",
    today: new Date("2026-05-30"),
    start: new Date("1991-02-01"),
    end: new Date("1992-03-01"),
    percent: 0.1,
  };

  return new CouponPercentByTime(
    overrides?.id ?? defaults.id,
    overrides?.name ?? defaults.name,
    overrides?.today ?? defaults.today,
    overrides?.start ?? defaults.start,
    overrides?.end ?? defaults.end,
    overrides?.percent ?? defaults.percent,
  );
}
