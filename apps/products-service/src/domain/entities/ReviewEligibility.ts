import { IdType } from '../shared/IdType';

export class ReviewEligibility {
  constructor(
    readonly id: IdType,
    readonly userId: IdType,
    readonly orderId: IdType,
    readonly productId: IdType,
    readonly deliveredAt: Date,
    readonly createdAt: Date = new Date(),
  ) {
    if (
      !userId.toString().trim() ||
      !orderId.toString().trim() ||
      !productId.toString().trim() ||
      Number.isNaN(deliveredAt.getTime())
    ) {
      throw new Error('Review eligibility data is invalid');
    }
  }

  matches(userId: IdType, orderId: IdType, productId: IdType): boolean {
    return (
      this.userId.equals(userId) &&
      this.orderId.equals(orderId) &&
      this.productId.equals(productId)
    );
  }

  get naturalKey(): string {
    return `${this.userId.toString()}:${this.orderId.toString()}:${this.productId.toString()}`;
  }
}
