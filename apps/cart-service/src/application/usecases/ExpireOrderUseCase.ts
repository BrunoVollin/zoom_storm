import { DomainEvent, DomainEventName } from '@src/domain/events/DomainEvent';
import { OrderRepository } from '@src/domain/repositories/OrderRepository';
import { IdType } from '@src/domain/shared/IdType';
import { InventoryReservationService } from '@src/domain/repositories/InventoryReservationService';
import { LoyaltyReservationRepository } from '@src/domain/repositories/LoyaltyReservationRepository';
import { LoyaltyReservationStatus } from '@src/domain/entities/loyalty/LoyaltyReservation';
import { OrderStatus } from '@src/domain/entities/order/OrderStatus';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import { OrderMapper, OrderPrimitives } from '../mappers/OrderMapper';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';
import { ReleaseLoyaltyReservationUseCase } from './ReleaseLoyaltyReservationUseCase';

export class ExpireOrderUseCase implements UseCase<Input, Output> {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly inventoryReservationService: InventoryReservationService,
    private readonly loyaltyReservationRepository: LoyaltyReservationRepository,
    private readonly releaseLoyaltyReservation: ReleaseLoyaltyReservationUseCase,
  ) {}

  async execute(input: Input): Promise<Output> {
    try {
      const order = await this.orderRepository.findById(IdType.create(input.orderId));
      if (!order) return { status: Status.ERROR, message: 'Order not found' };

      if (order.getStatus() === OrderStatus.EXPIRED) {
        return { status: Status.SUCCESS, order: OrderMapper.toPrimitives(order) };
      }
      if (order.getStatus() !== OrderStatus.CREATED) {
        throw new Error(`Cannot expire order from status ${order.getStatus()}`);
      }
      if (input.referenceDate.getTime() < order.expiresAt.getTime()) {
        throw new Error('Cannot expire order before its payment window ends');
      }

      const released = await this.inventoryReservationService.release(
        order.id.toString(),
      );
      if (!released.ok) {
        return {
          status: Status.ERROR,
          message: released.message,
          code: released.code,
        };
      }

      const loyaltyReservation = await this.loyaltyReservationRepository.findByOrderId(
        order.id,
      );
      if (
        loyaltyReservation &&
        loyaltyReservation.getStatus() === LoyaltyReservationStatus.ACTIVE
      ) {
        const releaseResult = await this.releaseLoyaltyReservation.execute({
          orderId: order.id.toString(),
          userId: order.userId.toString(),
          releasedAt: input.referenceDate,
        });
        if (releaseResult.status === Status.ERROR) {
          return releaseResult;
        }
      }

      order.expire(input.referenceDate);
      const event = new DomainEvent(
        DomainEventName.ORDER_STATUS_CHANGED,
        OrderMapper.toPrimitives(order),
        input.referenceDate,
      );
      await this.orderRepository.save(order, event);
      return { status: Status.SUCCESS, order: OrderMapper.toPrimitives(order) };
    } catch (error) {
      if (error instanceof Error) return { status: Status.ERROR, message: error.message };
      return handleUnexpectedError(error);
    }
  }
}

interface Input { orderId: string; referenceDate: Date }
interface SuccessOutput { status: Status.SUCCESS; order: OrderPrimitives }
type Output = SuccessOutput | ErrorOutput;
