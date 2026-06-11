import { IdType } from '@src/domain/shared/IdType';
import { Query } from '../contracts/Query';
import { Status } from '../contracts/UseCase';
import { CartQueryRepository } from '@src/domain/repositories/CartQueryRepository';

export class CartQuery implements Query<Input, Output> {
  constructor(private readonly cartQueryRepository: CartQueryRepository) {}

  async execute(input: Input): Promise<Output> {
    const cartData = await this.cartQueryRepository.findById(
      IdType.create(input.cartId),
    );

    if (!cartData) {
      return {
        status: Status.ERROR,
        message: 'Cart not found',
      };
    }

    return {
      status: Status.SUCCESS,
      cartData: cartData,
    };
  }
}

interface Input {
  cartId: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  cartData: object;
}

interface ErrorOutput {
  status: Status.ERROR;
  message: string;
}

type Output = SuccessOutput | ErrorOutput;
