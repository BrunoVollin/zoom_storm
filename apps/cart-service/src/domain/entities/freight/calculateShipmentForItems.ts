import { CartItem } from '../cart/CartItem';
import { Freight, Shipment } from './Freight';
import { estimateFreightRegion } from './FreightRegionEstimator';

export interface ShipmentEstimate {
  shipping: number;
  estimatedDays: number;
}

/**
 * Pure domain calculation shared by shipping-quote and checkout flows:
 * sums cart items' weight/volume, resolves the destination region from the
 * state and delegates the actual cost calculation to the injected
 * `Freight` calculator.
 */
export function calculateShipmentForItems(
  items: CartItem[],
  state: string,
  freightCalculator: Freight,
): ShipmentEstimate {
  const totalVolume = items.reduce((acc, item) => acc + item.getVolume(), 0);
  const totalWeight = items.reduce((acc, item) => acc + item.getWeight(), 0);

  const region = estimateFreightRegion(state);
  const shipment = new Shipment(region.distanceKm, totalVolume, totalWeight);
  const shipping = freightCalculator.calculate(shipment);

  return { shipping, estimatedDays: region.days };
}
