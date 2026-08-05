import { FlashOffer } from '../entities/FlashOffer';
import { IdType } from '../shared/IdType';

export interface FlashOfferRepository {
  save(offer: FlashOffer): Promise<void>;
  findById(id: IdType): Promise<FlashOffer | null>;
  findActive(now?: Date): Promise<FlashOffer[]>;
  findAll(): Promise<FlashOffer[]>;
  delete(id: IdType): Promise<void>;
}
