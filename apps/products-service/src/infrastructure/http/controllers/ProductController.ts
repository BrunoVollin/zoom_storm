import type { Context } from 'hono';
import { ListProductsQuery } from '../../../application/queries/ListProductsQuery';
import { GetProductByIdQuery } from '../../../application/queries/GetProductByIdQuery';
import { ListCategoriesQuery } from '../../../application/queries/ListCategoriesQuery';
import { CreateProductUseCase } from '../../../application/usecases/CreateProductUseCase';
import { UpdateProductUseCase } from '../../../application/usecases/UpdateProductUseCase';
import { DeleteProductUseCase } from '../../../application/usecases/DeleteProductUseCase';
import { CreateProductVariantUseCase } from '../../../application/usecases/CreateProductVariantUseCase';
import { UpdateProductVariantUseCase } from '../../../application/usecases/UpdateProductVariantUseCase';
import { DeleteProductVariantUseCase } from '../../../application/usecases/DeleteProductVariantUseCase';
import { CreateReviewUseCase } from '../../../application/usecases/CreateReviewUseCase';
import { Status as QueryStatus } from '../../../application/contracts/Query';
import { Status as UseCaseStatus } from '../../../application/contracts/UseCase';
import {
  validate,
  validationError,
  CreateProductSchema,
  CreateProductVariantSchema,
  CreateReviewSchema,
  ListProductsQuerySchema,
  UpdateProductSchema,
  UpdateProductVariantSchema,
} from '../schemas/product.schemas';

export class ProductController {
  constructor(
    private readonly listProductsQuery: ListProductsQuery,
    private readonly getProductByIdQuery: GetProductByIdQuery,
    private readonly listCategoriesQuery: ListCategoriesQuery,
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
    private readonly createProductVariantUseCase: CreateProductVariantUseCase,
    private readonly updateProductVariantUseCase: UpdateProductVariantUseCase,
    private readonly deleteProductVariantUseCase: DeleteProductVariantUseCase,
    private readonly createReviewUseCase: CreateReviewUseCase,
  ) {}

  async hello(c: Context) {
    return c.json({ message: 'hello' }, 200);
  }

  async list(c: Context) {
    const parsed = validate(ListProductsQuerySchema, c.req.query());
    if ('error' in parsed) return validationError(c, parsed.error);

    const result = await this.listProductsQuery.execute(parsed.data);
    const status = result.status === QueryStatus.SUCCESS ? 200 : 422;

    return c.json(result, status);
  }

  async listCategories(c: Context) {
    const result = await this.listCategoriesQuery.execute({});
    const status = result.status === QueryStatus.SUCCESS ? 200 : 422;

    return c.json(result, status);
  }

  async getById(c: Context) {
    const id = c.req.param('id')!;

    const result = await this.getProductByIdQuery.execute({ id });
    const status = result.status === QueryStatus.SUCCESS ? 200 : 404;

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
    const id = c.req.param('id')!;
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
    const id = c.req.param('id')!;

    const result = await this.deleteProductUseCase.execute({ id });
    const status = result.status === UseCaseStatus.SUCCESS ? 200 : 422;

    return c.json(result, status);
  }

  async createVariant(c: Context) {
    const productId = c.req.param('id')!;
    const parsed = validate(CreateProductVariantSchema, await c.req.json());
    if ('error' in parsed) return validationError(c, parsed.error);

    const result = await this.createProductVariantUseCase.execute({
      productId,
      ...parsed.data,
    });
    const status = result.status === UseCaseStatus.SUCCESS ? 201 : 422;

    return c.json(result, status);
  }

  async updateVariant(c: Context) {
    const productId = c.req.param('id')!;
    const variantId = c.req.param('variantId')!;
    const parsed = validate(UpdateProductVariantSchema, await c.req.json());
    if ('error' in parsed) return validationError(c, parsed.error);

    const result = await this.updateProductVariantUseCase.execute({
      productId,
      variantId,
      ...parsed.data,
    });
    const status = result.status === UseCaseStatus.SUCCESS ? 200 : 422;

    return c.json(result, status);
  }

  async deleteVariant(c: Context) {
    const productId = c.req.param('id')!;
    const variantId = c.req.param('variantId')!;

    const result = await this.deleteProductVariantUseCase.execute({
      productId,
      variantId,
    });
    const status = result.status === UseCaseStatus.SUCCESS ? 200 : 422;

    return c.json(result, status);
  }

  async createReview(c: Context) {
    const productId = c.req.param('id')!;
    const parsed = validate(CreateReviewSchema, await c.req.json());
    if ('error' in parsed) return validationError(c, parsed.error);

    const userId = c.get('userId') as string | undefined;
    const reviewerName = c.get('userName') as string | undefined;
    const reviewerEmail = c.get('userEmail') as string | undefined;
    if (!userId || !reviewerName || !reviewerEmail) {
      return c.json(
        {
          status: UseCaseStatus.ERROR,
          message: 'Authenticated profile is incomplete',
        },
        401,
      );
    }

    const result = await this.createReviewUseCase.execute({
      productId,
      userId,
      reviewerName,
      reviewerEmail,
      ...parsed.data,
    });
    const status = result.status === UseCaseStatus.SUCCESS ? 201 : 422;

    return c.json(result, status);
  }
}
