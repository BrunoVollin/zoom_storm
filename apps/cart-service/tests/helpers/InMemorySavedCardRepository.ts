import { SavedCard } from '../../src/domain/entities/payment/SavedCard';
import { SavedCardRepository } from '../../src/domain/repositories/SavedCardRepository';
import { IdType } from '../../src/domain/shared/IdType';

export class InMemorySavedCardRepository implements SavedCardRepository {
  readonly cards = new Map<string, SavedCard>();

  async save(card: SavedCard): Promise<void> {
    if (card.isDefault()) {
      for (const current of this.cards.values()) {
        if (current.belongsTo(card.userId) && !current.id.equals(card.id)) {
          current.clearDefault();
        }
      }
    }
    this.cards.set(card.id.toString(), card);
  }

  async findByUserId(userId: IdType): Promise<Array<SavedCard>> {
    return [...this.cards.values()].filter((card) => card.belongsTo(userId));
  }

  async findById(id: IdType): Promise<SavedCard | null> {
    return this.cards.get(id.toString()) ?? null;
  }

  async delete(id: IdType): Promise<void> {
    this.cards.delete(id.toString());
  }
}
