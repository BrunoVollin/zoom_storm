import { IdType } from '../../domain/shared/IdType';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { DomainEvent, DomainEventName } from '../../domain/events/DomainEvent';
import { UseCase, Status } from '../contracts/UseCase';
import {
  InventoryError,
  InventoryErrorCode,
} from '../../domain/errors/InventoryError';

interface Input {
  id: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
}

interface ErrorOutput {
  status: Status.ERROR;
  message: string;
  code?: InventoryErrorCode;
}

type Output = SuccessOutput | ErrorOutput;

export class DeleteProductUseCase implements UseCase<Input, Output> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: Input): Promise<Output> {
    const id = IdType.create(input.id);

    const existing = await this.productRepository.findById(id);
    if (!existing || existing.isDeleted) {
      return { status: Status.ERROR, message: 'Product not found' };
    }

    let deleted;
    try {
      deleted = existing.softDelete();
    } catch (error) {
      if (
        error instanceof InventoryError &&
        error.code === InventoryErrorCode.PRODUCT_HAS_ACTIVE_RESERVATIONS
      ) {
        return { status: Status.ERROR, code: error.code, message: error.code };
      }
      throw error;
    }

    const event = new DomainEvent(
      DomainEventName.PRODUCT_DELETED,
      { id: input.id, deletedAt: deleted.deletedAt },
      new Date(),
    );

    await this.productRepository.save(deleted, event);

    return { status: Status.SUCCESS };
  }
}
