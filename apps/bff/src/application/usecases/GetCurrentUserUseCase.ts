import { UseCase } from '@bff-application/contracts/UseCase';
import { Session, SessionUser } from '@bff-domain/entities/Session';

export interface GetCurrentUserInput {
  session: Session;
}

export interface GetCurrentUserOutput {
  user: SessionUser;
}

export class GetCurrentUserUseCase implements UseCase<
  GetCurrentUserInput,
  GetCurrentUserOutput
> {
  async execute(input: GetCurrentUserInput): Promise<GetCurrentUserOutput> {
    return { user: input.session.user };
  }
}
