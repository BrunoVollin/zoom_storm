import type { Context } from 'hono';
import { CheckoutUseCase } from '@application/usecases/CheckoutUseCase';
import { Status } from '@application/contracts/UseCase';
import {
  validate,
  validationError,
  CheckoutSchema,
} from '../schemas/cart.schemas';

export class CartCheckoutController {
  constructor(private readonly checkoutUseCase: CheckoutUseCase) {}

  async handle(c: Context) {
    const parsed = validate(CheckoutSchema, await c.req.json());
    if ('error' in parsed) return validationError(c, parsed.error);

    const result = await this.checkoutUseCase.execute({
      cartId: c.req.param('cartId')!,
      shipping: parsed.data.shipping,
    });
    const status = result.status === Status.SUCCESS ? 200 : 422;

    return c.json(result, status);
  }
}
