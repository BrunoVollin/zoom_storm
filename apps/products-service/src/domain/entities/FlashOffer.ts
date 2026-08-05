import { IdType } from '../shared/IdType';

export class FlashOffer {
  constructor(
    readonly id: IdType,
    readonly productId: IdType,
    readonly title: string,
    readonly discountPct: number,
    readonly startsAt: Date,
    readonly endsAt: Date,
    readonly createdAt: Date = new Date(),
  ) {}

  getId(): IdType {
    return this.id;
  }

  isActive(now: Date = new Date()): boolean {
    return this.startsAt <= now && now <= this.endsAt;
  }
}
