import {
  CouponFixedAmount,
  CouponPercentByTime,
  CouponType,
  CouponValidationError,
} from '../../domain/entities/coupon/Coupon';
import { CouponRepository } from '../../domain/repositories/CouponRepository';
import { IdType } from '../../domain/shared/IdType';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import { CouponMapper, CouponPrimitives } from '../mappers/CouponMapper';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';

export class UpdateCouponUseCase implements UseCase<Input, Output> {
  constructor(private readonly couponRepository: CouponRepository) {}

  async execute(input: Input): Promise<Output> {
    try {
      const id = IdType.create(input.id);
      const existing = await this.couponRepository.findById(id);

      if (!existing) {
        return { status: Status.ERROR, message: 'Coupon not found' };
      }

      const nameOwner = await this.couponRepository.findByName(input.name);
      if (nameOwner && nameOwner.id.toString() !== id.toString()) {
        return {
          status: Status.ERROR,
          message: `A coupon named "${input.name}" already exists`,
        };
      }

      const today = new Date();

      let coupon;
      try {
        coupon =
          input.type === CouponType.FIXED
            ? new CouponFixedAmount(
                id,
                input.name,
                today,
                input.start,
                input.end,
                input.amount ?? 0,
              )
            : new CouponPercentByTime(
                id,
                input.name,
                today,
                input.start,
                input.end,
                input.percent ?? 0,
              );
      } catch (error) {
        if (error instanceof CouponValidationError) {
          return { status: Status.ERROR, message: error.message };
        }
        throw error;
      }

      await this.couponRepository.save(coupon);

      return {
        status: Status.SUCCESS,
        coupon: CouponMapper.toPrimitives(coupon),
      };
    } catch (error) {
      return handleUnexpectedError(error);
    }
  }
}

interface Input {
  id: string;
  name: string;
  type: CouponType;
  start: Date;
  end: Date;
  percent?: number;
  amount?: number;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  coupon: CouponPrimitives;
}

type Output = SuccessOutput | ErrorOutput;
