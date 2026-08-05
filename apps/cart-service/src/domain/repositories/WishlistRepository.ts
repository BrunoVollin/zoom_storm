import { WishlistItem } from '../entities/wishlist/WishlistItem';
import { IdType } from '../shared/IdType';

export interface WishlistRepository {
  add(item: WishlistItem): Promise<void>;
  remove(userId: IdType, productId: IdType): Promise<void>;
  findByUserId(userId: IdType): Promise<Array<WishlistItem>>;
}
