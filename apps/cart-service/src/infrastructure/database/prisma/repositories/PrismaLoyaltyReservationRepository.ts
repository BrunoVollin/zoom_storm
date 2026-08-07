import { LoyaltyAccount } from '../../../../domain/entities/loyalty/LoyaltyAccount';
import {
  LoyaltyReservation,
  LoyaltyReservationStatus,
} from '../../../../domain/entities/loyalty/LoyaltyReservation';
import {
  LoyaltyReservationRepository,
  ReserveLoyaltyResult,
} from '../../../../domain/repositories/LoyaltyReservationRepository';
import { IdType } from '../../../../domain/shared/IdType';
import { prisma } from '../prisma-connection';

interface LoyaltyReservationRow {
  orderId: string;
  userId: string;
  points: number;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

function reservationFromRow(row: LoyaltyReservationRow): LoyaltyReservation {
  return new LoyaltyReservation(
    IdType.create(row.orderId),
    IdType.create(row.userId),
    row.points,
    row.status as LoyaltyReservationStatus,
    row.expiresAt,
    row.createdAt,
    row.updatedAt,
  );
}

export class PrismaLoyaltyReservationRepository
  implements LoyaltyReservationRepository
{
  async findByOrderId(orderId: IdType): Promise<LoyaltyReservation | null> {
    const row = await prisma.loyaltyReservation.findUnique({
      where: { orderId: orderId.toString() },
    });

    return row ? reservationFromRow(row) : null;
  }

  async reserve(
    reservation: LoyaltyReservation,
    currentBalance: number,
  ): Promise<ReserveLoyaltyResult> {
    return prisma.$transaction(async (tx) => {
      const orderId = reservation.orderId.toString();
      const userId = reservation.userId.toString();

      const existing = await tx.loyaltyReservation.findUnique({
        where: { orderId },
      });

      if (existing) {
        if (existing.userId === userId && existing.points === reservation.points) {
          return { outcome: 'RESERVED', reservation: reservationFromRow(existing) };
        }
        return { outcome: 'IDEMPOTENCY_CONFLICT' };
      }

      const activeReservations = await tx.loyaltyReservation.aggregate({
        where: { userId, status: 'ACTIVE' },
        _sum: { points: true },
      });
      const alreadyReserved = activeReservations._sum.points ?? 0;

      if (alreadyReserved + reservation.points > currentBalance) {
        return { outcome: 'INSUFFICIENT_BALANCE' };
      }

      const created = await tx.loyaltyReservation.create({
        data: {
          orderId,
          userId,
          points: reservation.points,
          status: 'ACTIVE',
          expiresAt: reservation.expiresAt,
          createdAt: reservation.createdAt,
        },
      });

      return { outcome: 'RESERVED', reservation: reservationFromRow(created) };
    });
  }

  async save(reservation: LoyaltyReservation): Promise<void> {
    const orderId = reservation.orderId.toString();

    await prisma.loyaltyReservation.upsert({
      where: { orderId },
      create: {
        orderId,
        userId: reservation.userId.toString(),
        points: reservation.points,
        status: reservation.getStatus(),
        expiresAt: reservation.expiresAt,
        createdAt: reservation.createdAt,
        updatedAt: reservation.getUpdatedAt(),
      },
      update: {
        status: reservation.getStatus(),
        updatedAt: reservation.getUpdatedAt(),
      },
    });
  }

  async consume(
    reservation: LoyaltyReservation,
    account: LoyaltyAccount,
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.loyaltyReservation.updateMany({
        where: { orderId: reservation.orderId.toString(), status: 'ACTIVE' },
        data: {
          status: 'CONSUMED',
          updatedAt: reservation.getUpdatedAt(),
        },
      });

      if (claimed.count !== 1) {
        throw new Error(
          'Loyalty reservation has already been consumed, released or expired',
        );
      }

      const userId = account.userId.toString();
      await tx.loyaltyAccount.upsert({
        where: { userId },
        create: { userId, balance: account.getBalance() },
        update: { balance: account.getBalance() },
      });
      await tx.loyaltyTransaction.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          orderId: reservation.orderId.toString(),
          type: 'REDEEM',
          points: reservation.points,
        },
      });
    });
  }

  async findActiveExpired(referenceDate: Date): Promise<LoyaltyReservation[]> {
    const rows = await prisma.loyaltyReservation.findMany({
      where: { status: 'ACTIVE', expiresAt: { lte: referenceDate } },
    });

    return rows.map((row) => reservationFromRow(row));
  }
}
