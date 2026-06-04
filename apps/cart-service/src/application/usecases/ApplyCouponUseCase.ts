import { EventPublisher } from '@src/domain/events/EventPublisher';
import { CartRepository } from '../../domain/repositories/CartRepository';
import { CouponRepository } from '../../domain/repositories/CouponRepository';
import { IdType } from '../../domain/shared/IdType';
import { Status, UseCase } from '../contracts/UseCase';
import { CartMapper, CartPrimitives } from '../mappers/CartMapper';
import { DomainEvent, DomainEventName } from '@src/domain/events/DomainEvent';

export class ApplyCouponUseCase implements UseCase<Input, Output> {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly couponRepository: CouponRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(input: Input): Promise<Output> {
    try {
      const [cart, coupon] = await Promise.all([
        this.cartRepository.findById(IdType.create(input.cartId)),
        this.couponRepository.findById(IdType.create(input.couponId)),
      ]);

      if (!cart) {
        return {
          status: Status.ERROR,
          message: 'Cart not found',
        };
      }

      if (!coupon) {
        return {
          status: Status.ERROR,
          message: 'Coupon not found',
        };
      }

      if (!coupon.isValid()) {
        return {
          status: Status.ERROR,
          message: 'Error: ' + coupon.getName(),
        };
      }

      cart.addCoupon(coupon);
      await this.cartRepository.save(cart);

      const event = new DomainEvent(
        DomainEventName.CART_UPDATED,
        CartMapper.toPrimitives(cart),
        new Date(),
      );

      await this.eventPublisher.publish(event);

      return {
        status: Status.SUCCESS,
        cart: CartMapper.toPrimitives(cart),
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
  couponId: string;
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
