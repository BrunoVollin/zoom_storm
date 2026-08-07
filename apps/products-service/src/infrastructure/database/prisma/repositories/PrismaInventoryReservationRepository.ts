import { Prisma } from '../../../../generated/prisma/client';
import {
  InventoryReservation,
  InventoryReservationStatus,
} from '../../../../domain/entities/InventoryReservation';
import { DomainEventName } from '../../../../domain/events/DomainEvent';
import {
  InventoryCommit,
  InventoryCommitOutcome,
  InventoryCommitResult,
  InventoryReservationRepository,
  InventoryVariantSnapshot,
} from '../../../../domain/repositories/InventoryReservationRepository';
import { IdType } from '../../../../domain/shared/IdType';
import { ProductMapper } from '../../../../application/mappers/ProductMapper';
import { prisma } from '../prisma-connection';
import { PrismaProductRepository } from './PrismaProductRepository';

type TransactionClient = Prisma.TransactionClient;

class InventoryCompareAndSwapError extends Error {}

export class PrismaInventoryReservationRepository
  implements InventoryReservationRepository
{
  async findByOrderId(orderId: string): Promise<InventoryReservation | null> {
    const reservation = await prisma.inventoryReservation.findUnique({
      where: { orderId },
      include: { lines: true },
    });

    return reservation ? this.toDomain(reservation) : null;
  }

  async findVariantsByIds(
    variantIds: string[],
  ): Promise<InventoryVariantSnapshot[]> {
    if (variantIds.length === 0) return [];

    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: { include: { variants: true, reviews: true } },
      },
    });

    return variants.map((row) => {
      const product = PrismaProductRepository.toDomain(row.product);
      const variant = product.variants.find(
        (candidate) => candidate.id.toString() === row.id,
      );

      if (!variant) {
        throw new Error(`Variant ${row.id} was not mapped with its product`);
      }

      return { product, variant };
    });
  }

  async findActiveExpiringAtOrBefore(
    at: Date,
    limit: number,
  ): Promise<InventoryReservation[]> {
    const reservations = await prisma.inventoryReservation.findMany({
      where: {
        status: InventoryReservationStatus.ACTIVE,
        expiresAt: { lte: at },
      },
      include: { lines: true },
      orderBy: { expiresAt: 'asc' },
      take: Math.max(1, limit),
    });

    return reservations.map((reservation) => this.toDomain(reservation));
  }

  async commit(input: InventoryCommit): Promise<InventoryCommitResult> {
    try {
      return await prisma.$transaction(
        async (tx) => this.commitInTransaction(tx, input),
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof InventoryCompareAndSwapError ||
        (error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034')
      ) {
        return { outcome: InventoryCommitOutcome.CONFLICT };
      }
      throw error;
    }
  }

  private async commitInTransaction(
    tx: TransactionClient,
    input: InventoryCommit,
  ): Promise<InventoryCommitResult> {
    const current = await tx.inventoryReservation.findUnique({
      where: { orderId: input.reservation.orderId },
      include: { lines: true },
    });

    if (current) {
      const currentDomain = this.toDomain(current);
      if (!currentDomain.matches(input.reservation.lines)) {
        return { outcome: InventoryCommitOutcome.CONFLICT };
      }

      if (current.status === input.reservation.status) {
        return {
          outcome: InventoryCommitOutcome.IDEMPOTENT,
          reservation: currentDomain,
        };
      }

      if (
        input.expectedReservationStatus === null ||
        current.status !== input.expectedReservationStatus
      ) {
        return { outcome: InventoryCommitOutcome.CONFLICT };
      }
    } else if (input.expectedReservationStatus !== null) {
      return { outcome: InventoryCommitOutcome.CONFLICT };
    }

    const variantIds = input.variants.map((change) =>
      change.before.id.toString(),
    );
    const persistedVariants = await tx.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: { select: { deletedAt: true } } },
    });
    if (
      persistedVariants.length !== variantIds.length ||
      persistedVariants.some((variant) => variant.product.deletedAt !== null)
    ) {
      return { outcome: InventoryCommitOutcome.PRODUCT_UNAVAILABLE };
    }

    const expectedPriceByVariant = new Map(
      input.reservation.lines.map((line) => [
        line.variantId.toString(),
        line.expectedUnitPrice,
      ]),
    );
    if (
      persistedVariants.some(
        (variant) =>
          variant.price !== expectedPriceByVariant.get(variant.id),
      )
    ) {
      return { outcome: InventoryCommitOutcome.CATALOG_CHANGED };
    }

    for (const change of input.variants) {
      const result = await tx.productVariant.updateMany({
        where: {
          id: change.before.id.toString(),
          stock: change.before.stock,
          reservedStock: change.before.reservedStock,
          price: expectedPriceByVariant.get(change.before.id.toString()),
        },
        data: {
          stock: change.after.stock,
          reservedStock: change.after.reservedStock,
        },
      });

      if (result.count !== 1) throw new InventoryCompareAndSwapError();
    }

    if (current) {
      await tx.inventoryReservation.update({
        where: { id: current.id },
        data: {
          status: input.reservation.status,
          updatedAt: input.reservation.updatedAt,
        },
      });
    } else {
      await tx.inventoryReservation.create({
        data: {
          id: input.reservation.id.toString(),
          orderId: input.reservation.orderId,
          status: input.reservation.status,
          createdAt: input.reservation.createdAt,
          expiresAt: input.reservation.expiresAt,
          updatedAt: input.reservation.updatedAt,
          lines: {
            create: input.reservation.lines.map((line) => ({
              variantId: line.variantId.toString(),
              quantity: line.quantity,
              expectedUnitPrice: line.expectedUnitPrice,
            })),
          },
        },
      });
    }

    await this.enqueueChangedProducts(tx, variantIds, input.reservation.updatedAt);

    return {
      outcome: InventoryCommitOutcome.APPLIED,
      reservation: input.reservation,
    };
  }

  private async enqueueChangedProducts(
    tx: TransactionClient,
    variantIds: string[],
    occurredAt: Date,
  ): Promise<void> {
    const products = await tx.product.findMany({
      where: { variants: { some: { id: { in: variantIds } } } },
      include: { variants: true, reviews: true },
    });

    for (const row of products) {
      const product = PrismaProductRepository.toDomain(row);
      await tx.outboxEvent.create({
        data: {
          eventType: DomainEventName.PRODUCT_UPDATED,
          payload: ProductMapper.toPrimitives(
            product,
          ) as unknown as Prisma.InputJsonValue,
          occurredAt,
        },
      });
    }
  }

  private toDomain(reservation: {
    id: string;
    orderId: string;
    status: string;
    createdAt: Date;
    expiresAt: Date;
    updatedAt: Date;
    lines: Array<{
      variantId: string;
      quantity: number;
      expectedUnitPrice: number;
    }>;
  }): InventoryReservation {
    if (
      !Object.values(InventoryReservationStatus).includes(
        reservation.status as InventoryReservationStatus,
      )
    ) {
      throw new Error(`Unknown inventory reservation status: ${reservation.status}`);
    }

    return new InventoryReservation({
      id: IdType.create(reservation.id),
      orderId: reservation.orderId,
      status: reservation.status as InventoryReservationStatus,
      createdAt: reservation.createdAt,
      expiresAt: reservation.expiresAt,
      updatedAt: reservation.updatedAt,
      lines: reservation.lines.map((line) => ({
        variantId: IdType.create(line.variantId),
        quantity: line.quantity,
        expectedUnitPrice: line.expectedUnitPrice,
      })),
    });
  }
}
