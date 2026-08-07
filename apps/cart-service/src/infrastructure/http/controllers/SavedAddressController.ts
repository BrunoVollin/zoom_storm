import type { Context } from 'hono';
import { ListSavedAddressesQuery } from '@application/Queries/ListSavedAddressesQuery';
import { Status } from '@application/contracts/UseCase';
import { AddSavedAddressUseCase } from '@application/usecases/AddSavedAddressUseCase';
import { DeleteSavedAddressUseCase } from '@application/usecases/DeleteSavedAddressUseCase';
import { SetDefaultSavedAddressUseCase } from '@application/usecases/SetDefaultSavedAddressUseCase';
import { UpdateSavedAddressUseCase } from '@application/usecases/UpdateSavedAddressUseCase';
import { validate, validationError } from '../schemas/cart.schemas';
import {
  AddSavedAddressSchema,
  UpdateSavedAddressSchema,
} from '../schemas/saved-address.schemas';

export class SavedAddressController {
  constructor(
    private readonly listSavedAddresses: ListSavedAddressesQuery,
    private readonly addSavedAddress: AddSavedAddressUseCase,
    private readonly updateSavedAddress: UpdateSavedAddressUseCase,
    private readonly deleteSavedAddress: DeleteSavedAddressUseCase,
    private readonly setDefaultSavedAddress: SetDefaultSavedAddressUseCase,
  ) {}

  async list(c: Context) {
    const result = await this.listSavedAddresses.execute({
      userId: c.get('userId') as string,
    });
    return c.json(result, 200);
  }

  async add(c: Context) {
    const parsed = validate(AddSavedAddressSchema, await c.req.json());
    if ('error' in parsed) return validationError(c, parsed.error);

    const result = await this.addSavedAddress.execute({
      userId: c.get('userId') as string,
      ...parsed.data,
    });
    return c.json(result, result.status === Status.SUCCESS ? 201 : 422);
  }

  async update(c: Context) {
    const parsed = validate(UpdateSavedAddressSchema, await c.req.json());
    if ('error' in parsed) return validationError(c, parsed.error);

    const result = await this.updateSavedAddress.execute({
      userId: c.get('userId') as string,
      addressId: c.req.param('addressId')!,
      ...parsed.data,
    });
    return c.json(result, result.status === Status.SUCCESS ? 200 : 404);
  }

  async remove(c: Context) {
    const result = await this.deleteSavedAddress.execute({
      userId: c.get('userId') as string,
      addressId: c.req.param('addressId')!,
    });
    return c.json(result, result.status === Status.SUCCESS ? 200 : 404);
  }

  async setDefault(c: Context) {
    const result = await this.setDefaultSavedAddress.execute({
      userId: c.get('userId') as string,
      addressId: c.req.param('addressId')!,
    });
    return c.json(result, result.status === Status.SUCCESS ? 200 : 404);
  }
}
