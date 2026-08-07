import { SavedAddressRepository } from '@src/domain/repositories/SavedAddressRepository';
import { IdType } from '@src/domain/shared/IdType';
import { Query } from '../contracts/Query';
import { Status } from '../contracts/UseCase';
import { SavedAddressMapper, SavedAddressPrimitives } from '../mappers/SavedAddressMapper';

export class ListSavedAddressesQuery implements Query<Input, Output> {
  constructor(private readonly savedAddressRepository: SavedAddressRepository) {}

  async execute(input: Input): Promise<Output> {
    const addresses = await this.savedAddressRepository.findByUserId(
      IdType.create(input.userId),
    );

    return {
      status: Status.SUCCESS,
      addresses: addresses.map(SavedAddressMapper.toPrimitives),
    };
  }
}

interface Input {
  userId: string;
}

interface Output {
  status: Status.SUCCESS;
  addresses: Array<SavedAddressPrimitives>;
}
