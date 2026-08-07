import { ReviewEligibility } from '../../../../domain/entities/ReviewEligibility';
import { ReviewEligibilityRepository } from '../../../../domain/repositories/ReviewEligibilityRepository';
import { IdType } from '../../../../domain/shared/IdType';
import { prisma } from '../prisma-connection';

type UniqueConstraintError = Error & {
  code?: string;
  meta?: { target?: unknown };
};

export class PrismaReviewEligibilityRepository implements ReviewEligibilityRepository {
  async saveIfAbsent(eligibility: ReviewEligibility): Promise<boolean> {
    try {
      await prisma.reviewEligibility.create({
        data: {
          id: eligibility.id.toString(),
          userId: eligibility.userId.toString(),
          orderId: eligibility.orderId.toString(),
          productId: eligibility.productId.toString(),
          deliveredAt: eligibility.deliveredAt,
          createdAt: eligibility.createdAt,
        },
      });

      return true;
    } catch (error) {
      if (this.isNaturalKeyConflict(error)) return false;
      throw error;
    }
  }

  async findByUserOrderProduct(
    userId: IdType,
    orderId: IdType,
    productId: IdType,
  ): Promise<ReviewEligibility | null> {
    const record = await prisma.reviewEligibility.findUnique({
      where: {
        userId_orderId_productId: {
          userId: userId.toString(),
          orderId: orderId.toString(),
          productId: productId.toString(),
        },
      },
    });

    return record
      ? new ReviewEligibility(
          IdType.create(record.id),
          IdType.create(record.userId),
          IdType.create(record.orderId),
          IdType.create(record.productId),
          record.deliveredAt,
          record.createdAt,
        )
      : null;
  }

  private isNaturalKeyConflict(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const prismaError = error as UniqueConstraintError;
    if (prismaError.code !== 'P2002') return false;

    const target = prismaError.meta?.target;
    return (
      (Array.isArray(target) &&
        ['userId', 'orderId', 'productId'].every((field) =>
          target.includes(field),
        )) ||
      (typeof target === 'string' &&
        target.includes('userId_orderId_productId'))
    );
  }
}
