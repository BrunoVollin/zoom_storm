import { IdType } from '../../shared/IdType';

export enum CouponType {
  PERCENT = 'PERCENT',
  FIXED = 'FIXED',
}

export class CouponValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CouponValidationError';
  }
}

export interface Coupon {
  id: IdType;
  name: string;
  start: Date;
  end: Date;
  version: number;
  deletedAt: Date | null;
  isValid(): boolean;
  isDeleted(): boolean;
  softDelete(deletedAt?: Date): void;
  getName(): string;
  getType(): CouponType;
  getDiscount(total: number): number;
}

function validateVersion(version: number): void {
  if (!Number.isInteger(version) || version < 1) {
    throw new CouponValidationError(
      'Coupon version must be a positive integer',
    );
  }
}

function validateCoupon(
  name: string,
  today: Date,
  start: Date,
  end: Date,
): void {
  if (!name.trim()) {
    throw new CouponValidationError('Coupon name is required');
  }

  if (
    !Number.isFinite(today.getTime()) ||
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime())
  ) {
    throw new CouponValidationError('Coupon dates must be valid');
  }

  if (start >= end) {
    throw new CouponValidationError(
      'Coupon start date must be before end date',
    );
  }
}

export class CouponPercentByTime implements Coupon {
  private deletionDate: Date | null;

  constructor(
    readonly id: IdType,
    readonly name: string,
    readonly today: Date,
    readonly start: Date,
    readonly end: Date,
    readonly percent: number,
    readonly version: number = 1,
    deletedAt: Date | null = null,
  ) {
    validateCoupon(name, today, start, end);
    validateVersion(version);

    if (!Number.isFinite(percent) || percent <= 0 || percent > 1) {
      throw new CouponValidationError(
        'Coupon percent must be greater than 0 and at most 1',
      );
    }

    this.deletionDate = deletedAt;
  }

  get deletedAt(): Date | null {
    return this.deletionDate;
  }

  isDeleted(): boolean {
    return this.deletionDate !== null;
  }

  softDelete(deletedAt: Date = new Date()): void {
    if (!this.deletionDate) this.deletionDate = deletedAt;
  }

  isValid() {
    return !this.isDeleted() && this.today >= this.start && this.today <= this.end;
  }

  getName() {
    return this.name;
  }

  getType(): CouponType {
    return CouponType.PERCENT;
  }

  getDiscount(total: number) {
    if (this.isValid()) {
      return Math.round(total * this.percent);
    }

    return 0;
  }
}

export class CouponFixedAmount implements Coupon {
  private deletionDate: Date | null;

  constructor(
    readonly id: IdType,
    readonly name: string,
    readonly today: Date,
    readonly start: Date,
    readonly end: Date,
    readonly amount: number,
    readonly version: number = 1,
    deletedAt: Date | null = null,
  ) {
    validateCoupon(name, today, start, end);
    validateVersion(version);

    if (!Number.isInteger(amount) || amount <= 0) {
      throw new CouponValidationError(
        'Coupon fixed amount must be a positive integer in cents',
      );
    }

    this.deletionDate = deletedAt;
  }

  get deletedAt(): Date | null {
    return this.deletionDate;
  }

  isDeleted(): boolean {
    return this.deletionDate !== null;
  }

  softDelete(deletedAt: Date = new Date()): void {
    if (!this.deletionDate) this.deletionDate = deletedAt;
  }

  isValid() {
    return !this.isDeleted() && this.today >= this.start && this.today <= this.end;
  }

  getName() {
    return this.name;
  }

  getType(): CouponType {
    return CouponType.FIXED;
  }

  getDiscount(total: number) {
    if (!this.isValid()) return 0;

    return Math.min(this.amount, total);
  }
}
