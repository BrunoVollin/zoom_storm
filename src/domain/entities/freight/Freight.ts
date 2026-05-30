export interface Freight {
  calculate(Shipment: Shipment): number;
}

export class Shipment {
  constructor(
    readonly distance: number,
    readonly volume: number,
    readonly weight: number
  ) {}
}