import { ProductVariant } from '../product/ProductVariant';
import { IdType } from '../../shared/IdType';

export class CartItem {
  constructor(
    readonly id: IdType,
    readonly product: ProductVariant,
    readonly quantity: number,
  ) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('CartItem quantity must be a positive integer');
    }
  }

  getPrice() {
    return this.product.price * this.quantity;
  }

  getVolume(): number {
    return this.product.getVolume() * this.quantity;
  }

  getWeight(): number {
    return this.product.weight * this.quantity;
  }
}
