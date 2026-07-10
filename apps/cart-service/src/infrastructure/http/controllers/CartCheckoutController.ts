import type { Context } from 'hono';
import { CheckoutUseCase } from '@application/usecases/CheckoutUseCase';
import {
  validate,
  validationError,
  httpStatus,
  CheckoutSchema,
} from '../schemas/cart.schemas';

export class CartCheckoutController {
  constructor(private readonly checkoutUseCase: CheckoutUseCase) {}

  async handle(c: Context) {
    const parsed = validate(CheckoutSchema, await c.req.json());
    if ('error' in parsed) return validationError(c, parsed.error);

    const result = await this.checkoutUseCase.execute({
      cartId: c.req.param('cartId')!,
      userId: c.get('userId') as string,
      shipping: parsed.data.shipping,
    });

    return c.json(result, httpStatus(result));
  }
}
