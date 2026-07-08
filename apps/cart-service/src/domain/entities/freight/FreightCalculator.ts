import { Freight, Shipment } from './Freight';

const BASE_TAX = 12;
const WEIGHT_RATE_PER_KG = 2;
const VOLUME_RATE_PER_M3 = 150;
const DISTANCE_RATE_PER_KM = 0.05;
const CENTS_PER_UNIT = 100;

export class FreightRoadCalculator implements Freight {
  calculate(shipment: Shipment): number {
    const weightCost = shipment.weight * WEIGHT_RATE_PER_KG;
    const volumeCost = shipment.volume * VOLUME_RATE_PER_M3;
    const distanceCost = shipment.distance * DISTANCE_RATE_PER_KM;

    return Math.round(
      (BASE_TAX + weightCost + volumeCost + distanceCost) * CENTS_PER_UNIT,
    );
  }
}
