import { Shipment } from '../../src/domain/entities/freight/Freight';

export function createShipment(
  overrides?: Partial<{
    distance: number;
    volume: number;
    weight: number;
  }>,
): Shipment {
  const defaults = {
    distance: 10,
    volume: 10,
    weight: 10,
  };

  return new Shipment(
    overrides?.distance ?? defaults.distance,
    overrides?.volume ?? defaults.volume,
    overrides?.weight ?? defaults.weight,
  );
}
