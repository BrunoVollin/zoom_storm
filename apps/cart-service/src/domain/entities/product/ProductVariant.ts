import { Transport } from '../freight/Transport';
import { IdType } from '../../shared/IdType';

export class ProductVariant {
  constructor(
    readonly id: IdType,
    readonly productId: IdType,
    readonly productName: string,
    readonly productDescription: string,
    readonly productCategory: string,
    readonly sku: string,
    readonly name: string | null,
    readonly price: number,
    readonly stock: number,
    readonly transport: Transport,
    readonly weight: number,
  ) {}

  getVolume(): number {
    return this.transport.getVolume();
  }

  getId(): IdType {
    return this.id;
  }
}
