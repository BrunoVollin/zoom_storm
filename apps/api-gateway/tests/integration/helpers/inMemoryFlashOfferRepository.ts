import { FlashOffer } from '../../../../products-service/src/domain/entities/FlashOffer';
import { IdType } from '../../../../products-service/src/domain/shared/IdType';
import { FlashOfferRepository } from '../../../../products-service/src/domain/repositories/FlashOfferRepository';

export class InMemoryFlashOfferRepository implements FlashOfferRepository {
  private readonly offers = new Map<string, FlashOffer>();

  async save(offer: FlashOffer): Promise<void> {
    this.offers.set(offer.getId().toString(), offer);
  }

  async findById(id: IdType): Promise<FlashOffer | null> {
    return this.offers.get(id.toString()) ?? null;
  }

  async findActive(now: Date = new Date()): Promise<FlashOffer[]> {
    return this.findAllSync().filter((offer) => offer.isActive(now));
  }

  async findAll(): Promise<FlashOffer[]> {
    return this.findAllSync();
  }

  async delete(id: IdType): Promise<void> {
    this.offers.delete(id.toString());
  }

  private findAllSync(): FlashOffer[] {
    return Array.from(this.offers.values());
  }
}
