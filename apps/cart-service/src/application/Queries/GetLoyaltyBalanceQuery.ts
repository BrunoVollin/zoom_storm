import { IdType } from '@src/domain/shared/IdType';
import { LoyaltyRepository } from '@src/domain/repositories/LoyaltyRepository';
import { Query } from '../contracts/Query';
import { Status } from '../contracts/UseCase';

export class GetLoyaltyBalanceQuery implements Query<Input, Output> {
  constructor(private readonly loyaltyRepository: LoyaltyRepository) {}

  async execute(input: Input): Promise<Output> {
    const account = await this.loyaltyRepository.findByUserId(
      IdType.create(input.userId),
    );

    return {
      status: Status.SUCCESS,
      balance: account?.getBalance() ?? 0,
    };
  }
}

interface Input {
  userId: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  balance: number;
}

type Output = SuccessOutput;
