import { IdType } from '../../shared/IdType';
import { OrderItem } from './OrderItem';
import { OrderStatus } from './OrderStatus';

export const STATUS_PROGRESSION: OrderStatus[] = [
  OrderStatus.CREATED,
  OrderStatus.PAID,
  OrderStatus.IN_TRANSIT,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
];

export class Order {
  constructor(
    readonly id: IdType,
    readonly userId: IdType,
    readonly cartId: IdType,
    readonly items: Array<OrderItem>,
    readonly subtotal: number,
    readonly discount: number,
    readonly shipping: number,
    readonly total: number,
    private status: OrderStatus = OrderStatus.CREATED,
    readonly createdAt: Date = new Date(),
    private originCity: string | null = null,
    readonly destinationCity: string | null = null,
    readonly updatedAt: Date = createdAt,
  ) {}

  getStatus(): OrderStatus {
    return this.status;
  }

  getOriginCity(): string | null {
    return this.originCity;
  }

  belongsTo(userId: IdType): boolean {
    return this.userId.equals(userId);
  }

  /** Next step in the fixed status progression, or null once DELIVERED. */
  getNextStatus(): OrderStatus | null {
    const nextIndex = STATUS_PROGRESSION.indexOf(this.status) + 1;

    return nextIndex < STATUS_PROGRESSION.length
      ? STATUS_PROGRESSION[nextIndex]
      : null;
  }

  advanceTo(status: OrderStatus, originCity?: string) {
    const currentIndex = STATUS_PROGRESSION.indexOf(this.status);
    const targetIndex = STATUS_PROGRESSION.indexOf(status);

    if (targetIndex <= currentIndex) {
      throw new Error(
        `Cannot move order status from ${this.status} back to ${status}`,
      );
    }

    this.status = status;

    if (status === OrderStatus.IN_TRANSIT && originCity) {
      this.originCity = originCity;
    }
  }
}
