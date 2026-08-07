import { InventoryReservation } from '../../domain/entities/InventoryReservation';
import { InventoryErrorCode } from '../../domain/errors/InventoryError';
import {
  InventoryCommitOutcome,
  InventoryCommitResult,
  InventoryReservationRepository,
  InventoryVariantChange,
} from '../../domain/repositories/InventoryReservationRepository';

export async function buildVariantChanges(
  repository: InventoryReservationRepository,
  reservation: InventoryReservation,
  transition: 'reserve' | 'confirm' | 'release',
): Promise<InventoryVariantChange[] | InventoryErrorCode> {
  const variantIds = reservation.lines.map((line) => line.variantId.toString());
  const snapshots = await repository.findVariantsByIds(variantIds);
  const byId = new Map(
    snapshots.map((snapshot) => [snapshot.variant.id.toString(), snapshot]),
  );

  const changes: InventoryVariantChange[] = [];
  for (const line of reservation.lines) {
    const snapshot = byId.get(line.variantId.toString());
    if (!snapshot || snapshot.product.isDeleted) {
      return InventoryErrorCode.PRODUCT_UNAVAILABLE;
    }
    if (snapshot.variant.price !== line.expectedUnitPrice) {
      return InventoryErrorCode.CATALOG_CHANGED;
    }

    try {
      const after =
        transition === 'reserve'
          ? snapshot.variant.reserve(line.quantity)
          : transition === 'confirm'
            ? snapshot.variant.confirmReservation(line.quantity)
            : snapshot.variant.releaseReservation(line.quantity);
      changes.push({ before: snapshot.variant, after });
    } catch {
      return transition === 'reserve'
        ? InventoryErrorCode.INSUFFICIENT_STOCK
        : InventoryErrorCode.INVENTORY_CONFLICT;
    }
  }

  return changes;
}

export function mapCommitError(
  result: InventoryCommitResult,
): InventoryErrorCode | null {
  switch (result.outcome) {
    case InventoryCommitOutcome.APPLIED:
    case InventoryCommitOutcome.IDEMPOTENT:
      return null;
    case InventoryCommitOutcome.INSUFFICIENT_STOCK:
      return InventoryErrorCode.INSUFFICIENT_STOCK;
    case InventoryCommitOutcome.PRODUCT_UNAVAILABLE:
      return InventoryErrorCode.PRODUCT_UNAVAILABLE;
    case InventoryCommitOutcome.CATALOG_CHANGED:
      return InventoryErrorCode.CATALOG_CHANGED;
    case InventoryCommitOutcome.CONFLICT:
      return InventoryErrorCode.INVENTORY_CONFLICT;
  }
}
