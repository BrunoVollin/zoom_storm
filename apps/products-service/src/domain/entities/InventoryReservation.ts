import { InventoryError, InventoryErrorCode } from '../errors/InventoryError';
import { IdType } from '../shared/IdType';

export const INVENTORY_RESERVATION_TTL_MS = 15 * 60 * 1000;

export enum InventoryReservationStatus {
  ACTIVE = 'ACTIVE',
  CONFIRMED = 'CONFIRMED',
  RELEASED = 'RELEASED',
  EXPIRED = 'EXPIRED',
}

export interface InventoryReservationLine {
  variantId: IdType;
  quantity: number;
  expectedUnitPrice: number;
}

export interface InventoryReservationProps {
  id: IdType;
  orderId: string;
  lines: InventoryReservationLine[];
  status: InventoryReservationStatus;
  createdAt: Date;
  expiresAt: Date;
  updatedAt: Date;
}

export class InventoryReservation {
  readonly id: IdType;
  readonly orderId: string;
  readonly lines: InventoryReservationLine[];
  readonly status: InventoryReservationStatus;
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly updatedAt: Date;

  constructor(props: InventoryReservationProps) {
    if (!props.orderId.trim()) {
      throw new Error('Order id is required');
    }
    if (props.lines.length === 0) {
      throw new Error('Reservation must have at least one line');
    }

    const variantIds = new Set<string>();
    for (const line of props.lines) {
      const variantId = line.variantId.toString();
      if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
        throw new Error('Reservation quantity must be a positive integer');
      }
      if (!Number.isFinite(line.expectedUnitPrice) || line.expectedUnitPrice < 0) {
        throw new Error('Expected unit price must be a non-negative number');
      }
      if (variantIds.has(variantId)) {
        throw new Error('Reservation cannot contain duplicate variants');
      }
      variantIds.add(variantId);
    }

    if (props.expiresAt.getTime() <= props.createdAt.getTime()) {
      throw new Error('Reservation expiration must be after creation');
    }

    this.id = props.id;
    this.orderId = props.orderId;
    this.lines = props.lines.map((line) => ({ ...line }));
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.expiresAt = props.expiresAt;
    this.updatedAt = props.updatedAt;
  }

  static create(
    orderId: string,
    lines: InventoryReservationLine[],
    now: Date = new Date(),
    ttlMs: number = INVENTORY_RESERVATION_TTL_MS,
  ): InventoryReservation {
    if (!Number.isInteger(ttlMs) || ttlMs <= 0) {
      throw new Error('Reservation TTL must be positive');
    }

    return new InventoryReservation({
      id: IdType.create(),
      orderId,
      lines,
      status: InventoryReservationStatus.ACTIVE,
      createdAt: now,
      expiresAt: new Date(now.getTime() + ttlMs),
      updatedAt: now,
    });
  }

  matches(lines: InventoryReservationLine[]): boolean {
    if (lines.length !== this.lines.length) return false;

    const expected = new Map(
      this.lines.map((line) => [
        line.variantId.toString(),
        `${line.quantity}:${line.expectedUnitPrice}`,
      ]),
    );
    return lines.every(
      (line) =>
        expected.get(line.variantId.toString()) ===
        `${line.quantity}:${line.expectedUnitPrice}`,
    );
  }

  isExpired(at: Date): boolean {
    return at.getTime() >= this.expiresAt.getTime();
  }

  confirm(at: Date = new Date()): InventoryReservation {
    if (this.status === InventoryReservationStatus.CONFIRMED) return this;
    if (this.status !== InventoryReservationStatus.ACTIVE) {
      throw new InventoryError(InventoryErrorCode.RESERVATION_NOT_ACTIVE);
    }
    if (this.isExpired(at)) {
      throw new InventoryError(InventoryErrorCode.RESERVATION_EXPIRED);
    }
    return this.withStatus(InventoryReservationStatus.CONFIRMED, at);
  }

  release(at: Date = new Date()): InventoryReservation {
    if (
      this.status === InventoryReservationStatus.RELEASED ||
      this.status === InventoryReservationStatus.EXPIRED
    ) {
      return this;
    }
    if (this.status !== InventoryReservationStatus.ACTIVE) {
      throw new InventoryError(InventoryErrorCode.RESERVATION_NOT_ACTIVE);
    }
    return this.withStatus(InventoryReservationStatus.RELEASED, at);
  }

  expire(at: Date = new Date()): InventoryReservation {
    if (this.status === InventoryReservationStatus.EXPIRED) return this;
    if (this.status !== InventoryReservationStatus.ACTIVE) {
      throw new InventoryError(InventoryErrorCode.RESERVATION_NOT_ACTIVE);
    }
    if (!this.isExpired(at)) {
      throw new InventoryError(InventoryErrorCode.RESERVATION_NOT_ACTIVE);
    }
    return this.withStatus(InventoryReservationStatus.EXPIRED, at);
  }

  private withStatus(
    status: InventoryReservationStatus,
    updatedAt: Date,
  ): InventoryReservation {
    return new InventoryReservation({ ...this, status, updatedAt });
  }
}
