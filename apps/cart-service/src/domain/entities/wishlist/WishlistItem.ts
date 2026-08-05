import { IdType } from '../../shared/IdType';

export class WishlistItem {
  constructor(
    readonly id: IdType,
    readonly userId: IdType,
    readonly productId: IdType,
    readonly productName: string,
    readonly createdAt: Date = new Date(),
  ) {}
}
