import type { Context } from 'hono';
import { ListActiveFlashOffersQuery } from '../../../application/queries/ListActiveFlashOffersQuery';
import { ListFlashOffersQuery } from '../../../application/queries/ListFlashOffersQuery';
import { CreateFlashOfferUseCase } from '../../../application/usecases/CreateFlashOfferUseCase';
import { UpdateFlashOfferUseCase } from '../../../application/usecases/UpdateFlashOfferUseCase';
import { DeleteFlashOfferUseCase } from '../../../application/usecases/DeleteFlashOfferUseCase';
import { Status as QueryStatus } from '../../../application/contracts/Query';
import { Status as UseCaseStatus } from '../../../application/contracts/UseCase';
import { validate, validationError } from '../schemas/product.schemas';
import {
  CreateFlashOfferSchema,
  UpdateFlashOfferSchema,
} from '../schemas/flash-offer.schemas';

export class FlashOfferController {
  constructor(
    private readonly listActiveFlashOffersQuery: ListActiveFlashOffersQuery,
    private readonly listFlashOffersQuery: ListFlashOffersQuery,
    private readonly createFlashOfferUseCase: CreateFlashOfferUseCase,
    private readonly updateFlashOfferUseCase: UpdateFlashOfferUseCase,
    private readonly deleteFlashOfferUseCase: DeleteFlashOfferUseCase,
  ) {}

  async listActive(c: Context) {
    const result = await this.listActiveFlashOffersQuery.execute({});
    const status = result.status === QueryStatus.SUCCESS ? 200 : 422;

    return c.json(result, status);
  }

  async list(c: Context) {
    const result = await this.listFlashOffersQuery.execute({});
    const status = result.status === QueryStatus.SUCCESS ? 200 : 422;

    return c.json(result, status);
  }

  async create(c: Context) {
    const parsed = validate(CreateFlashOfferSchema, await c.req.json());
    if ('error' in parsed) return validationError(c, parsed.error);

    const result = await this.createFlashOfferUseCase.execute(parsed.data);
    const status = result.status === UseCaseStatus.SUCCESS ? 201 : 422;

    return c.json(result, status);
  }

  async update(c: Context) {
    const id = c.req.param('id')!;
    const parsed = validate(UpdateFlashOfferSchema, await c.req.json());
    if ('error' in parsed) return validationError(c, parsed.error);

    const result = await this.updateFlashOfferUseCase.execute({
      id,
      ...parsed.data,
    });
    const status = result.status === UseCaseStatus.SUCCESS ? 200 : 422;

    return c.json(result, status);
  }

  async delete(c: Context) {
    const id = c.req.param('id')!;

    const result = await this.deleteFlashOfferUseCase.execute({ id });
    const status = result.status === UseCaseStatus.SUCCESS ? 200 : 422;

    return c.json(result, status);
  }
}
