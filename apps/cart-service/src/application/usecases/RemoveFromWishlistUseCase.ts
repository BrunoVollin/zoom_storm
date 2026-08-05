import { WishlistRepository } from '../../domain/repositories/WishlistRepository';
import { IdType } from '../../domain/shared/IdType';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';

export class RemoveFromWishlistUseCase implements UseCase<Input, Output> {
  constructor(private readonly wishlistRepository: WishlistRepository) {}

  async execute(input: Input): Promise<Output> {
    try {
      await this.wishlistRepository.remove(
        IdType.create(input.userId),
        IdType.create(input.productId),
      );

      return { status: Status.SUCCESS };
    } catch (error) {
      return handleUnexpectedError(error);
    }
  }
}

interface Input {
  userId: string;
  productId: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
}

type Output = SuccessOutput | ErrorOutput;
