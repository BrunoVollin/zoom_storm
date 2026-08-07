import { Status } from '../../src/application/contracts/UseCase';
import { RegisterDeliveredOrderReviewEligibilitiesUseCase } from '../../src/application/usecases/RegisterDeliveredOrderReviewEligibilitiesUseCase';
import { ReviewEligibility } from '../../src/domain/entities/ReviewEligibility';
import { ReviewEligibilityRepository } from '../../src/domain/repositories/ReviewEligibilityRepository';
import { IdType } from '../../src/domain/shared/IdType';

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
}

describe('RegisterDeliveredOrderReviewEligibilitiesUseCase', () => {
  const deliveredAt = new Date('2026-08-07T12:00:00.000Z');
  let repository: InMemoryReviewEligibilityRepository;
  let useCase: RegisterDeliveredOrderReviewEligibilitiesUseCase;

  beforeEach(() => {
    repository = new InMemoryReviewEligibilityRepository();
    useCase = new RegisterDeliveredOrderReviewEligibilitiesUseCase(repository);
  });

  it('registers one eligibility per distinct product in a delivered order', async () => {
    const result = await useCase.execute({
      orderId: 'order-1',
      userId: 'user-1',
      status: 'DELIVERED',
      deliveredAt,
      items: [
        { productId: 'product-1' },
        { productId: 'product-1' },
        { productId: 'product-2' },
      ],
    });

    expect(result).toEqual({
      status: Status.SUCCESS,
      createdCount: 2,
      eligibleProductCount: 2,
    });
    expect(repository.eligibilities.size).toBe(2);
  });

  it('is idempotent when the delivered event is replayed', async () => {
    const input = {
      orderId: 'order-1',
      userId: 'user-1',
      status: 'DELIVERED' as const,
      deliveredAt,
      items: [{ productId: 'product-1' }],
    };

    await useCase.execute(input);
    const replay = await useCase.execute(input);

    expect(replay).toEqual({
      status: Status.SUCCESS,
      createdCount: 0,
      eligibleProductCount: 1,
    });
    expect(repository.eligibilities.size).toBe(1);
  });

  it('ignores order events before delivery', async () => {
    const result = await useCase.execute({
      orderId: 'order-1',
      userId: 'user-1',
      status: 'PAID',
      deliveredAt,
      items: [{ productId: 'product-1' }],
    });

    expect(result).toEqual({
      status: Status.SUCCESS,
      createdCount: 0,
      eligibleProductCount: 0,
    });
    expect(repository.eligibilities.size).toBe(0);
  });
});
