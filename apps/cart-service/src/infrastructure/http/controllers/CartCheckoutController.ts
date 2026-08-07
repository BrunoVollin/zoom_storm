import type { Context } from 'hono';
import { CheckoutUseCase } from '@application/usecases/CheckoutUseCase';
import {
  validate,
  validationError,
  httpStatus,
  CheckoutSchema,
} from '../schemas/cart.schemas';
import { IdempotencyKeySchema } from '../schemas/order.schemas';

export class CartCheckoutController {
  constructor(private readonly checkoutUseCase: CheckoutUseCase) {}

  async handle(c: Context) {
    const idempotencyKey = validate(
      IdempotencyKeySchema,
      c.req.header('Idempotency-Key'),
    );
    if ('error' in idempotencyKey) {
      return validationError(c, `Idempotency-Key: ${idempotencyKey.error}`);
    }

    const parsed = validate(CheckoutSchema, await c.req.json());
    if ('error' in parsed) return validationError(c, parsed.error);

    const result = await this.checkoutUseCase.execute({
      cartId: c.req.param('cartId')!,
      userId: c.get('userId') as string,
      addressId: parsed.data.addressId,
      shippingQuoteId: parsed.data.shippingQuoteId,
      idempotencyKey: idempotencyKey.data,
    });

    return c.json(result, httpStatus(result));
  }
}
