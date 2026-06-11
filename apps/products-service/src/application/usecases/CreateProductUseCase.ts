import { Product } from '../../domain/entities/Product';
import { IdType } from '../../domain/shared/IdType';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import {
  DomainEvent,
  DomainEventName,
  EventPublisher,
} from '../../domain/events/DomainEvent';
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
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly eventPublisher: EventPublisher = {
      publish: async () => undefined,
    },
  ) {}

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
    );

    await this.productRepository.save(product);

    const event = new DomainEvent(
      DomainEventName.PRODUCT_CREATED,
      ProductMapper.toPrimitives(product),
      new Date(),
    );
    await this.eventPublisher.publish(event);

    return {
      status: Status.SUCCESS,
      product: ProductMapper.toPrimitives(product),
    };
  }
}
