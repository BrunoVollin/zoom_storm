import { ReviewEligibility } from '../entities/ReviewEligibility';
import { IdType } from '../shared/IdType';

export interface ReviewEligibilityRepository {
  /**
   * Persists an eligibility only when its user/order/product natural key does
   * not exist yet. The boolean reports whether this call created the record.
   */
  saveIfAbsent(eligibility: ReviewEligibility): Promise<boolean>;

  findByUserOrderProduct(
    userId: IdType,
    orderId: IdType,
    productId: IdType,
  ): Promise<ReviewEligibility | null>;
}
