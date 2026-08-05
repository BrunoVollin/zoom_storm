import type { Context } from 'hono';
import { GetUserProfileQuery } from '@application/Queries/GetUserProfileQuery';
import { UpdateUserProfileUseCase } from '@application/usecases/UpdateUserProfileUseCase';
import { Status } from '@application/contracts/UseCase';
import { validate, validationError } from '../schemas/cart.schemas';
import { UpdateUserProfileSchema } from '../schemas/user-profile.schemas';

export class UserProfileController {
  constructor(
    private readonly getUserProfile: GetUserProfileQuery,
    private readonly updateUserProfile: UpdateUserProfileUseCase,
  ) {}

  async get(c: Context) {
    const result = await this.getUserProfile.execute({
      userId: c.get('userId') as string,
    });

    return c.json(result, 200);
  }

  async update(c: Context) {
    const parsed = validate(UpdateUserProfileSchema, await c.req.json());
    if ('error' in parsed) return validationError(c, parsed.error);

    const result = await this.updateUserProfile.execute({
      userId: c.get('userId') as string,
      fullName: parsed.data.fullName,
      document: parsed.data.document,
      address: parsed.data.address,
    });

    return c.json(result, result.status === Status.SUCCESS ? 200 : 422);
  }
}
