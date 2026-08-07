import { Address } from '@src/domain/entities/profile/Address';
import { SavedAddress } from '@src/domain/entities/profile/SavedAddress';
import { SavedAddressRepository } from '@src/domain/repositories/SavedAddressRepository';
import { IdType } from '@src/domain/shared/IdType';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import { SavedAddressMapper, SavedAddressPrimitives } from '../mappers/SavedAddressMapper';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';

export class AddSavedAddressUseCase implements UseCase<Input, Output> {
  constructor(private readonly savedAddressRepository: SavedAddressRepository) {}

  async execute(input: Input): Promise<Output> {
    try {
      const userId = IdType.create(input.userId);
      const currentAddresses = await this.savedAddressRepository.findByUserId(userId);
      const address = new SavedAddress(
        IdType.create(),
        userId,
        input.label,
        input.recipient,
        toAddress(input),
        input.isDefault === true || currentAddresses.length === 0,
      );

      await this.savedAddressRepository.save(address);

      return {
        status: Status.SUCCESS,
        address: SavedAddressMapper.toPrimitives(address),
      };
    } catch (error) {
      if (error instanceof Error) {
        return { status: Status.ERROR, message: error.message };
      }
      return handleUnexpectedError(error);
    }
  }
}

export interface SavedAddressDetailsInput {
  label: string;
  recipient: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
}

function toAddress(input: SavedAddressDetailsInput): Address {
  return new Address(
    input.street,
    input.number,
    input.neighborhood,
    input.city,
    input.state,
    input.zip,
    input.complement,
  );
}

interface Input extends SavedAddressDetailsInput {
  userId: string;
  isDefault?: boolean;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  address: SavedAddressPrimitives;
}

type Output = SuccessOutput | ErrorOutput;

export { toAddress as toAddressValueObject };
