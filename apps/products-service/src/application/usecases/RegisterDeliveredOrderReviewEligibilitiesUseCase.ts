import { ReviewEligibility } from '../../domain/entities/ReviewEligibility';
import { ReviewEligibilityRepository } from '../../domain/repositories/ReviewEligibilityRepository';
import { IdType } from '../../domain/shared/IdType';
import { Status, UseCase } from '../contracts/UseCase';

export type ReviewOrderStatus =
  | 'CREATED'
  | 'PAID'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface RegisterDeliveredOrderReviewEligibilitiesInput {
  orderId: string;
  userId: string;
  status: ReviewOrderStatus;
  items: Array<{ productId: string }>;
  deliveredAt: Date;
}

export type RegisterDeliveredOrderReviewEligibilitiesOutput =
  | {
      status: Status.SUCCESS;
      createdCount: number;
      eligibleProductCount: number;
    }
  | { status: Status.ERROR; message: string };

export class RegisterDeliveredOrderReviewEligibilitiesUseCase implements UseCase<
  RegisterDeliveredOrderReviewEligibilitiesInput,
  RegisterDeliveredOrderReviewEligibilitiesOutput
> {
  constructor(private readonly repository: ReviewEligibilityRepository) {}

  async execute(
    input: RegisterDeliveredOrderReviewEligibilitiesInput,
  ): Promise<RegisterDeliveredOrderReviewEligibilitiesOutput> {
    if (input.status !== 'DELIVERED') {
      return {
        status: Status.SUCCESS,
        createdCount: 0,
        eligibleProductCount: 0,
      };
    }

    try {
      const userId = IdType.create(input.userId);
      const orderId = IdType.create(input.orderId);
      const uniqueProductIds = [
        ...new Set(input.items.map((item) => item.productId)),
      ];
      let createdCount = 0;

      for (const productId of uniqueProductIds) {
        const eligibility = new ReviewEligibility(
          IdType.create(),
          userId,
          orderId,
          IdType.create(productId),
          input.deliveredAt,
        );

        if (await this.repository.saveIfAbsent(eligibility)) {
          createdCount += 1;
        }
      }

      return {
        status: Status.SUCCESS,
        createdCount,
        eligibleProductCount: uniqueProductIds.length,
      };
    } catch {
      return {
        status: Status.ERROR,
        message: 'An unexpected error occurred. Please try again later.',
      };
    }
  }
}
