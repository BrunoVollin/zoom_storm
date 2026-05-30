import { Product } from "../product/Product";
import { IdType } from "../../shared/IdType";

export class CartItem {
  constructor(
    readonly id: IdType,
    readonly product: Product,
    readonly quantity: number,
  ) {}

  getPrice() {
    return this.product.price * this.quantity;
  }

  getVolume(): number {
    return this.product.getVolume() * this.quantity;
  }
}
