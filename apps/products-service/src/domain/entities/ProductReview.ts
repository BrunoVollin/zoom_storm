import { IdType } from '../shared/IdType';
import { ReviewError, ReviewErrorCode } from '../errors/ReviewError';

export class ProductReview {
  constructor(
    readonly id: IdType,
    readonly productId: IdType,
    readonly rating: number,
    readonly comment: string,
    readonly reviewerName: string,
    readonly reviewerEmail: string,
    readonly createdAt: Date = new Date(),
    /** Null only for reviews created before purchase authorization existed. */
    readonly userId: IdType | null = null,
    /** Null only for reviews created before purchase authorization existed. */
    readonly orderId: IdType | null = null,
  ) {
    if (
      rating < 1 ||
      rating > 5 ||
      !Number.isInteger(rating) ||
      !comment.trim() ||
      !reviewerName.trim() ||
      !reviewerEmail.trim() ||
      (userId === null) !== (orderId === null)
    ) {
      throw new ReviewError(ReviewErrorCode.INVALID_REVIEW);
    }
  }

  getId(): IdType {
    return this.id;
  }

  belongsToPurchase(userId: IdType, orderId: IdType): boolean {
    return (
      this.userId !== null &&
      this.orderId !== null &&
      this.userId.equals(userId) &&
      this.orderId.equals(orderId)
    );
  }
}
