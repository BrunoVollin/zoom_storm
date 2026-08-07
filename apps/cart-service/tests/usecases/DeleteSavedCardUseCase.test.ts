import { DeleteSavedCardUseCase } from '../../src/application/usecases/DeleteSavedCardUseCase';
import { SavedCard } from '../../src/domain/entities/payment/SavedCard';
import { IdType } from '../../src/domain/shared/IdType';
import { Status } from '../../src/application/contracts/UseCase';
import { InMemorySavedCardRepository } from '../helpers/InMemorySavedCardRepository';

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
        undefined,
        true,
      ),
    );
  });

  it('promotes another card after deleting the default', async () => {
    await repository.save(
      new SavedCard(
        IdType.create('card-2'), IdType.create('user-1'), 'Visa', '1111', 'Bruno', '11/29',
      ),
    );

    await useCase.execute({ userId: 'user-1', cardId: 'card-1' });

    expect((await repository.findById(IdType.create('card-2')))?.isDefault()).toBe(true);
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
