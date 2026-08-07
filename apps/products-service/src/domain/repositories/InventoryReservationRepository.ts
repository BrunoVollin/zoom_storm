import { InventoryReservation } from '../entities/InventoryReservation';
import { Product } from '../entities/Product';
import { ProductVariant } from '../entities/ProductVariant';

export interface InventoryVariantSnapshot {
  product: Product;
  variant: ProductVariant;
}

export interface InventoryVariantChange {
  before: ProductVariant;
  after: ProductVariant;
}

export interface InventoryCommit {
  reservation: InventoryReservation;
  expectedReservationStatus: InventoryReservation['status'] | null;
  variants: InventoryVariantChange[];
}

export enum InventoryCommitOutcome {
  APPLIED = 'APPLIED',
  IDEMPOTENT = 'IDEMPOTENT',
  CONFLICT = 'CONFLICT',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  PRODUCT_UNAVAILABLE = 'PRODUCT_UNAVAILABLE',
  CATALOG_CHANGED = 'CATALOG_CHANGED',
}

export interface InventoryCommitResult {
  outcome: InventoryCommitOutcome;
  reservation?: InventoryReservation;
}

/**
 * Persistence port for an atomic reservation + variant inventory commit.
 * Implementations must compare every `before` inventory value and the expected
 * reservation status in one transaction. Repeated equivalent commits return
 * IDEMPOTENT; an order id with different lines returns CONFLICT.
 */
export interface InventoryReservationRepository {
  findByOrderId(orderId: string): Promise<InventoryReservation | null>;
  findVariantsByIds(variantIds: string[]): Promise<InventoryVariantSnapshot[]>;
  findActiveExpiringAtOrBefore(
    at: Date,
    limit: number,
  ): Promise<InventoryReservation[]>;
  commit(input: InventoryCommit): Promise<InventoryCommitResult>;
}
