import { Product } from '../entities/Product';
import { IdType } from '../shared/IdType';
import { DomainEvent } from '../events/DomainEvent';

export interface ProductRepository {
  save(product: Product, event?: DomainEvent): Promise<void>;
  findById(id: IdType): Promise<Product | null>;
  delete(id: IdType, event?: DomainEvent): Promise<void>;
}
