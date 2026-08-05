import { SavedCard } from '@src/domain/entities/payment/SavedCard';
import { SavedCardRepository } from '@src/domain/repositories/SavedCardRepository';
import { IdType } from '@src/domain/shared/IdType';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import { SavedCardMapper, SavedCardPrimitives } from '../mappers/SavedCardMapper';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';

export class AddSavedCardUseCase implements UseCase<Input, Output> {
  constructor(private readonly savedCardRepository: SavedCardRepository) {}

  async execute(input: Input): Promise<Output> {
    try {
      const card = new SavedCard(
        IdType.create(),
        IdType.create(input.userId),
        input.brand,
        input.lastFour,
        input.holderName,
        input.expiry,
      );

      await this.savedCardRepository.save(card);

      return { status: Status.SUCCESS, card: SavedCardMapper.toPrimitives(card) };
    } catch (error) {
      if (error instanceof Error) {
        return { status: Status.ERROR, message: error.message };
      }

      return handleUnexpectedError(error);
    }
  }
}

interface Input {
  userId: string;
  brand: string;
  lastFour: string;
  holderName: string;
  expiry: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  card: SavedCardPrimitives;
}

type Output = SuccessOutput | ErrorOutput;
