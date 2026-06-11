import { Coupon } from '../coupon/Coupon';
import { IdType } from '../../shared/IdType';
import { CartItem } from './CartItem';

export class Cart {
  constructor(
    readonly userId: IdType,
    readonly id: IdType,
  ) {}

  private items: Array<CartItem> = [];
  private coupons: Array<Coupon> = [];

  addItem(item: CartItem) {
    const existingItem = this.items.find(
      (currentItem) =>
        currentItem.product.getId().toString() ===
        item.product.getId().toString(),
    );

    if (existingItem) {
      this.items = this.items.map((currentItem) =>
        currentItem.product.getId().toString() ===
        item.product.getId().toString()
          ? new CartItem(
              currentItem.id,
              currentItem.product,
              currentItem.quantity + item.quantity,
            )
          : currentItem,
      );

      return;
    }

    this.items.push(item);
  }

  addCoupon(coupon: Coupon) {
    this.coupons.push(coupon);
  }

  removeCoupon(id: IdType) {
    this.coupons = this.coupons.filter((coupon) => !coupon.id.equals(id));
  }

  getCoupons() {
    return this.coupons;
  }

  removeItem(id: IdType) {
    this.items = this.items.filter((item) => !item.id.equals(id));
  }

  getItems() {
    return this.items;
  }

  getId() {
    return this.id;
  }

  getUserId() {
    return this.userId;
  }

  calcSubtotal() {
    const subtotal = this.items.reduce((acc, item) => acc + item.getPrice(), 0);

    return subtotal;
  }

  calcTotalDiscount(subtotal: number) {
    const discount = this.coupons.reduce((acc, coupon) => {
      const discountResult = coupon.getDiscount(subtotal);

      return acc + discountResult;
    }, 0);

    return discount;
  }

  calcTotal() {
    const subtotal = this.calcSubtotal();
    const discount = this.calcTotalDiscount(subtotal);

    return Math.max(0, subtotal - discount);
  }
}
