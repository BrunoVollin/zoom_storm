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

      expect(freight).toBe(153250);
    });

    it('should calculate freight cost for larger shipment', () => {
      const shipment = createShipment({
        distance: 20,
        volume: 20,
        weight: 20,
      });

      const freight = freightCalculator.calculate(shipment);

      expect(freight).toBeGreaterThan(153250);
    });

    it('should calculate freight cost for smaller shipment', () => {
      const shipment = createShipment({
        distance: 5,
        volume: 5,
        weight: 5,
      });

      const freight = freightCalculator.calculate(shipment);

      expect(freight).toBeLessThan(153250);
    });
  });
});
