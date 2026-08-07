import { Status } from '../../src/application/contracts/UseCase';
import { CreateReviewUseCase } from '../../src/application/usecases/CreateReviewUseCase';
import { ReviewEligibility } from '../../src/domain/entities/ReviewEligibility';
import { Product } from '../../src/domain/entities/Product';
import { ProductReview } from '../../src/domain/entities/ProductReview';
import { ReviewErrorCode } from '../../src/domain/errors/ReviewError';
import { DomainEvent } from '../../src/domain/events/DomainEvent';
import { ProductRepository } from '../../src/domain/repositories/ProductRepository';
import { ReviewEligibilityRepository } from '../../src/domain/repositories/ReviewEligibilityRepository';
import { IdType } from '../../src/domain/shared/IdType';
import { makeProduct } from '../factories/ProductFactory';

class InMemoryProductRepository implements ProductRepository {
  savedEvent?: DomainEvent;

  constructor(public product: Product | null) {}

  async save(product: Product, event?: DomainEvent): Promise<void> {
    this.product = product;
    this.savedEvent = event;
  }

  async findById(id: IdType): Promise<Product | null> {
    return this.product?.id.equals(id) ? this.product : null;
  }

  async delete(): Promise<void> {}
}

class InMemoryReviewEligibilityRepository
  implements ReviewEligibilityRepository
{
  readonly eligibilities = new Map<string, ReviewEligibility>();

  async saveIfAbsent(eligibility: ReviewEligibility): Promise<boolean> {
    if (this.eligibilities.has(eligibility.naturalKey)) return false;
    this.eligibilities.set(eligibility.naturalKey, eligibility);
    return true;
  }

  async findByUserOrderProduct(
    userId: IdType,
    orderId: IdType,
    productId: IdType,
  ): Promise<ReviewEligibility | null> {
    return (
      this.eligibilities.get(
        `${userId.toString()}:${orderId.toString()}:${productId.toString()}`,
      ) ?? null
    );
  }

  seed(userId = 'user-1', orderId = 'order-1', productId = 'product-1') {
    const eligibility = new ReviewEligibility(
      IdType.create('eligibility-1'),
      IdType.create(userId),
      IdType.create(orderId),
      IdType.create(productId),
      new Date('2026-08-07T12:00:00.000Z'),
    );
    this.eligibilities.set(eligibility.naturalKey, eligibility);
  }
}

const input = {
  productId: 'product-1',
  userId: 'user-1',
  orderId: 'order-1',
  rating: 5,
  comment: 'Excellent game',
  reviewerName: 'Name From Token',
  reviewerEmail: 'email-from-token@example.com',
};

describe('CreateReviewUseCase', () => {
  it('creates a review only for the authenticated delivered purchase', async () => {
    const products = new InMemoryProductRepository(makeProduct());
    const eligibilities = new InMemoryReviewEligibilityRepository();
    eligibilities.seed();

    const result = await new CreateReviewUseCase(
      products,
      eligibilities,
    ).execute(input);

    expect(result.status).toBe(Status.SUCCESS);
    expect(products.product?.reviews).toHaveLength(1);
    expect(products.product?.reviews[0]).toMatchObject({
      reviewerName: 'Name From Token',
      reviewerEmail: 'email-from-token@example.com',
    });
    expect(products.product?.reviews[0].userId?.toString()).toBe('user-1');
    expect(products.product?.reviews[0].orderId?.toString()).toBe('order-1');
    expect(products.savedEvent?.name).toBe('product.updated');
  });

  it('rejects a review without delivered-purchase eligibility', async () => {
    const result = await new CreateReviewUseCase(
      new InMemoryProductRepository(makeProduct()),
      new InMemoryReviewEligibilityRepository(),
    ).execute(input);

    expect(result).toEqual({
      status: Status.ERROR,
      code: ReviewErrorCode.PURCHASE_NOT_DELIVERED,
      message: ReviewErrorCode.PURCHASE_NOT_DELIVERED,
    });
  });

  it('does not accept eligibility belonging to another user', async () => {
    const eligibilities = new InMemoryReviewEligibilityRepository();
    eligibilities.seed('other-user');

    const result = await new CreateReviewUseCase(
      new InMemoryProductRepository(makeProduct()),
      eligibilities,
    ).execute(input);

    expect(result).toMatchObject({
      status: Status.ERROR,
      code: ReviewErrorCode.PURCHASE_NOT_DELIVERED,
    });
  });

  it('blocks a duplicate review for the same purchase', async () => {
    const legacyReview = new ProductReview(
      IdType.create('legacy-review'),
      IdType.create('product-1'),
      4,
      'Legacy review',
      'Legacy User',
      'legacy@example.com',
    );
    const authorizedReview = new ProductReview(
      IdType.create('authorized-review'),
      IdType.create('product-1'),
      5,
      'Already reviewed',
      'Name From Token',
      'email-from-token@example.com',
      new Date(),
      IdType.create('user-1'),
      IdType.create('order-1'),
    );
    const product = new Product({
      ...makeProduct(),
      id: IdType.create('product-1'),
      variants: makeProduct().variants,
      reviews: [legacyReview, authorizedReview],
    });
    const eligibilities = new InMemoryReviewEligibilityRepository();
    eligibilities.seed();

    const result = await new CreateReviewUseCase(
      new InMemoryProductRepository(product),
      eligibilities,
    ).execute(input);

    expect(result).toEqual({
      status: Status.ERROR,
      code: ReviewErrorCode.REVIEW_ALREADY_EXISTS,
      message: ReviewErrorCode.REVIEW_ALREADY_EXISTS,
    });
  });

  it('allows a new authorized review when only a legacy review exists', async () => {
    const product = makeProduct();
    const withLegacyReview = new Product({
      ...product,
      id: product.id,
      variants: product.variants,
      reviews: [
        new ProductReview(
          IdType.create('legacy-review'),
          product.id,
          3,
          'Legacy review',
          'Legacy User',
          'legacy@example.com',
        ),
      ],
    });
    const products = new InMemoryProductRepository(withLegacyReview);
    const eligibilities = new InMemoryReviewEligibilityRepository();
    eligibilities.seed();

    const result = await new CreateReviewUseCase(
      products,
      eligibilities,
    ).execute(input);

    expect(result.status).toBe(Status.SUCCESS);
    expect(products.product?.reviews).toHaveLength(2);
    expect(products.product?.rating).toBe(4);
  });
});
