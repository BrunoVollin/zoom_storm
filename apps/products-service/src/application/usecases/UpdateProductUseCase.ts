import { Product } from '../../domain/entities/Product';
import { IdType } from '../../domain/shared/IdType';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { DomainEvent, DomainEventName } from '../../domain/events/DomainEvent';
import { UseCase, Status } from '../contracts/UseCase';
import { ProductMapper, ProductPrimitives } from '../mappers/ProductMapper';

interface Input {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  stock: number;
  transportHeight: number;
  transportWidth: number;
  transportLength: number;
  weight: number;
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

export class UpdateProductUseCase implements UseCase<Input, Output> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: Input): Promise<Output> {
    const existing = await this.productRepository.findById(
      IdType.create(input.id),
    );
    if (!existing) {
      return { status: Status.ERROR, message: 'Product not found' };
    }

    const updated = new Product(
      existing.getId(),
      input.name,
      input.price,
      input.description,
      input.category,
      input.stock,
      input.transportHeight,
      input.transportWidth,
      input.transportLength,
      input.weight,
    );

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
