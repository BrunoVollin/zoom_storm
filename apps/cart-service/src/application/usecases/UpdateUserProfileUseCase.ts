import { Address } from '@src/domain/entities/profile/Address';
import { UserProfile } from '@src/domain/entities/profile/UserProfile';
import { UserProfileRepository } from '@src/domain/repositories/UserProfileRepository';
import { IdType } from '@src/domain/shared/IdType';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import { UserProfileMapper, UserProfilePrimitives } from '../mappers/UserProfileMapper';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';

export class UpdateUserProfileUseCase implements UseCase<Input, Output> {
  constructor(private readonly userProfileRepository: UserProfileRepository) {}

  async execute(input: Input): Promise<Output> {
    try {
      const userId = IdType.create(input.userId);
      const address = new Address(
        input.address.street,
        input.address.number,
        input.address.neighborhood,
        input.address.city,
        input.address.state,
        input.address.zip,
        input.address.complement,
      );

      const existing = await this.userProfileRepository.findByUserId(userId);

      let profile: UserProfile;
      if (existing) {
        existing.update(input.fullName, input.document, address);
        profile = existing;
      } else {
        profile = new UserProfile(userId, input.fullName, input.document, address);
      }

      await this.userProfileRepository.save(profile);

      return { status: Status.SUCCESS, profile: UserProfileMapper.toPrimitives(profile) };
    } catch (error) {
      if (error instanceof Error) {
        return { status: Status.ERROR, message: error.message };
      }

      return handleUnexpectedError(error);
    }
  }
}

interface Input {
  userId: string;
  fullName: string;
  document: string;
  address: {
    street: string;
    number: string;
    complement?: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zip: string;
  };
}

interface SuccessOutput {
  status: Status.SUCCESS;
  profile: UserProfilePrimitives;
}

type Output = SuccessOutput | ErrorOutput;
