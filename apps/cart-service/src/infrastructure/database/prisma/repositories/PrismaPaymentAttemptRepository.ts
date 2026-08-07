import { PaymentAttempt, PaymentAttemptStatus } from '../../../../domain/entities/payment/PaymentAttempt';
import {
  PaymentMethod,
  PaymentMethodType,
} from '../../../../domain/entities/payment/PaymentMethod';
import { PaymentAttemptRepository, CompletePaymentInput } from '../../../../domain/repositories/PaymentAttemptRepository';
import { IdType } from '../../../../domain/shared/IdType';
import { Prisma } from '../../../../generated/prisma/client';
import { prisma } from '../prisma-connection';

interface PaymentAttemptRow {
  id: string;
  orderId: string;
  userId: string;
  idempotencyKey: string;
  methodType: string;
  savedCardId: string | null;
  brand: string;
  lastFour: string;
  holderName: string;
  expiry: string;
  saveCard: boolean;
  installments: number;
  status: string;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PrismaPaymentAttemptRepository implements PaymentAttemptRepository {
  async findByIdempotencyKey(
    userId: IdType,
    key: string,
  ): Promise<PaymentAttempt | null> {
    const row = await prisma.paymentAttempt.findUnique({
      where: {
        userId_idempotencyKey: {
          userId: userId.toString(),
          idempotencyKey: key,
        },
      },
    });

    return row ? this.toDomain(row) : null;
  }

  async save(attempt: PaymentAttempt): Promise<void> {
    const data = this.toPersistence(attempt);

    await prisma.paymentAttempt.upsert({
      where: { id: attempt.id.toString() },
      create: data,
      update: {
        status: data.status,
        failureReason: data.failureReason,
        updatedAt: data.updatedAt,
      },
    });
  }

  async complete(input: CompletePaymentInput): Promise<void> {
    const attemptData = this.toPersistence(input.attempt);

    await prisma.$transaction(async (tx) => {
      const existing = await tx.paymentAttempt.findUnique({
        where: {
          userId_idempotencyKey: {
            userId: attemptData.userId,
            idempotencyKey: attemptData.idempotencyKey,
          },
        },
      });

      if (!existing) {
        await tx.paymentAttempt.create({ data: attemptData });
      } else {
        const claimed = await tx.paymentAttempt.updateMany({
          where: { id: existing.id, status: PaymentAttemptStatus.PENDING },
          data: {
            status: attemptData.status,
            failureReason: attemptData.failureReason,
            updatedAt: attemptData.updatedAt,
          },
        });

        if (claimed.count !== 1) {
          throw new Error('Payment attempt has already been completed');
        }
      }

      const paidOrder = await tx.order.updateMany({
        where: { id: input.order.id.toString(), status: 'CREATED' },
        data: {
          status: input.order.getStatus(),
          originCity: input.order.getOriginCity(),
          expiresAt: input.order.expiresAt,
        },
      });

      if (paidOrder.count !== 1) {
        throw new Error('Order is no longer awaiting payment');
      }

      await tx.outboxEvent.create({
        data: {
          eventType: input.event.name,
          payload: input.event.payload as Prisma.InputJsonValue,
          occurredAt: input.event.occurredAt,
        },
      });

      if (input.loyalty) {
        const userId = input.loyalty.account.userId.toString();
        await tx.loyaltyAccount.upsert({
          where: { userId },
          create: { userId, balance: input.loyalty.account.getBalance() },
          update: { balance: input.loyalty.account.getBalance() },
        });
        await tx.loyaltyTransaction.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            orderId: input.order.id.toString(),
            type: 'EARN',
            points: input.loyalty.points,
          },
        });
      }

      if (input.savedCard) {
        const card = input.savedCard;
        const id = card.id.toString();
        const userId = card.userId.toString();

        if (card.isDefault()) {
          await tx.savedCard.updateMany({
            where: { userId, isDefault: true, id: { not: id } },
            data: { isDefault: false },
          });
        }

        await tx.savedCard.upsert({
          where: { id },
          create: {
            id,
            userId,
            brand: card.getBrand(),
            lastFour: card.getLastFour(),
            holderName: card.getHolderName(),
            expiry: card.getExpiry(),
            isDefault: card.isDefault(),
            createdAt: card.createdAt,
            updatedAt: card.getUpdatedAt(),
          },
          update: {
            brand: card.getBrand(),
            holderName: card.getHolderName(),
            expiry: card.getExpiry(),
            isDefault: card.isDefault(),
            updatedAt: card.getUpdatedAt(),
          },
        });
      }
    });
  }

  private toPersistence(attempt: PaymentAttempt) {
    return {
      id: attempt.id.toString(),
      orderId: attempt.orderId.toString(),
      userId: attempt.userId.toString(),
      idempotencyKey: attempt.idempotencyKey,
      methodType: attempt.method.type,
      savedCardId:
        attempt.method.type === PaymentMethodType.SAVED_CARD
          ? attempt.method.savedCardId
          : null,
      brand: attempt.method.brand,
      lastFour: attempt.method.lastFour,
      holderName: attempt.method.holderName,
      expiry: attempt.method.expiry,
      saveCard:
        attempt.method.type === PaymentMethodType.NEW_CARD
          ? attempt.method.saveCard
          : false,
      installments: attempt.installments,
      status: attempt.getStatus(),
      failureReason: attempt.getFailureReason(),
      createdAt: attempt.createdAt,
      updatedAt: attempt.getUpdatedAt(),
    };
  }

  private toDomain(row: PaymentAttemptRow): PaymentAttempt {
    const method: PaymentMethod =
      row.methodType === PaymentMethodType.SAVED_CARD
        ? {
            type: PaymentMethodType.SAVED_CARD,
            savedCardId: row.savedCardId ?? '',
            brand: row.brand,
            lastFour: row.lastFour,
            holderName: row.holderName,
            expiry: row.expiry,
          }
        : {
            type: PaymentMethodType.NEW_CARD,
            brand: row.brand,
            lastFour: row.lastFour,
            holderName: row.holderName,
            expiry: row.expiry,
            saveCard: row.saveCard,
          };

    return new PaymentAttempt(
      IdType.create(row.id),
      IdType.create(row.orderId),
      IdType.create(row.userId),
      row.idempotencyKey,
      method,
      row.installments,
      row.status as PaymentAttemptStatus,
      row.createdAt,
      row.updatedAt,
      row.failureReason,
    );
  }
}
