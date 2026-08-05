import { IdType } from '../shared/IdType';

export class ProductReview {
  constructor(
    readonly id: IdType,
    readonly productId: IdType,
    readonly rating: number,
    readonly comment: string,
    readonly reviewerName: string,
    readonly reviewerEmail: string,
    readonly createdAt: Date = new Date(),
  ) {}

  getId(): IdType {
    return this.id;
  }
}
