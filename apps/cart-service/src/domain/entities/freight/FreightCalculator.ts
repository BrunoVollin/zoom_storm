import { Freight, Shipment } from './Freight';

/** Flat base tax charged on every road shipment, in currency units. */
const BASE_TAX = 12;
/** Cost per kg of shipment weight, in currency units. */
const WEIGHT_RATE_PER_KG = 2;
/** Cost per m³ of shipment volume, in currency units. */
const VOLUME_RATE_PER_M3 = 150;
/** Cost per km of shipment distance, in currency units. */
const DISTANCE_RATE_PER_KM = 0.05;
/** Converts currency units to cents for the final price. */
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
