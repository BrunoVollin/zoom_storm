export interface Freight {
  calculate(shipment: Shipment): number;
}

export class Shipment {
  constructor(
    readonly distance: number,
    readonly volume: number,
    readonly weight: number,
  ) {}
}
