import { DomainEvent, DomainEventName } from '@src/domain/events/DomainEvent';
import { CartRepository } from '../../domain/repositories/CartRepository';
import { IdType } from '../../domain/shared/IdType';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import { CartMapper, CartPrimitives } from '../mappers/CartMapper';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';

export class RemoveItemFromCartUseCase implements UseCase<Input, Output> {
  constructor(private readonly cartRepository: CartRepository) {}

  async execute(input: Input): Promise<Output> {
    try {
      const cart = await this.cartRepository.findById(
        IdType.create(input.cartId),
      );

      if (!cart) {
        return {
          status: Status.ERROR,
          message: 'Cart not found',
        };
      }

      if (cart.getUserId().toString() !== input.userId) {
        return {
          status: Status.ERROR,
          message: 'Cart not found',
        };
      }

      const items = cart.getItems();
      const itemExists = items.some(
        (item) => item.id.toString() === input.itemId,
      );

      if (!itemExists) {
        return {
          status: Status.ERROR,
          message: 'Item not found in cart',
        };
      }

      cart.removeItem(IdType.create(input.itemId));

      const cartPrimitives = CartMapper.toPrimitives(cart);

      const event = new DomainEvent(
        DomainEventName.CART_ITEM_REMOVED,
        cartPrimitives,
        new Date(),
      );

      await this.cartRepository.save(cart, event);

      return {
        status: Status.SUCCESS,
        cart: cartPrimitives,
      };
    } catch (error) {
      return handleUnexpectedError(error);
    }
  }
}

interface Input {
  cartId: string;
  userId: string;
  itemId: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  cart: CartPrimitives;
}

type Output = SuccessOutput | ErrorOutput;
