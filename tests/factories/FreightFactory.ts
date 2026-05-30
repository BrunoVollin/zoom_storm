import { Shipment } from "../../src/domain/entities/freight/Freight";

export function createShipment(
  overrides?: Partial<{
    width: number;
    height: number;
    length: number;
  }>,
): Shipment {
  const defaults = {
    width: 10,
    height: 10,
    length: 10,
  };

  return new Shipment(
    overrides?.width ?? defaults.width,
    overrides?.height ?? defaults.height,
    overrides?.length ?? defaults.length,
  );
}