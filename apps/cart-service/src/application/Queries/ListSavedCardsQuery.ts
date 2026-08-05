import { IdType } from '@src/domain/shared/IdType';
import { SavedCardRepository } from '@src/domain/repositories/SavedCardRepository';
import { Query } from '../contracts/Query';
import { Status } from '../contracts/UseCase';
import { SavedCardMapper, SavedCardPrimitives } from '../mappers/SavedCardMapper';

export class ListSavedCardsQuery implements Query<Input, Output> {
  constructor(private readonly savedCardRepository: SavedCardRepository) {}

  async execute(input: Input): Promise<Output> {
    const cards = await this.savedCardRepository.findByUserId(
      IdType.create(input.userId),
    );

    return {
      status: Status.SUCCESS,
      cards: cards.map((card) => SavedCardMapper.toPrimitives(card)),
    };
  }
}

interface Input {
  userId: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  cards: Array<SavedCardPrimitives>;
}

type Output = SuccessOutput;
