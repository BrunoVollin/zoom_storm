import type { Context } from 'hono';
import { CalculateShippingUseCase } from '@application/usecases/CalculateShippingUseCase';
import { Status } from '@application/contracts/UseCase';

export class CartShippingController {
  constructor(
    private readonly calculateShippingUseCase: CalculateShippingUseCase,
  ) {}

  async calculate(c: Context) {
    const distance = Number(c.req.query('distance'));

    if (isNaN(distance) || distance <= 0) {
      return c.json(
        { status: Status.ERROR, message: 'Invalid distance query param' },
        400,
      );
    }

    const result = await this.calculateShippingUseCase.execute({
      cartId: c.req.param('cartId')!,
      distance,
    });
    const status = result.status === Status.SUCCESS ? 200 : 422;

    return c.json(result, status);
  }
}
