import { Product } from '../../domain/entities/Product';
import { ProductVariant } from '../../domain/entities/ProductVariant';
import { IdType } from '../../domain/shared/IdType';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { DomainEvent, DomainEventName } from '../../domain/events/DomainEvent';
import { UseCase, Status } from '../contracts/UseCase';
import { ProductMapper, ProductPrimitives } from '../mappers/ProductMapper';

interface Input {
  productId: string;
  sku: string;
  name?: string;
  price: number;
  stock: number;
  isDefault?: boolean;
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

export class CreateProductVariantUseCase implements UseCase<Input, Output> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: Input): Promise<Output> {
    const existing = await this.productRepository.findById(
      IdType.create(input.productId),
    );
    if (!existing) {
      return { status: Status.ERROR, message: 'Product not found' };
    }

    const newVariant = new ProductVariant(
      IdType.create(),
      existing.getId(),
      input.sku,
      input.price,
      input.stock,
      input.name ?? null,
      input.isDefault ?? false,
    );

    const updated = new Product({
      ...existing,
      id: existing.getId(),
      variants: [...existing.variants, newVariant],
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
