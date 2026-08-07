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

const PAYMENT_WINDOW_MS = 15 * 60 * 1000;

export interface OrderAddressSnapshot {
  label: string;
  recipient: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
}

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
    readonly expiresAt: Date = new Date(createdAt.getTime() + PAYMENT_WINDOW_MS),
    readonly checkoutIdempotencyKey: string | null = null,
    readonly inventoryReservationId: string | null = null,
    readonly savedAddressId: string | null = null,
    readonly shippingAddress: OrderAddressSnapshot | null = null,
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
    const currentIndex = STATUS_PROGRESSION.indexOf(this.status);
    if (currentIndex === -1) return null;
    const nextIndex = currentIndex + 1;

    return nextIndex < STATUS_PROGRESSION.length
      ? STATUS_PROGRESSION[nextIndex]
      : null;
  }

  markAsPaid(paidAt: Date = new Date()): void {
    if (this.status !== OrderStatus.CREATED) {
      throw new Error(
        `Cannot mark order as paid from status ${this.status}`,
      );
    }

    if (paidAt.getTime() >= this.expiresAt.getTime()) {
      throw new Error('Cannot pay an expired order');
    }

    this.status = OrderStatus.PAID;
  }

  cancel(): void {
    if (this.status !== OrderStatus.CREATED) {
      throw new Error(`Cannot cancel order from status ${this.status}`);
    }
    this.status = OrderStatus.CANCELLED;
  }

  expire(referenceDate: Date = new Date()): void {
    if (this.status !== OrderStatus.CREATED) {
      throw new Error(`Cannot expire order from status ${this.status}`);
    }
    if (referenceDate.getTime() < this.expiresAt.getTime()) {
      throw new Error('Cannot expire order before its payment window ends');
    }
    this.status = OrderStatus.EXPIRED;
  }

  isNotifiablePurchase(): boolean {
    return this.status === OrderStatus.PAID;
  }

  advanceLogisticsTo(status: OrderStatus, originCity?: string): void {
    if (status === OrderStatus.PAID) {
      throw new Error('Paid status can only be set by payment confirmation');
    }

    const nextStatus = this.getNextStatus();

    if (status !== nextStatus) {
      throw new Error(
        `Cannot move order status from ${this.status} to ${status}`,
      );
    }

    this.status = status;

    if (status === OrderStatus.IN_TRANSIT && originCity) {
      this.originCity = originCity;
    }
  }
}
