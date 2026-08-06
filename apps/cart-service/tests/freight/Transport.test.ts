import { Transport } from '../../src/domain/entities/freight/Transport';

describe('Transport', () => {
  describe('getVolume', () => {
    it('converts centimeter dimensions to a volume in cubic meters (m3)', () => {
      // 15cm x 13cm x 23cm -> 4485 cm3 -> 0.004485 m3
      const transport = new Transport(15, 13, 23);

      expect(transport.getVolume()).toBeCloseTo(0.004485, 6);
    });

    it('returns a volume far smaller than the raw cm3 product', () => {
      const transport = new Transport(15, 13, 23);
      const rawCm3 = 15 * 13 * 23;

      expect(transport.getVolume()).toBeLessThan(rawCm3 / 1000);
    });

    it('computes a plausible volume for a 100cm cube (1 m3)', () => {
      const transport = new Transport(100, 100, 100);

      expect(transport.getVolume()).toBe(1);
    });

    it('returns 0 when any dimension is 0', () => {
      const transport = new Transport(0, 10, 10);

      expect(transport.getVolume()).toBe(0);
    });
  });
});
