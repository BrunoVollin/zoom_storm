import { DomainEvent, DomainEventName } from '@src/domain/events/DomainEvent';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { LoyaltyRepository } from '../../domain/repositories/LoyaltyRepository';
import { LoyaltyAccount } from '../../domain/entities/loyalty/LoyaltyAccount';
import { IdType } from '../../domain/shared/IdType';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import { OrderMapper, OrderPrimitives } from '../mappers/OrderMapper';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';

const CENTS_PER_POINT = 100;

export class PayOrderUseCase implements UseCase<Input, Output> {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly loyaltyRepository: LoyaltyRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    try {
      const order = await this.orderRepository.findById(
        IdType.create(input.orderId),
      );

      if (!order || !order.belongsTo(IdType.create(input.userId))) {
        return { status: Status.ERROR, message: 'Order not found' };
      }

      order.markAsPaid();

      const statusChangedEvent = new DomainEvent(
        DomainEventName.ORDER_STATUS_CHANGED,
        OrderMapper.toPrimitives(order),
        new Date(),
      );

      await this.orderRepository.save(order, statusChangedEvent);

      const pointsEarned = Math.floor(order.total / CENTS_PER_POINT);

      if (pointsEarned > 0) {
        const userId = IdType.create(input.userId);
        const account =
          (await this.loyaltyRepository.findByUserId(userId)) ??
          new LoyaltyAccount(userId, 0);

        account.earn(pointsEarned);
        await this.loyaltyRepository.save(account, {
          type: 'EARN',
          points: pointsEarned,
          orderId: order.id.toString(),
        });
      }

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
  userId: string;
  installments: number;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  order: OrderPrimitives;
}

type Output = SuccessOutput | ErrorOutput;
