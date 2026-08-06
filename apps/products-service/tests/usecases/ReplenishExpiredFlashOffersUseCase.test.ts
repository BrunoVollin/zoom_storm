import { FlashOffer } from '../../src/domain/entities/FlashOffer';
import { FlashOfferRepository } from '../../src/domain/repositories/FlashOfferRepository';
import { IdType } from '../../src/domain/shared/IdType';
import { ReplenishExpiredFlashOffersUseCase } from '../../src/application/usecases/ReplenishExpiredFlashOffersUseCase';
import { Status } from '../../src/application/contracts/UseCase';

class FakeFlashOfferRepository implements FlashOfferRepository {
  offers: FlashOffer[] = [];

  async save(offer: FlashOffer): Promise<void> {
    this.offers = this.offers.filter((existing) => !existing.getId().equals(offer.getId()));
    this.offers.push(offer);
  }

  async findById(id: IdType): Promise<FlashOffer | null> {
    return this.offers.find((offer) => offer.getId().equals(id)) ?? null;
  }

  async findActive(now: Date = new Date()): Promise<FlashOffer[]> {
    return this.offers.filter((offer) => offer.isActive(now));
  }

  async findExpired(now: Date = new Date()): Promise<FlashOffer[]> {
    return this.offers.filter((offer) => offer.endsAt < now);
  }

  async findAll(): Promise<FlashOffer[]> {
    return this.offers;
  }

  async delete(id: IdType): Promise<void> {
    this.offers = this.offers.filter((offer) => !offer.getId().equals(id));
  }
}

describe('ReplenishExpiredFlashOffersUseCase', () => {
  const now = new Date('2026-08-06T12:00:00.000Z');

  it('creates a new 1-hour offer for each expired offer and removes the expired ones', async () => {
    const repository = new FakeFlashOfferRepository();
    const expiredOffer = new FlashOffer(
      IdType.create('expired-1'),
      IdType.create('product-1'),
      'Summer Blast Sale',
      20,
      new Date('2026-08-06T10:00:00.000Z'),
      new Date('2026-08-06T11:00:00.000Z'),
    );
    await repository.save(expiredOffer);

    const usecase = new ReplenishExpiredFlashOffersUseCase(repository);
    const output = await usecase.execute({ now });

    expect(output.status).toBe(Status.SUCCESS);
    if (output.status !== Status.SUCCESS) return;
    expect(output.replenishedCount).toBe(1);

    const remaining = await repository.findAll();
    expect(remaining).toHaveLength(1);

    const [newOffer] = remaining;
    expect(newOffer.getId().equals(expiredOffer.getId())).toBe(false);
    expect(newOffer.productId.equals(expiredOffer.productId)).toBe(true);
    expect(newOffer.title).toBe('Summer Blast Sale');
    expect(newOffer.discountPct).toBe(20);
    expect(newOffer.startsAt).toEqual(now);
    expect(newOffer.endsAt).toEqual(new Date(now.getTime() + 60 * 60 * 1000));
  });

  it('does nothing when there are no expired offers', async () => {
    const repository = new FakeFlashOfferRepository();
    const activeOffer = new FlashOffer(
      IdType.create('active-1'),
      IdType.create('product-1'),
      'Still Going Sale',
      10,
      new Date('2026-08-06T11:30:00.000Z'),
      new Date('2026-08-06T13:00:00.000Z'),
    );
    await repository.save(activeOffer);

    const usecase = new ReplenishExpiredFlashOffersUseCase(repository);
    const output = await usecase.execute({ now });

    expect(output.status).toBe(Status.SUCCESS);
    if (output.status !== Status.SUCCESS) return;
    expect(output.replenishedCount).toBe(0);

    const remaining = await repository.findAll();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].getId().equals(activeOffer.getId())).toBe(true);
  });

  it('defaults to the current time when now is not provided', async () => {
    const repository = new FakeFlashOfferRepository();
    const usecase = new ReplenishExpiredFlashOffersUseCase(repository);

    const output = await usecase.execute();

    expect(output.status).toBe(Status.SUCCESS);
    if (output.status !== Status.SUCCESS) return;
    expect(output.replenishedCount).toBe(0);
  });
});
