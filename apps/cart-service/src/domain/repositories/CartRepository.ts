import { Cart } from '../entities/cart/Cart';
import { IdType } from '../shared/IdType';

export interface CartRepository {
  save(cart: Cart): Promise<void>;
  findById(id: IdType): Promise<Cart | null>;
}
