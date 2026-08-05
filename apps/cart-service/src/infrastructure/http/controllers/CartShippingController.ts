import type { Context } from 'hono';
import { CalculateShippingUseCase } from '@application/usecases/CalculateShippingUseCase';
import { Status } from '@application/contracts/UseCase';

export class CartShippingController {
  constructor(
    private readonly calculateShippingUseCase: CalculateShippingUseCase,
  ) {}

  async calculate(c: Context) {
    const cep = c.req.query('cep') ?? '';

    if (!/^\d{5}-?\d{3}$/.test(cep)) {
      return c.json(
        { status: Status.ERROR, message: 'Invalid cep query param' },
        400,
      );
    }

    const result = await this.calculateShippingUseCase.execute({
      cartId: c.req.param('cartId')!,
      userId: c.get('userId') as string,
      cep,
    });
    const status = result.status === Status.SUCCESS ? 200 : 422;

    return c.json(result, status);
  }
}
