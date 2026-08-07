import { IdType } from '../../shared/IdType';

export enum LoyaltyReservationStatus {
  ACTIVE = 'ACTIVE',
  CONSUMED = 'CONSUMED',
  RELEASED = 'RELEASED',
  EXPIRED = 'EXPIRED',
}

export class LoyaltyReservation {
  constructor(
    readonly orderId: IdType,
    readonly userId: IdType,
    readonly points: number,
    private status: LoyaltyReservationStatus,
    readonly expiresAt: Date,
    readonly createdAt: Date = new Date(),
    private updatedAt: Date = createdAt,
  ) {
    if (!Number.isInteger(points) || points <= 0) {
      throw new Error('Reserved loyalty points must be a positive integer');
    }

    if (!Number.isFinite(expiresAt.getTime())) {
      throw new Error('Loyalty reservation expiration must be valid');
    }

    if (expiresAt.getTime() <= createdAt.getTime()) {
      throw new Error('Loyalty reservation must expire after it is created');
    }
  }

  static create(
    orderId: IdType,
    userId: IdType,
    points: number,
    expiresAt: Date,
    createdAt: Date = new Date(),
  ): LoyaltyReservation {
    return new LoyaltyReservation(
      orderId,
      userId,
      points,
      LoyaltyReservationStatus.ACTIVE,
      expiresAt,
      createdAt,
    );
  }

  getStatus(): LoyaltyReservationStatus {
    return this.status;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  matches(userId: IdType, points: number): boolean {
    return this.userId.equals(userId) && this.points === points;
  }

  consume(at: Date = new Date()): void {
    if (this.status === LoyaltyReservationStatus.CONSUMED) return;
    this.ensureActive('consume');
    if (at.getTime() >= this.expiresAt.getTime()) {
      throw new Error('Cannot consume an expired loyalty reservation');
    }
    this.status = LoyaltyReservationStatus.CONSUMED;
    this.updatedAt = at;
  }

  release(at: Date = new Date()): void {
    if (this.status === LoyaltyReservationStatus.RELEASED) return;
    this.ensureActive('release');
    this.status = LoyaltyReservationStatus.RELEASED;
    this.updatedAt = at;
  }

  expire(at: Date = new Date()): void {
    if (this.status === LoyaltyReservationStatus.EXPIRED) return;
    this.ensureActive('expire');
    if (at.getTime() < this.expiresAt.getTime()) {
      throw new Error('Cannot expire an active loyalty reservation early');
    }
    this.status = LoyaltyReservationStatus.EXPIRED;
    this.updatedAt = at;
  }

  private ensureActive(operation: string): void {
    if (this.status !== LoyaltyReservationStatus.ACTIVE) {
      throw new Error(
        `Cannot ${operation} loyalty reservation from status ${this.status}`,
      );
    }
  }
}
