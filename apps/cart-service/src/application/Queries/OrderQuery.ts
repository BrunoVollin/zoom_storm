import { IdType } from '@src/domain/shared/IdType';
import { OrderRepository } from '@src/domain/repositories/OrderRepository';
import { Query } from '../contracts/Query';
import { Status } from '../contracts/UseCase';
import { OrderMapper, OrderPrimitives } from '../mappers/OrderMapper';

export class OrderQuery implements Query<Input, Output> {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: Input): Promise<Output> {
    const order = await this.orderRepository.findById(
      IdType.create(input.orderId),
    );

    if (!order || !order.belongsTo(IdType.create(input.userId))) {
      return {
        status: Status.ERROR,
        message: 'Order not found',
      };
    }

    return {
      status: Status.SUCCESS,
      order: OrderMapper.toPrimitives(order),
    };
  }
}

interface Input {
  orderId: string;
  userId: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  order: OrderPrimitives;
}

interface ErrorOutput {
  status: Status.ERROR;
  message: string;
}

type Output = SuccessOutput | ErrorOutput;
