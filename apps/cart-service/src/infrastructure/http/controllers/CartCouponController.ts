import type { Context } from 'hono';
import { ApplyCouponUseCase } from '@application/usecases/ApplyCouponUseCase';
import { RemoveCouponUseCase } from '@application/usecases/RemoveCouponUseCase';
import { Status } from '@application/contracts/UseCase';
import {
  validate,
  validationError,
  ApplyCouponSchema,
} from '../schemas/cart.schemas';

export class CartCouponController {
  constructor(
    private readonly applyCouponUseCase: ApplyCouponUseCase,
    private readonly removeCouponUseCase: RemoveCouponUseCase,
  ) {}

  async apply(c: Context) {
    const parsed = validate(ApplyCouponSchema, await c.req.json());
    if ('error' in parsed) return validationError(c, parsed.error);

    const result = await this.applyCouponUseCase.execute({
      cartId: c.req.param('cartId')!,
      couponId: parsed.data.couponId,
    });
    const status = result.status === Status.SUCCESS ? 200 : 422;

    return c.json(result, status);
  }

  async remove(c: Context) {
    const result = await this.removeCouponUseCase.execute({
      cartId: c.req.param('cartId')!,
      couponId: c.req.param('couponId')!,
    });
    const status = result.status === Status.SUCCESS ? 200 : 422;

    return c.json(result, status);
  }
}
