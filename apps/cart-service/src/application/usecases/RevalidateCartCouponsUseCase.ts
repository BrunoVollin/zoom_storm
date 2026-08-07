import { CartRepository } from '../../domain/repositories/CartRepository';
import { CouponRepository } from '../../domain/repositories/CouponRepository';
import { IdType } from '../../domain/shared/IdType';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import { CouponMapper, CouponPrimitives } from '../mappers/CouponMapper';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';

/**
 * Revalidates promotional coupons immediately before an order is created.
 * The returned primitives are the immutable values the checkout must snapshot
 * on the order; subsequent coupon updates must never rewrite that snapshot.
 */
export class RevalidateCartCouponsUseCase implements UseCase<Input, Output> {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly couponRepository: CouponRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    try {
      const cart = await this.cartRepository.findById(
        IdType.create(input.cartId),
      );

      if (!cart || cart.getUserId().toString() !== input.userId) {
        return { status: Status.ERROR, message: 'Cart not found' };
      }

      const appliedCoupons = cart.getCoupons();
      const currentCoupons = await this.couponRepository.findByIds(
        appliedCoupons.map((coupon) => coupon.id),
      );
      const currentById = new Map(
        currentCoupons.map((coupon) => [coupon.id.toString(), coupon]),
      );

      for (const applied of appliedCoupons) {
        const current = currentById.get(applied.id.toString());

        if (!current || current.isDeleted() || !current.isValid()) {
          return {
            status: Status.ERROR,
            message: `Coupon "${applied.getName()}" is unavailable`,
            code: 'COUPON_UNAVAILABLE',
          };
        }

        if (cart.getAppliedCouponVersion(applied.id) !== current.version) {
          return {
            status: Status.ERROR,
            message: `Coupon "${applied.getName()}" changed after it was applied`,
            code: 'COUPON_CHANGED',
          };
        }
      }

      return {
        status: Status.SUCCESS,
        coupons: appliedCoupons.map((coupon) => CouponMapper.toPrimitives(coupon)),
      };
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
  coupons: CouponPrimitives[];
}

type Output = SuccessOutput | ErrorOutput;
