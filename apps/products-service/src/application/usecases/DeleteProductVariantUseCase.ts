import { Product } from '../../domain/entities/Product';
import { IdType } from '../../domain/shared/IdType';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { DomainEvent, DomainEventName } from '../../domain/events/DomainEvent';
import { UseCase, Status } from '../contracts/UseCase';
import { ProductMapper, ProductPrimitives } from '../mappers/ProductMapper';

interface Input {
  productId: string;
  variantId: string;
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

export class DeleteProductVariantUseCase implements UseCase<Input, Output> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: Input): Promise<Output> {
    const existing = await this.productRepository.findById(
      IdType.create(input.productId),
    );
    if (!existing) {
      return { status: Status.ERROR, message: 'Product not found' };
    }

    if (existing.variants.length <= 1) {
      return {
        status: Status.ERROR,
        message: 'Cannot delete the last remaining variant of a product',
      };
    }

    const target = existing.variants.find(
      (v) => v.id.toString() === input.variantId,
    );
    if (!target) {
      return { status: Status.ERROR, message: 'Variant not found' };
    }

    const variants = existing.variants.filter(
      (v) => v.id.toString() !== input.variantId,
    );

    const updated = new Product({
      ...existing,
      id: existing.getId(),
      variants,
      reviews: existing.reviews,
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
