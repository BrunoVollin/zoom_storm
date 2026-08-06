import { Shipment } from '../../src/domain/entities/freight/Freight';

describe('Shipment', () => {
  it('stores distance, volume and weight as given', () => {
    const shipment = new Shipment(430, 0.004485, 1.5);

    expect(shipment.distance).toBe(430);
    expect(shipment.volume).toBeCloseTo(0.004485, 6);
    expect(shipment.weight).toBe(1.5);
  });

  it('accepts zero values for distance, volume and weight', () => {
    const shipment = new Shipment(0, 0, 0);

    expect(shipment.distance).toBe(0);
    expect(shipment.volume).toBe(0);
    expect(shipment.weight).toBe(0);
  });
});
