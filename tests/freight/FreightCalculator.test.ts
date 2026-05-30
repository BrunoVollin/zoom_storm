import { FreightRoadCalculator } from "../../src/domain/entities/freight/FreightCalculator";
import { createShipment } from "../factories/FreightFactory";



describe("FreightCalculator", () => {
  let freightCalculator: FreightRoadCalculator;

  beforeEach(() => {
    freightCalculator = new FreightRoadCalculator();

    jest.clearAllMocks();
  });

  describe("Road Freight Calculation", () => {
    it("should calculate freight cost for standard shipment", () => {
      const shipment = createShipment();

      const freight = freightCalculator.calculate(shipment);

      expect(freight).toBe(153250);
    });

    it("should calculate freight cost for larger shipment", () => {
      const shipment = createShipment({
        width: 20,
        height: 20,
        length: 20,
      });

      const freight = freightCalculator.calculate(shipment);

      expect(freight).toBeGreaterThan(153250);
    });

    it("should calculate freight cost for smaller shipment", () => {
      const shipment = createShipment({
        width: 5,
        height: 5,
        length: 5,
      });

      const freight = freightCalculator.calculate(shipment);

      expect(freight).toBeLessThan(153250);
    });
  });
});
