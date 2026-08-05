import type { Context } from 'hono';
import { ListSavedCardsQuery } from '@application/Queries/ListSavedCardsQuery';
import { AddSavedCardUseCase } from '@application/usecases/AddSavedCardUseCase';
import { DeleteSavedCardUseCase } from '@application/usecases/DeleteSavedCardUseCase';
import { Status } from '@application/contracts/UseCase';
import { validate, validationError } from '../schemas/cart.schemas';
import { AddSavedCardSchema } from '../schemas/payment-card.schemas';

export class SavedCardController {
  constructor(
    private readonly listSavedCards: ListSavedCardsQuery,
    private readonly addSavedCard: AddSavedCardUseCase,
    private readonly deleteSavedCard: DeleteSavedCardUseCase,
  ) {}

  async list(c: Context) {
    const result = await this.listSavedCards.execute({
      userId: c.get('userId') as string,
    });

    return c.json(result, 200);
  }

  async add(c: Context) {
    const parsed = validate(AddSavedCardSchema, await c.req.json());
    if ('error' in parsed) return validationError(c, parsed.error);

    const result = await this.addSavedCard.execute({
      userId: c.get('userId') as string,
      brand: parsed.data.brand,
      lastFour: parsed.data.lastFour,
      holderName: parsed.data.holderName,
      expiry: parsed.data.expiry,
    });

    return c.json(result, result.status === Status.SUCCESS ? 201 : 422);
  }

  async remove(c: Context) {
    const result = await this.deleteSavedCard.execute({
      userId: c.get('userId') as string,
      cardId: c.req.param('cardId'),
    });

    return c.json(result, result.status === Status.SUCCESS ? 200 : 404);
  }
}
