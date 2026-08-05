import { IdType } from '@src/domain/shared/IdType';
import { OrderRepository } from '@src/domain/repositories/OrderRepository';
import { Query } from '../contracts/Query';
import { Status } from '../contracts/UseCase';
import { OrderMapper, OrderPrimitives } from '../mappers/OrderMapper';

export class ListOrdersQuery implements Query<Input, Output> {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: Input): Promise<Output> {
    const orders = await this.orderRepository.findByUserId(
      IdType.create(input.userId),
    );

    return {
      status: Status.SUCCESS,
      orders: orders.map((order) => OrderMapper.toPrimitives(order)),
    };
  }
}

interface Input {
  userId: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  orders: Array<OrderPrimitives>;
}

type Output = SuccessOutput;
