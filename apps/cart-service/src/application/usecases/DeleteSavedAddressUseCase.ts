import { SavedAddressRepository } from '@src/domain/repositories/SavedAddressRepository';
import { IdType } from '@src/domain/shared/IdType';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';

export class DeleteSavedAddressUseCase implements UseCase<Input, Output> {
  constructor(private readonly savedAddressRepository: SavedAddressRepository) {}

  async execute(input: Input): Promise<Output> {
    try {
      const address = await this.savedAddressRepository.findById(
        IdType.create(input.addressId),
      );

      if (!address || !address.belongsTo(IdType.create(input.userId))) {
        return { status: Status.ERROR, message: 'Address not found', code: 'ADDRESS_NOT_FOUND' };
      }

      await this.savedAddressRepository.delete(address.id);
      if (address.isDefault()) {
        const replacement = (
          await this.savedAddressRepository.findByUserId(address.userId)
        )[0];
        if (replacement) {
          replacement.makeDefault();
          await this.savedAddressRepository.save(replacement);
        }
      }
      return { status: Status.SUCCESS };
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
}

type Output = SuccessOutput | ErrorOutput;
