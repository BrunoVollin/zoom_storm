
import { Coupon } from "../entities/coupon/Coupon";
import { IdType } from "../shared/IdType";

export interface CouponRepository {
  save(coupon: Coupon): Promise<void>;
  findById(id: IdType): Promise<Coupon | null>;
  findByIds(ids: Array<IdType>): Promise<Array<Coupon>>
}