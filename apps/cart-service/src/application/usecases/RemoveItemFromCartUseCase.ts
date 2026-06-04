import { DomainEvent, DomainEventName } from '@src/domain/events/DomainEvent';
import { EventPublisher } from '@src/domain/events/EventPublisher';
import { CartRepository } from '../../domain/repositories/CartRepository';
import { IdType } from '../../domain/shared/IdType';
import { Status, UseCase } from '../contracts/UseCase';
import { CartMapper, CartPrimitives } from '../mappers/CartMapper';

export class RemoveItemFromCartUseCase implements UseCase<Input, Output> {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

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
      await this.cartRepository.save(cart);

      const cartPrimitives = CartMapper.toPrimitives(cart);

      const event = new DomainEvent(
        DomainEventName.CART_ITEM_REMOVED,
        cartPrimitives,
        new Date(),
      );

      await this.eventPublisher.publish(event);

      return {
        status: Status.SUCCESS,
        cart: cartPrimitives,
      };
    } catch (error) {
      return {
        status: Status.ERROR,
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred.',
      };
    }
  }
}

interface Input {
  cartId: string;
  itemId: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  cart: CartPrimitives;
}

interface ErrorOutput {
  status: Status.ERROR;
  message: string;
}

type Output = SuccessOutput | ErrorOutput;
