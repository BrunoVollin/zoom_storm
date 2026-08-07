import { DomainEvent, DomainEventName } from '../../domain/events/DomainEvent';
import { CartRepository } from '../../domain/repositories/CartRepository';
import { IdType } from '../../domain/shared/IdType';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import { CartMapper, CartPrimitives } from '../mappers/CartMapper';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';

export class RemoveLoyaltyRedemptionUseCase
  implements UseCase<Input, Output>
{
  constructor(private readonly cartRepository: CartRepository) {}

  async execute(input: Input): Promise<Output> {
    try {
      const cart = await this.cartRepository.findById(
        IdType.create(input.cartId),
      );

      if (!cart || cart.getUserId().toString() !== input.userId) {
        return { status: Status.ERROR, message: 'Cart not found' };
      }

      cart.removeLoyaltyRedemption();
      const cartPrimitives = CartMapper.toPrimitives(cart);
      await this.cartRepository.save(
        cart,
        new DomainEvent(
          DomainEventName.CART_UPDATED,
          cartPrimitives,
          new Date(),
        ),
      );

      return { status: Status.SUCCESS, cart: cartPrimitives };
    } catch (error) {
      return handleUnexpectedError(error);
    }
  }
}

interface Input {
  cartId: string;
  userId: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  cart: CartPrimitives;
}

type Output = SuccessOutput | ErrorOutput;
