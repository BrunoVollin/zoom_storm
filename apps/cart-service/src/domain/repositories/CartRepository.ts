import { Cart } from '../entities/cart/Cart';
import { IdType } from '../shared/IdType';
import { DomainEvent } from '../events/DomainEvent';

export interface CartRepository {
  save(cart: Cart, event?: DomainEvent): Promise<void>;
  findById(id: IdType): Promise<Cart | null>;
}
