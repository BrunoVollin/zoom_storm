import { DomainEvent, DomainEventName } from '@src/domain/events/DomainEvent';
import { CartItem } from '../../domain/entities/cart/CartItem';
import { CartRepository } from '../../domain/repositories/CartRepository';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { IdType } from '../../domain/shared/IdType';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import { CartMapper, CartPrimitives } from '../mappers/CartMapper';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';

export class UpdateItemQuantityUseCase implements UseCase<Input, Output> {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository,
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
      const itemIndex = items.findIndex(
        (item) => item.id.toString() === input.itemId,
      );

      if (itemIndex === -1) {
        return {
          status: Status.ERROR,
          message: 'Item not found in cart',
        };
      }

      const currentItem = items[itemIndex];
      const product = await this.productRepository.findById(
        currentItem.product.getId(),
      );

      if (!product) {
        return {
          status: Status.ERROR,
          message: 'Product not found',
        };
      }

      cart.removeItem(IdType.create(input.itemId));
      cart.addItem(
        new CartItem(IdType.create(input.itemId), product, input.quantity),
      );

      const event = new DomainEvent(
        DomainEventName.CART_UPDATED,
        CartMapper.toPrimitives(cart),
        new Date(),
      );

      await this.cartRepository.save(cart, event);

      return {
        status: Status.SUCCESS,
        cart: CartMapper.toPrimitives(cart),
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
  quantity: number;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  cart: CartPrimitives;
}

type Output = SuccessOutput | ErrorOutput;
