import { ProductVariant } from '../entities/product/ProductVariant';
import { IdType } from '../shared/IdType';

export interface ProductRepository {
  findById(id: IdType): Promise<ProductVariant | null>;
  findByIds(ids: Array<IdType>): Promise<Array<ProductVariant>>;
}
