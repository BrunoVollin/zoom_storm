import { SavedCard } from '../entities/payment/SavedCard';
import { IdType } from '../shared/IdType';

export interface SavedCardRepository {
  /** Upserts the card and atomically clears the previous default when needed. */
  save(card: SavedCard): Promise<void>;
  findByUserId(userId: IdType): Promise<Array<SavedCard>>;
  findById(id: IdType): Promise<SavedCard | null>;
  delete(id: IdType): Promise<void>;
}
