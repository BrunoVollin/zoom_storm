import { AddSavedCardUseCase } from '../../src/application/usecases/AddSavedCardUseCase';
import { IdType } from '../../src/domain/shared/IdType';
import { Status } from '../../src/application/contracts/UseCase';
import { InMemorySavedCardRepository } from '../helpers/InMemorySavedCardRepository';

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
    expect(result.card.isDefault).toBe(true);

    const saved = await repository.findByUserId(IdType.create('user-1'));
    expect(saved).toHaveLength(1);
  });

  it('supports multiple cards and changes the default when requested', async () => {
    await useCase.execute({
      userId: 'user-1', brand: 'Visa', lastFour: '4242', holderName: 'Bruno', expiry: '12/28',
    });
    await useCase.execute({
      userId: 'user-1', brand: 'Mastercard', lastFour: '5555', holderName: 'Bruno', expiry: '11/29', isDefault: true,
    });

    const cards = await repository.findByUserId(IdType.create('user-1'));
    expect(cards).toHaveLength(2);
    expect(cards.find((card) => card.getLastFour() === '5555')?.isDefault()).toBe(true);
    expect(cards.find((card) => card.getLastFour() === '4242')?.isDefault()).toBe(false);
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
