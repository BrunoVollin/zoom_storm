import { IdType } from '../../domain/shared/IdType';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import {
  DomainEvent,
  DomainEventName,
  EventPublisher,
} from '../../domain/events/DomainEvent';
import { UseCase, Status } from '../contracts/UseCase';

interface Input {
  id: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
}

interface ErrorOutput {
  status: Status.ERROR;
  message: string;
}

type Output = SuccessOutput | ErrorOutput;

export class DeleteProductUseCase implements UseCase<Input, Output> {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly eventPublisher: EventPublisher = {
      publish: async () => undefined,
    },
  ) {}

  async execute(input: Input): Promise<Output> {
    const id = IdType.create(input.id);

    const existing = await this.productRepository.findById(id);
    if (!existing) {
      return { status: Status.ERROR, message: 'Product not found' };
    }

    await this.productRepository.delete(id);

    const event = new DomainEvent(
      DomainEventName.PRODUCT_DELETED,
      { id: input.id },
      new Date(),
    );
    await this.eventPublisher.publish(event);

    return { status: Status.SUCCESS };
  }
}
