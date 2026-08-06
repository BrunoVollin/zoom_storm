import { ProductVariant } from '../entities/product/ProductVariant';
import { IdType } from '../shared/IdType';

export interface ProductRepository {
  findById(id: IdType): Promise<ProductVariant | null>;
  findByIds(ids: Array<IdType>): Promise<Array<ProductVariant>>;
  /**
   * Looks up any variant belonging to the given parent product id.
   * Product display data (name, description, category, ...) is denormalized
   * onto every variant document, so returning the first match is enough for
   * use cases that only need product-level (not variant-level) data, such
   * as the wishlist.
   */
  findByProductId(productId: IdType): Promise<ProductVariant | null>;
}
