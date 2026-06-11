import { Product } from '../entities/Product';
import { IdType } from '../shared/IdType';

export interface ProductRepository {
  save(product: Product): Promise<void>;
  findById(id: IdType): Promise<Product | null>;
  delete(id: IdType): Promise<void>;
}
