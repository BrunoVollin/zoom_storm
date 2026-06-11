import type { Context } from 'hono';
import { AddItemToCartUseCase } from '@application/usecases/AddItemToCartUseCase';
import { RemoveItemFromCartUseCase } from '@application/usecases/RemoveItemFromCartUseCase';
import { UpdateItemQuantityUseCase } from '@application/usecases/UpdateItemQuantityUseCase';
import { Status } from '@application/contracts/UseCase';
import {
  validate,
  validationError,
  AddItemsSchema,
  UpdateQuantitySchema,
} from '../schemas/cart.schemas';

export class CartItemController {
  constructor(
    private readonly addItemUseCase: AddItemToCartUseCase,
    private readonly removeItemUseCase: RemoveItemFromCartUseCase,
    private readonly updateItemQuantityUseCase: UpdateItemQuantityUseCase,
  ) {}

  async add(c: Context) {
    const parsed = validate(AddItemsSchema, await c.req.json());
    if ('error' in parsed) return validationError(c, parsed.error);

    const result = await this.addItemUseCase.execute({
      cartId: c.req.param('cartId')!,
      products: parsed.data.products,
    });
    const status = result.status === Status.SUCCESS ? 200 : 422;

    return c.json(result, status);
  }

  async remove(c: Context) {
    const result = await this.removeItemUseCase.execute({
      cartId: c.req.param('cartId')!,
      itemId: c.req.param('itemId')!,
    });
    const status = result.status === Status.SUCCESS ? 200 : 422;

    return c.json(result, status);
  }

  async updateQuantity(c: Context) {
    const parsed = validate(UpdateQuantitySchema, await c.req.json());
    if ('error' in parsed) return validationError(c, parsed.error);

    const result = await this.updateItemQuantityUseCase.execute({
      cartId: c.req.param('cartId')!,
      itemId: c.req.param('itemId')!,
      quantity: parsed.data.quantity,
    });
    const status = result.status === Status.SUCCESS ? 200 : 422;

    return c.json(result, status);
  }
}
