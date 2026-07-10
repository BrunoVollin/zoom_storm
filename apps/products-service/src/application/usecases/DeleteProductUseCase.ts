import { IdType } from '../../domain/shared/IdType';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { DomainEvent, DomainEventName } from '../../domain/events/DomainEvent';
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
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: Input): Promise<Output> {
    const id = IdType.create(input.id);

    const existing = await this.productRepository.findById(id);
    if (!existing) {
      return { status: Status.ERROR, message: 'Product not found' };
    }

    const event = new DomainEvent(
      DomainEventName.PRODUCT_DELETED,
      { id: input.id },
      new Date(),
    );

    await this.productRepository.delete(id, event);

    return { status: Status.SUCCESS };
  }
}
