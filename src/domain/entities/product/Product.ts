import { Transport } from "../freight/Transport";
import { IdType } from "../../shared/IdType";

export class Product {
  constructor(
    readonly id: IdType,
    readonly name: string,
    readonly price: number,
    readonly description: string,
    readonly category: string,
    readonly stock: number,
    readonly transport: Transport,
  ) {}

  getVolume(): number {
    return this.transport.getVolume();
  }

  getId(): IdType {
    return this.id;
  }
}
