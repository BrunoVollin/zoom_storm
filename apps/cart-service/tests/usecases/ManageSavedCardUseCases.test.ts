import { Status } from '../../src/application/contracts/UseCase';
import { SetDefaultSavedCardUseCase } from '../../src/application/usecases/SetDefaultSavedCardUseCase';
import { UpdateSavedCardUseCase } from '../../src/application/usecases/UpdateSavedCardUseCase';
import { SavedCard } from '../../src/domain/entities/payment/SavedCard';
import { IdType } from '../../src/domain/shared/IdType';
import { InMemorySavedCardRepository } from '../helpers/InMemorySavedCardRepository';

describe('saved card management use cases', () => {
  let repository: InMemorySavedCardRepository;

  beforeEach(async () => {
    repository = new InMemorySavedCardRepository();
    await repository.save(
      new SavedCard(IdType.create('card-1'), IdType.create('user-1'), 'Visa', '4242', 'Bruno', '12/28', undefined, true),
    );
    await repository.save(
      new SavedCard(IdType.create('card-2'), IdType.create('user-1'), 'Mastercard', '5555', 'Bruno', '11/29'),
    );
  });

  it('updates editable metadata but preserves lastFour and ownership', async () => {
    const result = await new UpdateSavedCardUseCase(repository).execute({
      userId: 'user-1', cardId: 'card-2', brand: 'Mastercard Black', holderName: 'Bruno Almeida', expiry: '10/30',
    });

    expect(result).toMatchObject({
      status: Status.SUCCESS,
      card: { lastFour: '5555', brand: 'Mastercard Black', expiry: '10/30' },
    });
  });

  it('rejects updates and default changes from another user', async () => {
    const update = await new UpdateSavedCardUseCase(repository).execute({
      userId: 'user-2', cardId: 'card-1', brand: 'Visa', holderName: 'Other', expiry: '12/30',
    });
    const setDefault = await new SetDefaultSavedCardUseCase(repository).execute({
      userId: 'user-2', cardId: 'card-2',
    });

    expect(update).toMatchObject({ status: Status.ERROR, code: 'PAYMENT_METHOD_NOT_FOUND' });
    expect(setDefault).toMatchObject({ status: Status.ERROR, code: 'PAYMENT_METHOD_NOT_FOUND' });
  });

  it('sets exactly one default card', async () => {
    const result = await new SetDefaultSavedCardUseCase(repository).execute({
      userId: 'user-1', cardId: 'card-2',
    });

    expect(result.status).toBe(Status.SUCCESS);
    const cards = await repository.findByUserId(IdType.create('user-1'));
    expect(cards.filter((card) => card.isDefault())).toHaveLength(1);
    expect(cards.find((card) => card.id.toString() === 'card-2')?.isDefault()).toBe(true);
  });
});
