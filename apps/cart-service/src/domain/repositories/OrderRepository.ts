import { Order } from '../entities/order/Order';
import { IdType } from '../shared/IdType';
import { DomainEvent } from '../events/DomainEvent';

export interface OrderRepository {
  save(order: Order, events?: DomainEvent | Array<DomainEvent>): Promise<void>;
  findById(id: IdType): Promise<Order | null>;
  findByUserId(userId: IdType): Promise<Array<Order>>;
  /** Paid-but-not-yet-delivered orders, for the delivery simulator to poll. */
  findInProgress(): Promise<Array<Order>>;
}
