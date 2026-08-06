import { WishlistItem } from '../../src/domain/entities/wishlist/WishlistItem';
import { createIdFromString } from '../factories/IdFactory';

describe('WishlistItem', () => {
  it('stores id, userId, productId and productName as given', () => {
    const id = createIdFromString('item-1');
    const userId = createIdFromString('user-1');
    const productId = createIdFromString('product-1');
    const createdAt = new Date('2026-01-01T00:00:00.000Z');

    const item = new WishlistItem(
      id,
      userId,
      productId,
      'Bluza',
      createdAt,
    );

    expect(item.id).toBe(id);
    expect(item.userId).toBe(userId);
    expect(item.productId).toBe(productId);
    expect(item.productName).toBe('Bluza');
    expect(item.createdAt).toBe(createdAt);
  });

  it('defaults createdAt to the current date when not provided', () => {
    const before = new Date();

    const item = new WishlistItem(
      createIdFromString('item-1'),
      createIdFromString('user-1'),
      createIdFromString('product-1'),
      'Bluza',
    );

    const after = new Date();

    expect(item.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(item.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});
