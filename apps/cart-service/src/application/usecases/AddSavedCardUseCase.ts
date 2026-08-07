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
      const userId = IdType.create(input.userId);
      const currentCards = await this.savedCardRepository.findByUserId(userId);
      const card = new SavedCard(
        IdType.create(),
        userId,
        input.brand,
        input.lastFour,
        input.holderName,
        input.expiry,
        undefined,
        input.isDefault === true || currentCards.length === 0,
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
  isDefault?: boolean;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  card: SavedCardPrimitives;
}

type Output = SuccessOutput | ErrorOutput;
