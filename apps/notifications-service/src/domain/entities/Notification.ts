import { IdType } from '../shared/IdType';

export enum NotificationType {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_IN_TRANSIT = 'ORDER_IN_TRANSIT',
  ORDER_OUT_FOR_DELIVERY = 'ORDER_OUT_FOR_DELIVERY',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
}

export class Notification {
  constructor(
    readonly id: IdType,
    readonly userId: IdType,
    readonly message: string,
    readonly type: NotificationType,
    readonly orderId: string | null,
    // Stable natural key that identifies the source order event that
    // originated this notification (e.g. `${orderId}:${type}`). Used to
    // deduplicate notifications when the same Kafka message is reprocessed
    // (e.g. after a consumer group rebalance or a failed Redis publish).
    readonly sourceEventKey: string | null = null,
    private read: boolean = false,
    readonly createdAt: Date = new Date(),
  ) {}

  getId(): IdType {
    return this.id;
  }

  isRead(): boolean {
    return this.read;
  }

  markAsRead(): void {
    this.read = true;
  }
}
