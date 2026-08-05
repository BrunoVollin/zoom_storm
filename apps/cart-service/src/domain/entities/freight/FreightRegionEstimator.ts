export interface RegionEstimate {
  distanceKm: number;
  days: number;
}

/**
 * Approximate road distance (km) and delivery lead time (business days)
 * from the store's origin (São Paulo, SP) to each Brazilian state's
 * capital. Not a real routing/logistics table — a reasonable simulation
 * so freight cost/ETA vary by real destination state.
 */
const DISTANCE_FROM_SAO_PAULO: Record<string, RegionEstimate> = {
  SP: { distanceKm: 50, days: 1 },
  RJ: { distanceKm: 430, days: 2 },
  MG: { distanceKm: 590, days: 2 },
  ES: { distanceKm: 880, days: 3 },
  PR: { distanceKm: 400, days: 2 },
  SC: { distanceKm: 700, days: 3 },
  RS: { distanceKm: 1100, days: 4 },
  DF: { distanceKm: 1015, days: 4 },
  GO: { distanceKm: 900, days: 4 },
  MS: { distanceKm: 990, days: 4 },
  MT: { distanceKm: 1620, days: 5 },
  BA: { distanceKm: 1960, days: 6 },
  SE: { distanceKm: 2320, days: 7 },
  AL: { distanceKm: 2635, days: 8 },
  PE: { distanceKm: 2660, days: 7 },
  PB: { distanceKm: 2770, days: 8 },
  RN: { distanceKm: 2860, days: 8 },
  CE: { distanceKm: 2965, days: 8 },
  PI: { distanceKm: 2850, days: 8 },
  MA: { distanceKm: 3020, days: 8 },
  TO: { distanceKm: 1720, days: 6 },
  PA: { distanceKm: 2900, days: 8 },
  AP: { distanceKm: 3300, days: 9 },
  AM: { distanceKm: 3500, days: 9 },
  RO: { distanceKm: 2700, days: 7 },
  RR: { distanceKm: 3900, days: 10 },
  AC: { distanceKm: 3135, days: 8 },
};

const DEFAULT_ESTIMATE: RegionEstimate = { distanceKm: 1500, days: 7 };

export function estimateFreightRegion(state: string): RegionEstimate {
  return DISTANCE_FROM_SAO_PAULO[state.toUpperCase()] ?? DEFAULT_ESTIMATE;
}
