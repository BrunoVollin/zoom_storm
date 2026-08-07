import { SavedAddressRepository } from '@src/domain/repositories/SavedAddressRepository';
import { IdType } from '@src/domain/shared/IdType';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import { SavedAddressMapper, SavedAddressPrimitives } from '../mappers/SavedAddressMapper';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';

export class SetDefaultSavedAddressUseCase implements UseCase<Input, Output> {
  constructor(private readonly savedAddressRepository: SavedAddressRepository) {}

  async execute(input: Input): Promise<Output> {
    try {
      const address = await this.savedAddressRepository.findById(
        IdType.create(input.addressId),
      );

      if (!address || !address.belongsTo(IdType.create(input.userId))) {
        return { status: Status.ERROR, message: 'Address not found', code: 'ADDRESS_NOT_FOUND' };
      }

      address.makeDefault();
      await this.savedAddressRepository.save(address);

      return {
        status: Status.SUCCESS,
        address: SavedAddressMapper.toPrimitives(address),
      };
    } catch (error) {
      return handleUnexpectedError(error);
    }
  }
}

interface Input {
  userId: string;
  addressId: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  address: SavedAddressPrimitives;
}

type Output = SuccessOutput | ErrorOutput;
