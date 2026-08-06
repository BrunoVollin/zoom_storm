import { estimateFreightRegion } from '../../src/domain/entities/freight/FreightRegionEstimator';

describe('estimateFreightRegion', () => {
  it('returns the known distance/days estimate for a mapped state (SP)', () => {
    expect(estimateFreightRegion('SP')).toEqual({ distanceKm: 50, days: 1 });
  });

  it('returns the known distance/days estimate for a far state (RR)', () => {
    expect(estimateFreightRegion('RR')).toEqual({
      distanceKm: 3900,
      days: 10,
    });
  });

  it('is case-insensitive when looking up the state', () => {
    expect(estimateFreightRegion('rj')).toEqual({
      distanceKm: 430,
      days: 2,
    });
  });

  it('falls back to the default estimate for an unknown state', () => {
    expect(estimateFreightRegion('ZZ')).toEqual({
      distanceKm: 1500,
      days: 7,
    });
  });
});
