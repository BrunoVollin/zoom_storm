import type { Context } from 'hono';
import { CalculateShippingUseCase } from '@application/usecases/CalculateShippingUseCase';
import { Status } from '@application/contracts/UseCase';

export class CartShippingController {
  constructor(
    private readonly calculateShippingUseCase: CalculateShippingUseCase,
  ) {}

  async calculate(c: Context) {
    const addressId = c.req.query('addressId') ?? '';

    if (!addressId.trim()) {
      return c.json(
        { status: Status.ERROR, message: 'addressId query param is required' },
        400,
      );
    }

    const result = await this.calculateShippingUseCase.execute({
      cartId: c.req.param('cartId')!,
      userId: c.get('userId') as string,
      addressId,
    });
    const status = result.status === Status.SUCCESS ? 200 : 422;

    return c.json(result, status);
  }
}
