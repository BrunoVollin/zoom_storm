import { DomainEvent, DomainEventName } from '@src/domain/events/DomainEvent';
import { EventPublisher } from '@src/domain/events/EventPublisher';
import { CartRepository } from '../../domain/repositories/CartRepository';
import { IdType } from '../../domain/shared/IdType';
import { Status, UseCase } from '../contracts/UseCase';
import { CartMapper } from '../mappers/CartMapper';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';

export class CheckoutUseCase implements UseCase<Input, Output> {
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

      if (cart.getUserId().toString() !== input.userId) {
        return {
          status: Status.ERROR,
          message: 'Cart not found',
        };
      }

      const items = cart.getItems();

      if (items.length === 0) {
        return {
          status: Status.ERROR,
          message: 'Cart is empty',
        };
      }

      const subtotal = cart.calcSubtotal();
      const discount = cart.calcTotalDiscount(subtotal);
      const total = cart.calcTotal();
      const shipping = input.shipping;

      const finalTotal = total + shipping;

      const event = new DomainEvent(
        DomainEventName.CART_CHECKED_OUT,
        { ...CartMapper.toPrimitives(cart), shipping, total: finalTotal },
        new Date(),
      );

      await this.eventPublisher.publish(event);

      return {
        status: Status.SUCCESS,
        subtotal,
        discount,
        shipping,
        total: finalTotal,
      };
    } catch (error) {
      return handleUnexpectedError(error);
    }
  }
}

interface Input {
  cartId: string;
  userId: string;
  shipping: number;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

interface ErrorOutput {
  status: Status.ERROR;
  message: string;
}

type Output = SuccessOutput | ErrorOutput;
