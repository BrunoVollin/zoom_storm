import { DomainEvent, DomainEventName } from '@src/domain/events/DomainEvent';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { OrderStatus } from '../../domain/entities/order/OrderStatus';
import { IdType } from '../../domain/shared/IdType';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import { OrderMapper, OrderPrimitives } from '../mappers/OrderMapper';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';

export class UpdateOrderStatusUseCase implements UseCase<Input, Output> {
  constructor(
    private readonly orderRepository: OrderRepository,
    // No warehouse/distribution-center concept exists in the system yet —
    // origin is a fixed, configurable value set the moment the order leaves
    // for delivery.
    private readonly originCity: string = 'São Paulo',
  ) {}

  async execute(input: Input): Promise<Output> {
    try {
      if (input.status === OrderStatus.PAID) {
        return {
          status: Status.ERROR,
          message: 'Paid status can only be set by payment confirmation',
        };
      }

      const order = await this.orderRepository.findById(
        IdType.create(input.orderId),
      );

      if (!order) {
        return { status: Status.ERROR, message: 'Order not found' };
      }

      order.advanceLogisticsTo(input.status, this.originCity);

      const statusChangedEvent = new DomainEvent(
        DomainEventName.ORDER_STATUS_CHANGED,
        OrderMapper.toPrimitives(order),
        new Date(),
      );

      await this.orderRepository.save(order, statusChangedEvent);

      return {
        status: Status.SUCCESS,
        order: OrderMapper.toPrimitives(order),
      };
    } catch (error) {
      if (error instanceof Error) {
        return { status: Status.ERROR, message: error.message };
      }

      return handleUnexpectedError(error);
    }
  }
}

interface Input {
  orderId: string;
  status: OrderStatus;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  order: OrderPrimitives;
}

type Output = SuccessOutput | ErrorOutput;
