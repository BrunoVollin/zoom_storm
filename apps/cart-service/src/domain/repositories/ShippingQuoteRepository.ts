import { ShippingQuote } from '../entities/freight/ShippingQuote';
import { IdType } from '../shared/IdType';

export interface ShippingQuoteRepository {
  save(quote: ShippingQuote): Promise<void>;
  findById(id: IdType): Promise<ShippingQuote | null>;
}
