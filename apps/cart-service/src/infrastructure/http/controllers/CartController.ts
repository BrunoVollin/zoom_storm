import type { Context } from 'hono';
import { CartQuery } from '@application/Queries/CartQuery';
import { CreateCartUseCase } from '@application/usecases/CreateCartUseCase';
import { Status } from '@application/contracts/UseCase';
import {
  validate,
  validationError,
  CreateCartSchema,
} from '../schemas/cart.schemas';

export class CartController {
  constructor(
    private readonly getCartQuery: CartQuery,
    private readonly createCartUseCase: CreateCartUseCase,
  ) {}

  async getById(c: Context) {
    const result = await this.getCartQuery.execute({
      cartId: c.req.param('cartId')!,
    });
    const status = result.status === Status.SUCCESS ? 200 : 404;

    return c.json(result, status);
  }

  async create(c: Context) {
    const parsed = validate(CreateCartSchema, await c.req.json());
    if ('error' in parsed) return validationError(c, parsed.error);

    const result = await this.createCartUseCase.execute(parsed.data);

    const status = result.status === Status.SUCCESS ? 201 : 422;

    return c.json(result, status);
  }
}
