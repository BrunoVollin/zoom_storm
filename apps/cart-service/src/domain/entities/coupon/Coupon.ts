import { IdType } from '../../shared/IdType';

export interface Coupon {
  id: IdType;
  name: string;
  isValid(): boolean;
  getName(): string;
  getDiscount(total: number): number;
}

export class CouponPercentByTime implements Coupon {
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
