
import { Product } from "../entities/product/Product";
import { IdType } from "../shared/IdType";

export interface ProductRepository {
  save(product: Product): Promise<void>;
  findById(id: IdType): Promise<Product | null>;
  findByIds(ids: Array<IdType>): Promise<Array<Product>>
}