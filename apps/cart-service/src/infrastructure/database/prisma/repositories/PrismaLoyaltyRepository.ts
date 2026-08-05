import { LoyaltyAccount } from '../../../../domain/entities/loyalty/LoyaltyAccount';
import { IdType } from '../../../../domain/shared/IdType';
import {
  LoyaltyRepository,
  LoyaltyTransactionType,
} from '../../../../domain/repositories/LoyaltyRepository';
import { prisma } from '../prisma-connection';

export class PrismaLoyaltyRepository implements LoyaltyRepository {
  async findByUserId(userId: IdType): Promise<LoyaltyAccount | null> {
    const row = await prisma.loyaltyAccount.findUnique({
      where: { userId: userId.toString() },
    });

    if (!row) return null;

    return new LoyaltyAccount(IdType.create(row.userId), row.balance);
  }

  async save(
    account: LoyaltyAccount,
    transaction: { type: LoyaltyTransactionType; points: number; orderId?: string },
  ): Promise<void> {
    const userId = account.userId.toString();

    await prisma.$transaction([
      prisma.loyaltyAccount.upsert({
        where: { userId },
        create: { userId, balance: account.getBalance() },
        update: { balance: account.getBalance() },
      }),
      prisma.loyaltyTransaction.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          orderId: transaction.orderId,
          type: transaction.type,
          points: transaction.points,
        },
      }),
    ]);
  }
}
