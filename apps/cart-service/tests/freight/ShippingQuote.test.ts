import { ShippingQuote } from '../../src/domain/entities/freight/ShippingQuote';
import { createIdFromString } from '../factories/IdFactory';

describe('ShippingQuote', () => {
  const cartId = createIdFromString('cart-1');
  const addressId = createIdFromString('address-1');
  const now = new Date('2026-01-01T10:00:00.000Z');
  const expiresAt = new Date('2026-01-01T10:15:00.000Z');

  function buildQuote(overrides: Partial<{ cartVersion: number; shipping: number; estimatedDays: number }> = {}) {
    return new ShippingQuote(
      createIdFromString('quote-1'),
      cartId,
      addressId,
      overrides.cartVersion ?? 0,
      overrides.shipping ?? 1000,
      overrides.estimatedDays ?? 5,
      expiresAt,
      now,
    );
  }

  it('rejects a negative shipping value', () => {
    expect(() => buildQuote({ shipping: -1 })).toThrow(
      'Shipping value must not be negative',
    );
  });

  it('rejects a non-integer or negative estimatedDays', () => {
    expect(() => buildQuote({ estimatedDays: -1 })).toThrow(
      'Estimated days must be a non-negative integer',
    );
    expect(() => buildQuote({ estimatedDays: 1.5 })).toThrow(
      'Estimated days must be a non-negative integer',
    );
  });

  it('is valid for the exact cart/address/version it was issued for, before expiring', () => {
    const quote = buildQuote({ cartVersion: 2 });

    expect(
      quote.isValidFor(cartId, addressId, 2, new Date('2026-01-01T10:10:00.000Z')),
    ).toBe(true);
  });

  it('is invalid once the expiration instant has passed', () => {
    const quote = buildQuote();

    expect(quote.isValidFor(cartId, addressId, 0, expiresAt)).toBe(false);
    expect(
      quote.isValidFor(cartId, addressId, 0, new Date(expiresAt.getTime() + 1)),
    ).toBe(false);
  });

  it('is invalid for a different cart, address or cart version', () => {
    const quote = buildQuote({ cartVersion: 1 });

    expect(quote.isValidFor(createIdFromString('other-cart'), addressId, 1, now)).toBe(
      false,
    );
    expect(
      quote.isValidFor(cartId, createIdFromString('other-address'), 1, now),
    ).toBe(false);
    expect(quote.isValidFor(cartId, addressId, 2, now)).toBe(false);
  });
});
