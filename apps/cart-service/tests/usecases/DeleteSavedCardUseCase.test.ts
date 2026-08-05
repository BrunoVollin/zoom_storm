import { DeleteSavedCardUseCase } from '../../src/application/usecases/DeleteSavedCardUseCase';
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

describe('DeleteSavedCardUseCase', () => {
  let repository: InMemorySavedCardRepository;
  let useCase: DeleteSavedCardUseCase;

  beforeEach(async () => {
    repository = new InMemorySavedCardRepository();
    useCase = new DeleteSavedCardUseCase(repository);

    await repository.save(
      new SavedCard(
        IdType.create('card-1'),
        IdType.create('user-1'),
        'Visa',
        '4242',
        'Bruno Almeida',
        '12/28',
      ),
    );
  });

  it('deletes a card that belongs to the requesting user', async () => {
    const result = await useCase.execute({ userId: 'user-1', cardId: 'card-1' });

    expect(result.status).toBe(Status.SUCCESS);
    expect(await repository.findById(IdType.create('card-1'))).toBeNull();
  });

  it('returns ERROR and does not delete a card belonging to another user', async () => {
    const result = await useCase.execute({ userId: 'user-2', cardId: 'card-1' });

    expect(result.status).toBe(Status.ERROR);
    expect(await repository.findById(IdType.create('card-1'))).not.toBeNull();
  });

  it('returns ERROR for a card that does not exist', async () => {
    const result = await useCase.execute({ userId: 'user-1', cardId: 'missing' });

    expect(result.status).toBe(Status.ERROR);
  });
});
