import { Product } from '../../domain/entities/Product';
import { IdType } from '../../domain/shared/IdType';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { DomainEvent, DomainEventName } from '../../domain/events/DomainEvent';
import { UseCase, Status } from '../contracts/UseCase';
import { ProductMapper, ProductPrimitives } from '../mappers/ProductMapper';

interface Input {
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

export class CreateProductUseCase implements UseCase<Input, Output> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: Input): Promise<Output> {
    const product = new Product(
      IdType.create(),
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
      DomainEventName.PRODUCT_CREATED,
      ProductMapper.toPrimitives(product),
      new Date(),
    );

    await this.productRepository.save(product, event);

    return {
      status: Status.SUCCESS,
      product: ProductMapper.toPrimitives(product),
    };
  }
}
