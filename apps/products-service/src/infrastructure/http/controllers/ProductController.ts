import type { Context } from 'hono';
import { ListProductsQuery } from '../../../application/queries/ListProductsQuery';
import { CreateProductUseCase } from '../../../application/usecases/CreateProductUseCase';
import { Status as QueryStatus } from '../../../application/contracts/Query';
import { Status as UseCaseStatus } from '../../../application/contracts/UseCase';
import {
  validate,
  validationError,
  CreateProductSchema,
} from '../schemas/product.schemas';

export class ProductController {
  constructor(
    private readonly listProductsQuery: ListProductsQuery,
    private readonly createProductUseCase: CreateProductUseCase,
  ) {}

  async hello(c: Context) {
    return c.json({ message: 'hello' }, 200);
  }

  async list(c: Context) {
    const result = await this.listProductsQuery.execute({});
    const status = result.status === QueryStatus.SUCCESS ? 200 : 422;

    return c.json(result, status);
  }

  async create(c: Context) {
    const parsed = validate(CreateProductSchema, await c.req.json());
    if ('error' in parsed) return validationError(c, parsed.error);

    const result = await this.createProductUseCase.execute(parsed.data);
    const status = result.status === UseCaseStatus.SUCCESS ? 201 : 422;

    return c.json(result, status);
  }
}
