import { Coupon } from '../entities/coupon/Coupon';
import { IdType } from '../shared/IdType';

export interface CouponRepository {
  save(coupon: Coupon): Promise<void>;
  findAll(): Promise<Array<Coupon>>;
  findById(id: IdType): Promise<Coupon | null>;
  findByIds(ids: Array<IdType>): Promise<Array<Coupon>>;
  /** Used by admin coupon management to enforce unique coupon names. */
  findByName(name: string): Promise<Coupon | null>;
  delete(id: IdType): Promise<void>;
}
