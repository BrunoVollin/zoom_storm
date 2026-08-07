import type { Context } from 'hono';
import { ListCouponsUseCase } from '@application/usecases/ListCouponsUseCase';
import { CreateCouponUseCase } from '@application/usecases/CreateCouponUseCase';
import { UpdateCouponUseCase } from '@application/usecases/UpdateCouponUseCase';
import { DeleteCouponUseCase } from '@application/usecases/DeleteCouponUseCase';
import {
  validate,
  validationError,
  httpStatus,
  CreateCouponSchema,
  UpdateCouponSchema,
} from '../schemas/cart.schemas';

export class AdminCouponController {
  constructor(
    private readonly listCouponsUseCase: ListCouponsUseCase,
    private readonly createCouponUseCase: CreateCouponUseCase,
    private readonly updateCouponUseCase: UpdateCouponUseCase,
    private readonly deleteCouponUseCase: DeleteCouponUseCase,
  ) {}

  async list(c: Context) {
    const result = await this.listCouponsUseCase.execute({});

    return c.json(result, httpStatus(result));
  }

  async create(c: Context) {
    const parsed = validate(CreateCouponSchema, await c.req.json());
    if ('error' in parsed) return validationError(c, parsed.error);

    const result = await this.createCouponUseCase.execute(parsed.data);

    return c.json(result, httpStatus(result, 201));
  }

  async update(c: Context) {
    const parsed = validate(UpdateCouponSchema, await c.req.json());
    if ('error' in parsed) return validationError(c, parsed.error);

    const result = await this.updateCouponUseCase.execute({
      id: c.req.param('id')!,
      ...parsed.data,
    });

    return c.json(result, httpStatus(result));
  }

  async delete(c: Context) {
    const result = await this.deleteCouponUseCase.execute({
      id: c.req.param('id')!,
    });

    return c.json(result, httpStatus(result));
  }
}
