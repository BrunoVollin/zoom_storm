import { AddSavedCardUseCase } from '../../src/application/usecases/AddSavedCardUseCase';
import { SavedCard } from '../../src/domain/entities/payment/SavedCard';
import { SavedCardRepository } from '../../src/domain/repositories/SavedCardRepository';
import { IdType } from '../../src/domain/shared/IdType';
import { Status } from '../../src/application/contracts/UseCase';

class InMemorySavedCardRepository implements SavedCardRepository {
  private readonly cards = new Map<string, SavedCard>();

  async save(card: SavedCard): Promise<void> {
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

describe('AddSavedCardUseCase', () => {
  let repository: InMemorySavedCardRepository;
  let useCase: AddSavedCardUseCase;

  beforeEach(() => {
    repository = new InMemorySavedCardRepository();
    useCase = new AddSavedCardUseCase(repository);
  });

  it('saves a valid card for the user', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      brand: 'Visa',
      lastFour: '4242',
      holderName: 'Bruno Almeida',
      expiry: '12/28',
    });

    expect(result.status).toBe(Status.SUCCESS);
    if (result.status !== Status.SUCCESS) return;
    expect(result.card.lastFour).toBe('4242');

    const saved = await repository.findByUserId(IdType.create('user-1'));
    expect(saved).toHaveLength(1);
  });

  it('returns ERROR and does not persist for an invalid lastFour', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      brand: 'Visa',
      lastFour: '42',
      holderName: 'Bruno Almeida',
      expiry: '12/28',
    });

    expect(result.status).toBe(Status.ERROR);
    const saved = await repository.findByUserId(IdType.create('user-1'));
    expect(saved).toHaveLength(0);
  });
});
