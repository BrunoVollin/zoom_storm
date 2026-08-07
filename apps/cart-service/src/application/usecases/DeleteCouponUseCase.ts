import { CouponRepository } from '../../domain/repositories/CouponRepository';
import { IdType } from '../../domain/shared/IdType';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';

export class DeleteCouponUseCase implements UseCase<Input, Output> {
  constructor(private readonly couponRepository: CouponRepository) {}

  async execute(input: Input): Promise<Output> {
    try {
      const id = IdType.create(input.id);
      const existing = await this.couponRepository.findById(id);

      if (!existing) {
        return { status: Status.ERROR, message: 'Coupon not found' };
      }

      await this.couponRepository.delete(id);

      return { status: Status.SUCCESS };
    } catch (error) {
      return handleUnexpectedError(error);
    }
  }
}

interface Input {
  id: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
}

type Output = SuccessOutput | ErrorOutput;
