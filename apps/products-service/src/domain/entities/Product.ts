import { IdType } from '../shared/IdType';

export class Product {
  constructor(
    readonly id: IdType,
    readonly name: string,
    readonly price: number,
    readonly description: string,
    readonly category: string,
    readonly stock: number,
    readonly transportHeight: number,
    readonly transportWidth: number,
    readonly transportLength: number,
  ) {}

  getId(): IdType {
    return this.id;
  }
}
