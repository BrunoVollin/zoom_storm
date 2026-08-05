import { IdType } from '../shared/IdType';

export class ProductVariant {
  constructor(
    readonly id: IdType,
    readonly productId: IdType,
    readonly sku: string,
    readonly price: number,
    readonly stock: number,
    readonly name: string | null = null,
    readonly isDefault: boolean = false,
  ) {}

  getId(): IdType {
    return this.id;
  }
}
