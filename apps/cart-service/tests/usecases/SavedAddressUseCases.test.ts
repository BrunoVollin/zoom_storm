import { ListSavedAddressesQuery } from '../../src/application/Queries/ListSavedAddressesQuery';
import { Status } from '../../src/application/contracts/UseCase';
import { AddSavedAddressUseCase } from '../../src/application/usecases/AddSavedAddressUseCase';
import { DeleteSavedAddressUseCase } from '../../src/application/usecases/DeleteSavedAddressUseCase';
import { SetDefaultSavedAddressUseCase } from '../../src/application/usecases/SetDefaultSavedAddressUseCase';
import { UpdateSavedAddressUseCase } from '../../src/application/usecases/UpdateSavedAddressUseCase';
import { IdType } from '../../src/domain/shared/IdType';
import { InMemorySavedAddressRepository } from '../helpers/InMemorySavedAddressRepository';

const home = {
  label: 'Home',
  recipient: 'Bruno Almeida',
  street: 'Rua A',
  number: '10',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  zip: '01001-000',
};

describe('saved address use cases', () => {
  let repository: InMemorySavedAddressRepository;
  let add: AddSavedAddressUseCase;

  beforeEach(() => {
    repository = new InMemorySavedAddressRepository();
    add = new AddSavedAddressUseCase(repository);
  });

  it('creates multiple addresses and makes the first one default', async () => {
    const first = await add.execute({ userId: 'user-1', ...home });
    const second = await add.execute({
      userId: 'user-1',
      ...home,
      label: 'Office',
      street: 'Rua B',
    });

    expect(first.status).toBe(Status.SUCCESS);
    expect(second.status).toBe(Status.SUCCESS);
    const addresses = await repository.findByUserId(IdType.create('user-1'));
    expect(addresses).toHaveLength(2);
    expect(addresses.filter((address) => address.isDefault())).toHaveLength(1);
    expect(addresses[0].isDefault()).toBe(true);
  });

  it('updates only an address owned by the requesting user', async () => {
    const created = await add.execute({ userId: 'user-1', ...home });
    if (created.status !== Status.SUCCESS) throw new Error('setup failed');
    const update = new UpdateSavedAddressUseCase(repository);

    const denied = await update.execute({
      userId: 'user-2',
      addressId: created.address.id,
      ...home,
      label: 'Stolen',
    });
    const accepted = await update.execute({
      userId: 'user-1',
      addressId: created.address.id,
      ...home,
      label: 'Main home',
    });

    expect(denied).toMatchObject({ status: Status.ERROR, code: 'ADDRESS_NOT_FOUND' });
    expect(accepted).toMatchObject({
      status: Status.SUCCESS,
      address: { label: 'Main home' },
    });
  });

  it('switches the default and lists only the requesting user addresses', async () => {
    const first = await add.execute({ userId: 'user-1', ...home });
    const second = await add.execute({ userId: 'user-1', ...home, label: 'Office' });
    await add.execute({ userId: 'user-2', ...home });
    if (first.status !== Status.SUCCESS || second.status !== Status.SUCCESS) {
      throw new Error('setup failed');
    }

    const setDefault = new SetDefaultSavedAddressUseCase(repository);
    const result = await setDefault.execute({
      userId: 'user-1',
      addressId: second.address.id,
    });
    const listed = await new ListSavedAddressesQuery(repository).execute({ userId: 'user-1' });

    expect(result.status).toBe(Status.SUCCESS);
    expect(listed.addresses).toHaveLength(2);
    expect(listed.addresses.find((item) => item.id === second.address.id)?.isDefault).toBe(true);
    expect(listed.addresses.find((item) => item.id === first.address.id)?.isDefault).toBe(false);
  });

  it('rejects deleting another user address and promotes a replacement default', async () => {
    const first = await add.execute({ userId: 'user-1', ...home });
    const second = await add.execute({ userId: 'user-1', ...home, label: 'Office' });
    if (first.status !== Status.SUCCESS || second.status !== Status.SUCCESS) {
      throw new Error('setup failed');
    }
    const remove = new DeleteSavedAddressUseCase(repository);

    expect(
      await remove.execute({ userId: 'user-2', addressId: first.address.id }),
    ).toMatchObject({ status: Status.ERROR, code: 'ADDRESS_NOT_FOUND' });
    expect(
      await remove.execute({ userId: 'user-1', addressId: first.address.id }),
    ).toEqual({ status: Status.SUCCESS });

    const remaining = await repository.findByUserId(IdType.create('user-1'));
    expect(remaining).toHaveLength(1);
    expect(remaining[0].isDefault()).toBe(true);
  });
});
