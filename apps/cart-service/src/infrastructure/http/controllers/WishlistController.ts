import type { Context } from 'hono';
import { ListWishlistQuery } from '@application/Queries/ListWishlistQuery';
import { AddToWishlistUseCase } from '@application/usecases/AddToWishlistUseCase';
import { RemoveFromWishlistUseCase } from '@application/usecases/RemoveFromWishlistUseCase';
import { Status } from '@application/contracts/UseCase';
import { validate, validationError } from '../schemas/cart.schemas';
import { AddToWishlistSchema } from '../schemas/wishlist.schemas';

export class WishlistController {
  constructor(
    private readonly listWishlist: ListWishlistQuery,
    private readonly addToWishlist: AddToWishlistUseCase,
    private readonly removeFromWishlist: RemoveFromWishlistUseCase,
  ) {}

  async list(c: Context) {
    const result = await this.listWishlist.execute({
      userId: c.get('userId') as string,
    });

    return c.json(result, 200);
  }

  async add(c: Context) {
    const parsed = validate(AddToWishlistSchema, await c.req.json());
    if ('error' in parsed) return validationError(c, parsed.error);

    const result = await this.addToWishlist.execute({
      userId: c.get('userId') as string,
      productId: parsed.data.productId,
    });

    return c.json(result, result.status === Status.SUCCESS ? 201 : 422);
  }

  async remove(c: Context) {
    const result = await this.removeFromWishlist.execute({
      userId: c.get('userId') as string,
      productId: c.req.param('productId')!,
    });

    return c.json(result, result.status === Status.SUCCESS ? 200 : 422);
  }
}
