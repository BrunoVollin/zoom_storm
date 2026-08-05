import { UpdateUserProfileUseCase } from '../../src/application/usecases/UpdateUserProfileUseCase';
import { UserProfile } from '../../src/domain/entities/profile/UserProfile';
import { UserProfileRepository } from '../../src/domain/repositories/UserProfileRepository';
import { IdType } from '../../src/domain/shared/IdType';
import { Status } from '../../src/application/contracts/UseCase';

class InMemoryUserProfileRepository implements UserProfileRepository {
  private readonly profiles = new Map<string, UserProfile>();

  async findByUserId(userId: IdType): Promise<UserProfile | null> {
    return this.profiles.get(userId.toString()) ?? null;
  }

  async save(profile: UserProfile): Promise<void> {
    this.profiles.set(profile.userId.toString(), profile);
  }
}

const validAddress = {
  street: 'Rua das Flores',
  number: '123',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  zip: '01310-100',
};

describe('UpdateUserProfileUseCase', () => {
  let repository: InMemoryUserProfileRepository;
  let useCase: UpdateUserProfileUseCase;

  beforeEach(() => {
    repository = new InMemoryUserProfileRepository();
    useCase = new UpdateUserProfileUseCase(repository);
  });

  it('creates a profile when the user has none yet', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      fullName: 'Bruno Almeida',
      document: '12345678900',
      address: validAddress,
    });

    expect(result.status).toBe(Status.SUCCESS);
    if (result.status !== Status.SUCCESS) return;
    expect(result.profile.fullName).toBe('Bruno Almeida');
    expect(result.profile.address.city).toBe('São Paulo');

    const saved = await repository.findByUserId(IdType.create('user-1'));
    expect(saved?.getFullName()).toBe('Bruno Almeida');
  });

  it('updates the existing profile in place instead of creating a new one', async () => {
    await useCase.execute({
      userId: 'user-1',
      fullName: 'Bruno Almeida',
      document: '12345678900',
      address: validAddress,
    });

    const result = await useCase.execute({
      userId: 'user-1',
      fullName: 'Bruno A. Silva',
      document: '98765432100',
      address: { ...validAddress, city: 'Rio de Janeiro', state: 'RJ' },
    });

    expect(result.status).toBe(Status.SUCCESS);
    if (result.status !== Status.SUCCESS) return;
    expect(result.profile.fullName).toBe('Bruno A. Silva');
    expect(result.profile.address.city).toBe('Rio de Janeiro');
  });

  it('returns ERROR for an invalid document instead of persisting', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      fullName: 'Bruno Almeida',
      document: '123',
      address: validAddress,
    });

    expect(result.status).toBe(Status.ERROR);
    const saved = await repository.findByUserId(IdType.create('user-1'));
    expect(saved).toBeNull();
  });

  it('returns ERROR for an invalid zip', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      fullName: 'Bruno Almeida',
      document: '12345678900',
      address: { ...validAddress, zip: '123' },
    });

    expect(result.status).toBe(Status.ERROR);
  });
});
