import type { Context } from 'hono';
import { AddItemToCartUseCase } from '@application/usecases/AddItemToCartUseCase';
import { RemoveItemFromCartUseCase } from '@application/usecases/RemoveItemFromCartUseCase';
import { UpdateItemQuantityUseCase } from '@application/usecases/UpdateItemQuantityUseCase';
import {
  validate,
  validationError,
  httpStatus,
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
      userId: c.get('userId') as string,
      products: parsed.data.products,
    });

    return c.json(result, httpStatus(result));
  }

  async remove(c: Context) {
    const result = await this.removeItemUseCase.execute({
      cartId: c.req.param('cartId')!,
      userId: c.get('userId') as string,
      itemId: c.req.param('itemId')!,
    });

    return c.json(result, httpStatus(result));
  }

  async updateQuantity(c: Context) {
    const parsed = validate(UpdateQuantitySchema, await c.req.json());
    if ('error' in parsed) return validationError(c, parsed.error);

    const result = await this.updateItemQuantityUseCase.execute({
      cartId: c.req.param('cartId')!,
      userId: c.get('userId') as string,
      itemId: c.req.param('itemId')!,
      quantity: parsed.data.quantity,
    });

    return c.json(result, httpStatus(result));
  }
}
