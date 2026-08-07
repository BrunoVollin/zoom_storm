import { http } from "@/lib/http";
import type { AdminCoupon, CouponWriteInput } from "@/types/coupon";

export const couponService = {
  async list(): Promise<AdminCoupon[]> {
    const { data } = await http.get<{ coupons: AdminCoupon[] }>("/cart/admin/coupons");
    return data.coupons;
  },

  async create(input: CouponWriteInput): Promise<AdminCoupon> {
    const { data } = await http.post<{ coupon: AdminCoupon }>("/cart/admin/coupons", input);
    return data.coupon;
  },

  async update(id: string, input: CouponWriteInput): Promise<AdminCoupon> {
    const { data } = await http.put<{ coupon: AdminCoupon }>(`/cart/admin/coupons/${id}`, input);
    return data.coupon;
  },

  async remove(id: string): Promise<void> {
    await http.delete(`/cart/admin/coupons/${id}`);
  },
};
