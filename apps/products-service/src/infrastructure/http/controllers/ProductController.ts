import type { Context } from 'hono';
import { ListProductsQuery } from '../../../application/queries/ListProductsQuery';
import { CreateProductUseCase } from '../../../application/usecases/CreateProductUseCase';
import { UpdateProductUseCase } from '../../../application/usecases/UpdateProductUseCase';
import { DeleteProductUseCase } from '../../../application/usecases/DeleteProductUseCase';
import { Status as QueryStatus } from '../../../application/contracts/Query';
import { Status as UseCaseStatus } from '../../../application/contracts/UseCase';
import {
  validate,
  validationError,
  CreateProductSchema,
  UpdateProductSchema,
} from '../schemas/product.schemas';

export class ProductController {
  constructor(
    private readonly listProductsQuery: ListProductsQuery,
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
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

  async update(c: Context) {
    const id = c.req.param('id');
    const parsed = validate(UpdateProductSchema, await c.req.json());
    if ('error' in parsed) return validationError(c, parsed.error);

    const result = await this.updateProductUseCase.execute({
      id,
      ...parsed.data,
    });
    const status = result.status === UseCaseStatus.SUCCESS ? 200 : 422;

    return c.json(result, status);
  }

  async delete(c: Context) {
    const id = c.req.param('id');

    const result = await this.deleteProductUseCase.execute({ id });
    const status = result.status === UseCaseStatus.SUCCESS ? 200 : 422;

    return c.json(result, status);
  }
}
