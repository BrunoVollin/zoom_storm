import { CouponRepository } from '../../domain/repositories/CouponRepository';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import { CouponMapper, CouponPrimitives } from '../mappers/CouponMapper';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';

/**
 * Lists every coupon registered in the system, for the admin coupon
 * management area. The `CouponRepository` currently has no pagination
 * support, so this returns the full list (mirrors `findAll()`'s contract).
 */
export class ListCouponsUseCase implements UseCase<Input, Output> {
  constructor(private readonly couponRepository: CouponRepository) {}

  async execute(_input: Input): Promise<Output> {
    try {
      const coupons = await this.couponRepository.findAll();

      return {
        status: Status.SUCCESS,
        coupons: coupons
          .filter((coupon) => !coupon.isDeleted())
          .map((coupon) => CouponMapper.toPrimitives(coupon)),
      };
    } catch (error) {
      return handleUnexpectedError(error);
    }
  }
}

type Input = Record<string, never>;

interface SuccessOutput {
  status: Status.SUCCESS;
  coupons: Array<CouponPrimitives>;
}

type Output = SuccessOutput | ErrorOutput;
