import { InventoryReservation } from '../../src/domain/entities/InventoryReservation';
import { Product } from '../../src/domain/entities/Product';
import {
  InventoryCommit,
  InventoryCommitOutcome,
  InventoryCommitResult,
  InventoryReservationRepository,
  InventoryVariantSnapshot,
} from '../../src/domain/repositories/InventoryReservationRepository';

export class InMemoryInventoryReservationRepository implements InventoryReservationRepository {
  private readonly products = new Map<string, Product>();
  private readonly reservations = new Map<string, InventoryReservation>();

  seed(product: Product): void {
    this.products.set(product.id.toString(), product);
  }

  getVariant(variantId: string) {
    return [...this.products.values()]
      .flatMap((product) => product.variants)
      .find((variant) => variant.id.toString() === variantId);
  }

  async findByOrderId(orderId: string): Promise<InventoryReservation | null> {
    return this.reservations.get(orderId) ?? null;
  }

  async findVariantsByIds(
    variantIds: string[],
  ): Promise<InventoryVariantSnapshot[]> {
    const wanted = new Set(variantIds);
    return [...this.products.values()].flatMap((product) =>
      product.variants
        .filter((variant) => wanted.has(variant.id.toString()))
        .map((variant) => ({ product, variant })),
    );
  }

  async findActiveExpiringAtOrBefore(
    at: Date,
    limit: number,
  ): Promise<InventoryReservation[]> {
    return [...this.reservations.values()]
      .filter(
        (reservation) =>
          reservation.status === 'ACTIVE' &&
          reservation.expiresAt.getTime() <= at.getTime(),
      )
      .slice(0, limit);
  }

  async commit(input: InventoryCommit): Promise<InventoryCommitResult> {
    const current = this.reservations.get(input.reservation.orderId);
    if (input.expectedReservationStatus === null && current) {
      return current.matches(input.reservation.lines)
        ? { outcome: InventoryCommitOutcome.IDEMPOTENT, reservation: current }
        : { outcome: InventoryCommitOutcome.CONFLICT, reservation: current };
    }
    if (
      input.expectedReservationStatus !== null &&
      current?.status !== input.expectedReservationStatus
    ) {
      return current?.status === input.reservation.status
        ? { outcome: InventoryCommitOutcome.IDEMPOTENT, reservation: current }
        : { outcome: InventoryCommitOutcome.CONFLICT, reservation: current };
    }

    for (const change of input.variants) {
      const snapshot = (
        await this.findVariantsByIds([change.before.id.toString()])
      )[0];
      if (!snapshot || snapshot.product.isDeleted) {
        return { outcome: InventoryCommitOutcome.PRODUCT_UNAVAILABLE };
      }
      if (
        snapshot.variant.stock !== change.before.stock ||
        snapshot.variant.reservedStock !== change.before.reservedStock
      ) {
        return { outcome: InventoryCommitOutcome.CONFLICT };
      }
    }

    for (const change of input.variants) {
      const product = [...this.products.values()].find((candidate) =>
        candidate.variants.some((variant) =>
          variant.id.equals(change.before.id),
        ),
      )!;
      this.products.set(
        product.id.toString(),
        new Product({
          ...product,
          id: product.id,
          variants: product.variants.map((variant) =>
            variant.id.equals(change.before.id) ? change.after : variant,
          ),
          reviews: product.reviews,
        }),
      );
    }
    this.reservations.set(input.reservation.orderId, input.reservation);
    return {
      outcome: InventoryCommitOutcome.APPLIED,
      reservation: input.reservation,
    };
  }
}
