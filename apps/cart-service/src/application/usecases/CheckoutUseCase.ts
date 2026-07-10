import { DomainEvent, DomainEventName } from '@src/domain/events/DomainEvent';
import { CartRepository } from '../../domain/repositories/CartRepository';
import { IdType } from '../../domain/shared/IdType';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import { CartMapper, CartPrimitives } from '../mappers/CartMapper';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';

export class CheckoutUseCase implements UseCase<Input, Output> {
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

      const checkoutSnapshot = {
        ...CartMapper.toPrimitives(cart),
        shipping,
        total: finalTotal,
      };

      const checkedOutEvent = new DomainEvent(
        DomainEventName.CART_CHECKED_OUT,
        checkoutSnapshot,
        new Date(),
      );

      cart.clear();

      const clearedCartEvent = new DomainEvent(
        DomainEventName.CART_UPDATED,
        CartMapper.toPrimitives(cart),
        new Date(),
      );

      await this.cartRepository.save(cart, [
        checkedOutEvent,
        clearedCartEvent,
      ]);

      return {
        status: Status.SUCCESS,
        cart: CartMapper.toPrimitives(cart),
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
  cart: CartPrimitives;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

type Output = SuccessOutput | ErrorOutput;
