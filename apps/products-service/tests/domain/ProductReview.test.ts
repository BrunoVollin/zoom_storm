import { ProductReview } from '../../src/domain/entities/ProductReview';
import { ReviewErrorCode } from '../../src/domain/errors/ReviewError';
import { IdType } from '../../src/domain/shared/IdType';
import { makeProduct } from '../factories/ProductFactory';

function makeReview(options?: {
  id?: string;
  productId?: string;
  userId?: string | null;
  orderId?: string | null;
  rating?: number;
}) {
  return new ProductReview(
    IdType.create(options?.id ?? 'review-1'),
    IdType.create(options?.productId ?? 'product-1'),
    options?.rating ?? 5,
    'Excellent game',
    'Authenticated User',
    'user@example.com',
    new Date('2026-08-07T12:00:00.000Z'),
    options?.userId === undefined
      ? IdType.create('user-1')
      : options.userId === null
        ? null
        : IdType.create(options.userId),
    options?.orderId === undefined
      ? IdType.create('order-1')
      : options.orderId === null
        ? null
        : IdType.create(options.orderId),
  );
}

describe('ProductReview', () => {
  it('supports legacy reviews without user and order identifiers', () => {
    const review = makeReview({ userId: null, orderId: null });

    expect(review.userId).toBeNull();
    expect(review.orderId).toBeNull();
    expect(
      review.belongsToPurchase(
        IdType.create('user-1'),
        IdType.create('order-1'),
      ),
    ).toBe(false);
  });

  it('requires both purchase identifiers together', () => {
    expect(() => makeReview({ userId: 'user-1', orderId: null })).toThrow(
      ReviewErrorCode.INVALID_REVIEW,
    );
  });

  it('adds an authorized review and recalculates the average', () => {
    const product = makeProduct();
    const first = product.addReview(makeReview({ rating: 5 }));
    const second = first.addReview(
      makeReview({ id: 'review-2', orderId: 'order-2', rating: 3 }),
    );

    expect(second.reviews).toHaveLength(2);
    expect(second.rating).toBe(4);
    expect(product.reviews).toHaveLength(0);
  });

  it('blocks a second review for the same user, order and product', () => {
    const reviewed = makeProduct().addReview(makeReview());

    expect(() => reviewed.addReview(makeReview({ id: 'review-2' }))).toThrow(
      ReviewErrorCode.REVIEW_ALREADY_EXISTS,
    );
  });

  it('does not let a review be attached to another product', () => {
    expect(() =>
      makeProduct().addReview(makeReview({ productId: 'product-2' })),
    ).toThrow(ReviewErrorCode.INVALID_REVIEW);
  });
});
