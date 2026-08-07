import { IdType } from '../../shared/IdType';

export class OrderItem {
  constructor(
    readonly id: IdType,
    readonly productId: IdType,
    readonly productName: string,
    readonly productPrice: number,
    readonly quantity: number,
    readonly variantId: IdType = productId,
  ) {}

  getSubtotal(): number {
    return this.productPrice * this.quantity;
  }
}
