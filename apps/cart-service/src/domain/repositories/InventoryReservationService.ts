export type InventoryReservationErrorCode =
  | 'PRODUCT_UNAVAILABLE'
  | 'INSUFFICIENT_STOCK'
  | 'CATALOG_CHANGED'
  | 'IDEMPOTENCY_CONFLICT'
  | 'RESERVATION_NOT_FOUND'
  | 'RESERVATION_EXPIRED'
  | 'RESERVATION_NOT_ACTIVE'
  | 'INVENTORY_CONFLICT';

export interface InventoryReservationLineInput {
  variantId: string;
  quantity: number;
  expectedUnitPrice: number;
}

export interface InventoryReservationSnapshot {
  id: string;
  orderId: string;
  status: 'ACTIVE' | 'CONFIRMED' | 'RELEASED' | 'EXPIRED';
  lines: InventoryReservationLineInput[];
  createdAt: Date;
  expiresAt: Date;
  updatedAt: Date;
}

export type InventoryReservationResult =
  | { ok: true; reservation: InventoryReservationSnapshot }
  | {
      ok: false;
      code: InventoryReservationErrorCode;
      message: string;
    };

/** Port owned by the cart application for the products-service inventory API. */
export interface InventoryReservationService {
  reserve(input: {
    orderId: string;
    lines: InventoryReservationLineInput[];
  }): Promise<InventoryReservationResult>;
  confirm(orderId: string): Promise<InventoryReservationResult>;
  release(orderId: string): Promise<InventoryReservationResult>;
}
