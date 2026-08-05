import { DomainEvent, DomainEventName } from '@src/domain/events/DomainEvent';
import { CartRepository } from '../../domain/repositories/CartRepository';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { CepLookupService } from '../../domain/repositories/CepLookupService';
import { Order } from '../../domain/entities/order/Order';
import { OrderItem } from '../../domain/entities/order/OrderItem';
import { IdType } from '../../domain/shared/IdType';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import { CartMapper, CartPrimitives } from '../mappers/CartMapper';
import { OrderMapper, OrderPrimitives } from '../mappers/OrderMapper';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';

export class CheckoutUseCase implements UseCase<Input, Output> {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly orderRepository: OrderRepository,
    private readonly cepLookupService?: CepLookupService,
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

      const destinationAddress = input.cep
        ? await this.cepLookupService?.lookup(input.cep)
        : null;

      const order = new Order(
        IdType.create(),
        cart.getUserId(),
        cart.getId(),
        cart.getItems().map(
          (item) =>
            new OrderItem(
              IdType.create(),
              item.product.productId,
              item.product.productName,
              item.product.price,
              item.quantity,
            ),
        ),
        subtotal,
        discount,
        shipping,
        finalTotal,
        undefined,
        undefined,
        undefined,
        destinationAddress?.city ?? null,
      );

      const orderCreatedEvent = new DomainEvent(
        DomainEventName.ORDER_CREATED,
        OrderMapper.toPrimitives(order),
        new Date(),
      );

      await this.orderRepository.save(order, orderCreatedEvent);

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

      await this.cartRepository.save(cart, [checkedOutEvent, clearedCartEvent]);

      return {
        status: Status.SUCCESS,
        cart: CartMapper.toPrimitives(cart),
        order: OrderMapper.toPrimitives(order),
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
  cep?: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  cart: CartPrimitives;
  order: OrderPrimitives;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

type Output = SuccessOutput | ErrorOutput;
