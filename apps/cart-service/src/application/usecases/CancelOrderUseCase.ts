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

export class CancelOrderUseCase implements UseCase<Input, Output> {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly inventoryReservationService: InventoryReservationService,
    private readonly loyaltyReservationRepository: LoyaltyReservationRepository,
    private readonly releaseLoyaltyReservation: ReleaseLoyaltyReservationUseCase,
  ) {}

  async execute(input: Input): Promise<Output> {
    try {
      const order = await this.orderRepository.findById(IdType.create(input.orderId));
      if (!order || !order.belongsTo(IdType.create(input.userId))) {
        return { status: Status.ERROR, message: 'Order not found' };
      }

      if (order.getStatus() === OrderStatus.CANCELLED) {
        return { status: Status.SUCCESS, order: OrderMapper.toPrimitives(order) };
      }

      if (order.getStatus() !== OrderStatus.CREATED) {
        throw new Error(`Cannot cancel order from status ${order.getStatus()}`);
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
          userId: input.userId,
        });
        if (releaseResult.status === Status.ERROR) {
          return releaseResult;
        }
      }

      order.cancel();
      const event = new DomainEvent(
        DomainEventName.ORDER_STATUS_CHANGED,
        OrderMapper.toPrimitives(order),
        new Date(),
      );
      await this.orderRepository.save(order, event);
      return { status: Status.SUCCESS, order: OrderMapper.toPrimitives(order) };
    } catch (error) {
      if (error instanceof Error) return { status: Status.ERROR, message: error.message };
      return handleUnexpectedError(error);
    }
  }
}

interface Input { orderId: string; userId: string }
interface SuccessOutput { status: Status.SUCCESS; order: OrderPrimitives }
type Output = SuccessOutput | ErrorOutput;
