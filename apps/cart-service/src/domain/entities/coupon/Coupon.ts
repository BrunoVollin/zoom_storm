import { IdType } from '../../shared/IdType';

export interface Coupon {
  id: IdType;
  name: string;
  isValid(): boolean;
  getName(): string;
  getDiscount(total: number): number;
}

export class CouponPercentByTime implements Coupon {
  /**
   * `today` is a snapshot passed in by the caller rather than read from a
   * clock internally, so callers (repositories) must pass the current time
   * on every read for validity to be re-evaluated on each use, instead of
   * relying on a value cached from when the coupon was first applied.
   */
  constructor(
    readonly id: IdType,
    readonly name: string,
    readonly today: Date,
    readonly start: Date,
    readonly end: Date,
    readonly percent: number,
  ) {}

  isValid() {
    return this.today >= this.start && this.today <= this.end;
  }

  getName() {
    return this.name;
  }

  getDiscount(total: number) {
    if (this.isValid()) {
      return total * this.percent;
    }

    return 0;
  }
}
