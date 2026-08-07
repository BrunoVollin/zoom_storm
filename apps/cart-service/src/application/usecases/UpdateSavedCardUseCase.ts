import { SavedCardRepository } from '@src/domain/repositories/SavedCardRepository';
import { IdType } from '@src/domain/shared/IdType';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import { SavedCardMapper, SavedCardPrimitives } from '../mappers/SavedCardMapper';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';

export class UpdateSavedCardUseCase implements UseCase<Input, Output> {
  constructor(private readonly savedCardRepository: SavedCardRepository) {}

  async execute(input: Input): Promise<Output> {
    try {
      const card = await this.savedCardRepository.findById(IdType.create(input.cardId));
      if (!card || !card.belongsTo(IdType.create(input.userId))) {
        return {
          status: Status.ERROR,
          message: 'Card not found',
          code: 'PAYMENT_METHOD_NOT_FOUND',
        };
      }

      card.update(input.brand, input.holderName, input.expiry);
      await this.savedCardRepository.save(card);

      return { status: Status.SUCCESS, card: SavedCardMapper.toPrimitives(card) };
    } catch (error) {
      if (error instanceof Error) return { status: Status.ERROR, message: error.message };
      return handleUnexpectedError(error);
    }
  }
}

interface Input {
  userId: string;
  cardId: string;
  brand: string;
  holderName: string;
  expiry: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  card: SavedCardPrimitives;
}

type Output = SuccessOutput | ErrorOutput;
