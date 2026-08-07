import { SavedCardRepository } from '@src/domain/repositories/SavedCardRepository';
import { IdType } from '@src/domain/shared/IdType';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';

export class DeleteSavedCardUseCase implements UseCase<Input, Output> {
  constructor(private readonly savedCardRepository: SavedCardRepository) {}

  async execute(input: Input): Promise<Output> {
    try {
      const cardId = IdType.create(input.cardId);
      const card = await this.savedCardRepository.findById(cardId);

      if (!card || !card.belongsTo(IdType.create(input.userId))) {
        return { status: Status.ERROR, message: 'Card not found' };
      }

      await this.savedCardRepository.delete(cardId);
      if (card.isDefault()) {
        const replacement = (await this.savedCardRepository.findByUserId(card.userId))[0];
        if (replacement) {
          replacement.makeDefault();
          await this.savedCardRepository.save(replacement);
        }
      }

      return { status: Status.SUCCESS };
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
  cardId: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
}

type Output = SuccessOutput | ErrorOutput;
