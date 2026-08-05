import { Product } from '../../domain/entities/Product';
import { ProductReview } from '../../domain/entities/ProductReview';
import { IdType } from '../../domain/shared/IdType';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { DomainEvent, DomainEventName } from '../../domain/events/DomainEvent';
import { UseCase, Status } from '../contracts/UseCase';
import { ProductMapper, ProductPrimitives } from '../mappers/ProductMapper';

interface Input {
  productId: string;
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
}

type Output = SuccessOutput | ErrorOutput;

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export class CreateReviewUseCase implements UseCase<Input, Output> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: Input): Promise<Output> {
    const existing = await this.productRepository.findById(
      IdType.create(input.productId),
    );
    if (!existing) {
      return { status: Status.ERROR, message: 'Product not found' };
    }

    const newReview = new ProductReview(
      IdType.create(),
      existing.getId(),
      input.rating,
      input.comment,
      input.reviewerName,
      input.reviewerEmail,
    );

    const reviews = [...existing.reviews, newReview];

    const updated = new Product({
      ...existing,
      id: existing.getId(),
      variants: existing.variants,
      reviews,
      rating: average(reviews.map((r) => r.rating)),
    });

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
}
