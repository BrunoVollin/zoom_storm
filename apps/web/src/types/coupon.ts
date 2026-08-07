export type CouponType = "PERCENT" | "FIXED";

export interface AdminCoupon {
  id: string;
  name: string;
  type: CouponType;
  start: string;
  end: string;
  isValid: boolean;
  percent?: number;
  amount?: number;
}

export interface CouponWriteInput {
  name: string;
  type: CouponType;
  start: string;
  end: string;
  percent?: number;
  amount?: number;
}
