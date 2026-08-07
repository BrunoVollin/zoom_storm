import { SavedAddressRepository } from '@src/domain/repositories/SavedAddressRepository';
import { IdType } from '@src/domain/shared/IdType';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import { SavedAddressMapper, SavedAddressPrimitives } from '../mappers/SavedAddressMapper';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';
import { SavedAddressDetailsInput, toAddressValueObject } from './AddSavedAddressUseCase';

export class UpdateSavedAddressUseCase implements UseCase<Input, Output> {
  constructor(private readonly savedAddressRepository: SavedAddressRepository) {}

  async execute(input: Input): Promise<Output> {
    try {
      const address = await this.savedAddressRepository.findById(
        IdType.create(input.addressId),
      );

      if (!address || !address.belongsTo(IdType.create(input.userId))) {
        return { status: Status.ERROR, message: 'Address not found', code: 'ADDRESS_NOT_FOUND' };
      }

      address.update(input.label, input.recipient, toAddressValueObject(input));
      await this.savedAddressRepository.save(address);

      return {
        status: Status.SUCCESS,
        address: SavedAddressMapper.toPrimitives(address),
      };
    } catch (error) {
      if (error instanceof Error) return { status: Status.ERROR, message: error.message };
      return handleUnexpectedError(error);
    }
  }
}

interface Input extends SavedAddressDetailsInput {
  userId: string;
  addressId: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  address: SavedAddressPrimitives;
}

type Output = SuccessOutput | ErrorOutput;
