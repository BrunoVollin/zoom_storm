import { CartRepository } from '../../domain/repositories/CartRepository';
import { IdType } from '../../domain/shared/IdType';
import { Status, UseCase } from '../contracts/UseCase';

export class RemoveCouponUseCase implements UseCase<Input, Output> {
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

      const coupons = cart.getCoupons();
      const couponExists = coupons.some(
        (coupon) => coupon.id.toString() === input.couponId,
      );

      if (!couponExists) {
        return {
          status: Status.ERROR,
          message: 'Coupon not found in cart',
        };
      }

      cart.removeCoupon(IdType.create(input.couponId));
      await this.cartRepository.save(cart);

      return {
        status: Status.SUCCESS,
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
}

interface ErrorOutput {
  status: Status.ERROR;
  message: string;
}

type Output = SuccessOutput | ErrorOutput;
