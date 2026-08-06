import { FreightRoadCalculator } from '../../src/domain/entities/freight/FreightCalculator';
import { createShipment } from '../factories/FreightFactory';

describe('FreightCalculator', () => {
  let freightCalculator: FreightRoadCalculator;

  beforeEach(() => {
    freightCalculator = new FreightRoadCalculator();

    jest.clearAllMocks();
  });

  describe('Road Freight Calculation', () => {
    it('should calculate freight cost for standard shipment', () => {
      const shipment = createShipment();

      const freight = freightCalculator.calculate(shipment);

      expect(freight).toBe(3400);
    });

    it('should calculate freight cost for larger shipment', () => {
      const shipment = createShipment({
        distance: 20,
        volume: 0.1,
        weight: 20,
      });

      const freight = freightCalculator.calculate(shipment);

      expect(freight).toBe(6800);
    });

    it('should calculate freight cost for smaller shipment', () => {
      const shipment = createShipment({
        distance: 5,
        volume: 0.001,
        weight: 5,
      });

      const freight = freightCalculator.calculate(shipment);

      expect(freight).toBe(2240);
    });
  });
});
