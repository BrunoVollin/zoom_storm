import { ReviewEligibility } from '../../src/domain/entities/ReviewEligibility';
import { IdType } from '../../src/domain/shared/IdType';

const create = jest.fn();
const findUnique = jest.fn();

jest.mock('../../src/infrastructure/database/prisma/prisma-connection', () => ({
  prisma: {
    reviewEligibility: { create, findUnique },
  },
}));

import { PrismaReviewEligibilityRepository } from '../../src/infrastructure/database/prisma/repositories/PrismaReviewEligibilityRepository';

function eligibility() {
  return new ReviewEligibility(
    IdType.create('eligibility-1'),
    IdType.create('user-1'),
    IdType.create('order-1'),
    IdType.create('product-1'),
    new Date('2026-08-07T12:00:00.000Z'),
    new Date('2026-08-07T12:01:00.000Z'),
  );
}

function uniqueError(target: string[]): Error & {
  code: string;
  meta: { target: string[] };
} {
  return Object.assign(new Error('Unique constraint failed'), {
    code: 'P2002',
    meta: { target },
  });
}

describe('PrismaReviewEligibilityRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates the eligibility using its natural purchase key', async () => {
    create.mockResolvedValue(undefined);

    await expect(
      new PrismaReviewEligibilityRepository().saveIfAbsent(eligibility()),
    ).resolves.toBe(true);

    expect(create).toHaveBeenCalledWith({
      data: {
        id: 'eligibility-1',
        userId: 'user-1',
        orderId: 'order-1',
        productId: 'product-1',
        deliveredAt: new Date('2026-08-07T12:00:00.000Z'),
        createdAt: new Date('2026-08-07T12:01:00.000Z'),
      },
    });
  });

  it('turns a natural-key conflict into an idempotent result', async () => {
    create.mockRejectedValue(uniqueError(['userId', 'orderId', 'productId']));

    await expect(
      new PrismaReviewEligibilityRepository().saveIfAbsent(eligibility()),
    ).resolves.toBe(false);
  });

  it('does not swallow unrelated persistence failures', async () => {
    const error = new Error('database unavailable');
    create.mockRejectedValue(error);

    await expect(
      new PrismaReviewEligibilityRepository().saveIfAbsent(eligibility()),
    ).rejects.toBe(error);
  });

  it('does not treat an id collision as a natural-key replay', async () => {
    const error = uniqueError(['id']);
    create.mockRejectedValue(error);

    await expect(
      new PrismaReviewEligibilityRepository().saveIfAbsent(eligibility()),
    ).rejects.toBe(error);
  });

  it('loads an eligibility by user, order and product', async () => {
    findUnique.mockResolvedValue({
      id: 'eligibility-1',
      userId: 'user-1',
      orderId: 'order-1',
      productId: 'product-1',
      deliveredAt: new Date('2026-08-07T12:00:00.000Z'),
      createdAt: new Date('2026-08-07T12:01:00.000Z'),
    });

    const result =
      await new PrismaReviewEligibilityRepository().findByUserOrderProduct(
        IdType.create('user-1'),
        IdType.create('order-1'),
        IdType.create('product-1'),
      );

    expect(findUnique).toHaveBeenCalledWith({
      where: {
        userId_orderId_productId: {
          userId: 'user-1',
          orderId: 'order-1',
          productId: 'product-1',
        },
      },
    });
    expect(result?.naturalKey).toBe('user-1:order-1:product-1');
  });
});
