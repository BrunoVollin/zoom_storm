import { Coupon } from '../coupon/Coupon';
import { IdType } from '../../shared/IdType';
import { CartItem } from './CartItem';

export class Cart {
  constructor(
    readonly userId: IdType,
    readonly id: IdType,
    readonly version: number = 0,
  ) {}

  private items: Array<CartItem> = [];
  private coupons: Array<Coupon> = [];
  private appliedCouponVersions = new Map<string, number>();
  private loyaltyRedemptionPoints = 0;

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

  addCoupon(coupon: Coupon, appliedVersion: number = coupon.version) {
    if (this.loyaltyRedemptionPoints > 0) {
      throw new Error(
        'A promotional coupon cannot be combined with loyalty points',
      );
    }

    if (!Number.isInteger(appliedVersion) || appliedVersion < 1) {
      throw new Error('Applied coupon version must be a positive integer');
    }

    const alreadyApplied = this.coupons.some((currentCoupon) =>
      currentCoupon.id.equals(coupon.id),
    );

    if (alreadyApplied) return;

    this.coupons.push(coupon);
    this.appliedCouponVersions.set(coupon.id.toString(), appliedVersion);
  }

  removeCoupon(id: IdType) {
    this.coupons = this.coupons.filter((coupon) => !coupon.id.equals(id));
    this.appliedCouponVersions.delete(id.toString());
  }

  getCoupons() {
    return this.coupons;
  }

  getAppliedCouponVersion(id: IdType): number | null {
    return this.appliedCouponVersions.get(id.toString()) ?? null;
  }

  setLoyaltyRedemption(points: number, availableBalance: number): void {
    if (!Number.isInteger(points) || points <= 0) {
      throw new Error('Points to redeem must be a positive integer');
    }

    if (points > availableBalance) {
      throw new Error('Insufficient loyalty points balance');
    }

    if (this.coupons.length > 0) {
      throw new Error(
        'Loyalty points cannot be combined with a promotional coupon',
      );
    }

    this.loyaltyRedemptionPoints = points;
  }

  removeLoyaltyRedemption(): void {
    this.loyaltyRedemptionPoints = 0;
  }

  getLoyaltyRedemptionPoints(): number {
    return this.loyaltyRedemptionPoints;
  }

  removeItem(id: IdType) {
    this.items = this.items.filter((item) => !item.id.equals(id));
  }

  clear() {
    this.items = [];
    this.coupons = [];
    this.appliedCouponVersions.clear();
    this.loyaltyRedemptionPoints = 0;
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

  getVersion() {
    return this.version;
  }

  calcSubtotal() {
    const subtotal = this.items.reduce((acc, item) => acc + item.getPrice(), 0);

    return subtotal;
  }

  calcTotalDiscount(subtotal: number) {
    const couponDiscount = this.coupons.reduce((acc, coupon) => {
      const discountResult = coupon.getDiscount(subtotal);

      return acc + discountResult;
    }, 0);

    const loyaltyDiscount = this.loyaltyRedemptionPoints * 100;

    return Math.min(subtotal, couponDiscount + loyaltyDiscount);
  }

  calcTotal() {
    const subtotal = this.calcSubtotal();
    const discount = this.calcTotalDiscount(subtotal);

    return Math.max(0, subtotal - discount);
  }
}
