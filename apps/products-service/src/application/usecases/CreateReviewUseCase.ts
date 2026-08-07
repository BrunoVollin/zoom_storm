import { Product } from '../../domain/entities/Product';
import { ProductReview } from '../../domain/entities/ProductReview';
import { IdType } from '../../domain/shared/IdType';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { DomainEvent, DomainEventName } from '../../domain/events/DomainEvent';
import { UseCase, Status } from '../contracts/UseCase';
import { ProductMapper, ProductPrimitives } from '../mappers/ProductMapper';
import { ReviewEligibilityRepository } from '../../domain/repositories/ReviewEligibilityRepository';
import { ReviewError, ReviewErrorCode } from '../../domain/errors/ReviewError';

export interface CreateReviewInput {
  productId: string;
  userId: string;
  orderId: string;
  rating: number;
  comment: string;
  reviewerName: string;
  reviewerEmail: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  product: ProductPrimitives;
}

interface ErrorOutput {
  status: Status.ERROR;
  message: string;
  code?: ReviewErrorCode;
}

export type CreateReviewOutput = SuccessOutput | ErrorOutput;

export class CreateReviewUseCase
  implements UseCase<CreateReviewInput, CreateReviewOutput>
{
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly reviewEligibilityRepository: ReviewEligibilityRepository,
  ) {}

  async execute(input: CreateReviewInput): Promise<CreateReviewOutput> {
    const userId = IdType.create(input.userId);
    const orderId = IdType.create(input.orderId);
    const productId = IdType.create(input.productId);
    const existing = await this.productRepository.findById(productId);
    if (!existing || existing.isDeleted) {
      return { status: Status.ERROR, message: 'Product not found' };
    }

    const eligibility =
      await this.reviewEligibilityRepository.findByUserOrderProduct(
        userId,
        orderId,
        productId,
      );
    if (!eligibility) {
      return this.error(ReviewErrorCode.PURCHASE_NOT_DELIVERED);
    }

    let updated: Product;
    try {
      const newReview = new ProductReview(
        IdType.create(),
        existing.getId(),
        input.rating,
        input.comment,
        input.reviewerName,
        input.reviewerEmail,
        new Date(),
        userId,
        orderId,
      );
      updated = existing.addReview(newReview);
    } catch (error) {
      if (error instanceof ReviewError) return this.error(error.code);
      throw error;
    }

    const event = new DomainEvent(
      DomainEventName.PRODUCT_UPDATED,
      ProductMapper.toPrimitives(updated),
      new Date(),
    );

    await this.productRepository.save(updated, event);

    return {
      status: Status.SUCCESS,
      product: ProductMapper.toPrimitives(updated),
    };
  }

  private error(code: ReviewErrorCode): CreateReviewOutput {
    return { status: Status.ERROR, code, message: code };
  }
}
