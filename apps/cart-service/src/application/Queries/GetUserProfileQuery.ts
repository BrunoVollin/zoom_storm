import { IdType } from '@src/domain/shared/IdType';
import { UserProfileRepository } from '@src/domain/repositories/UserProfileRepository';
import { Query } from '../contracts/Query';
import { Status } from '../contracts/UseCase';
import { UserProfileMapper, UserProfilePrimitives } from '../mappers/UserProfileMapper';

export class GetUserProfileQuery implements Query<Input, Output> {
  constructor(private readonly userProfileRepository: UserProfileRepository) {}

  async execute(input: Input): Promise<Output> {
    const profile = await this.userProfileRepository.findByUserId(
      IdType.create(input.userId),
    );

    return {
      status: Status.SUCCESS,
      profile: profile ? UserProfileMapper.toPrimitives(profile) : null,
    };
  }
}

interface Input {
  userId: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  profile: UserProfilePrimitives | null;
}

type Output = SuccessOutput;
