import { IdType } from '../../shared/IdType';

/**
 * A short-lived quote binding a shipping value to the cart/address pair it
 * was calculated for. The checkout must revalidate the quote against the
 * current cart version and address before trusting `shipping`/`estimatedDays`,
 * so a stale quote (cart changed, different address, or expired) is rejected
 * explicitly instead of silently recalculated.
 */
export class ShippingQuote {
  constructor(
    readonly id: IdType,
    readonly cartId: IdType,
    readonly addressId: IdType,
    readonly cartVersion: number,
    readonly shipping: number,
    readonly estimatedDays: number,
    readonly expiresAt: Date,
    readonly createdAt: Date = new Date(),
  ) {
    if (shipping < 0) {
      throw new Error('Shipping value must not be negative');
    }
    if (!Number.isInteger(estimatedDays) || estimatedDays < 0) {
      throw new Error('Estimated days must be a non-negative integer');
    }
    if (!Number.isFinite(expiresAt.getTime())) {
      throw new Error('Shipping quote expiration must be valid');
    }
  }

  isValidFor(
    cartId: IdType,
    addressId: IdType,
    cartVersion: number,
    at: Date = new Date(),
  ): boolean {
    return (
      this.cartId.equals(cartId) &&
      this.addressId.equals(addressId) &&
      this.cartVersion === cartVersion &&
      at.getTime() < this.expiresAt.getTime()
    );
  }
}
