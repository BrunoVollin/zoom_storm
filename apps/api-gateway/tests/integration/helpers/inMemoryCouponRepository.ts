import { Coupon } from '@domain/entities/coupon/Coupon';
import { IdType } from '@domain/shared/IdType';
import { CouponRepository } from '@domain/repositories/CouponRepository';

export class InMemoryCouponRepository implements CouponRepository {
  private readonly coupons = new Map<string, Coupon>();

  constructor(seed: Coupon[] = []) {
    seed.forEach((coupon) => this.coupons.set(coupon.id.toString(), coupon));
  }

  async save(coupon: Coupon): Promise<void> {
    this.coupons.set(coupon.id.toString(), coupon);
  }

  async findById(id: IdType): Promise<Coupon | null> {
    return this.coupons.get(id.toString()) ?? null;
  }

  async findByIds(ids: IdType[]): Promise<Coupon[]> {
    return ids
      .map((id) => this.coupons.get(id.toString()))
      .filter((coupon): coupon is Coupon => Boolean(coupon));
  }
}
