import { Product } from '../../domain/entities/Product';
import { ProductVariant } from '../../domain/entities/ProductVariant';
import { IdType } from '../../domain/shared/IdType';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { DomainEvent, DomainEventName } from '../../domain/events/DomainEvent';
import { UseCase, Status } from '../contracts/UseCase';
import { ProductMapper, ProductPrimitives } from '../mappers/ProductMapper';
import {
  InventoryError,
  InventoryErrorCode,
} from '../../domain/errors/InventoryError';

interface Input {
  productId: string;
  variantId: string;
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
  code?: InventoryErrorCode;
}

type Output = SuccessOutput | ErrorOutput;

export class UpdateProductVariantUseCase implements UseCase<Input, Output> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: Input): Promise<Output> {
    const existing = await this.productRepository.findById(
      IdType.create(input.productId),
    );
    if (!existing) {
      return { status: Status.ERROR, message: 'Product not found' };
    }

    const target = existing.variants.find(
      (v) => v.id.toString() === input.variantId,
    );
    if (!target) {
      return { status: Status.ERROR, message: 'Variant not found' };
    }

    // SKU is immutable after creation — historical CartItem/OrderItem
    // snapshots reference it by value.
    let variants: ProductVariant[];
    try {
      variants = existing.variants.map((v) =>
        v.id.toString() === input.variantId
          ? new ProductVariant(
              v.id,
              v.productId,
              v.sku,
              input.price,
              input.stock,
              input.name ?? v.name,
              input.isDefault ?? v.isDefault,
              v.reservedStock,
            )
          : v,
      );
    } catch (error) {
      if (
        error instanceof InventoryError &&
        error.code === InventoryErrorCode.INSUFFICIENT_STOCK
      ) {
        return { status: Status.ERROR, code: error.code, message: error.code };
      }
      throw error;
    }

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
