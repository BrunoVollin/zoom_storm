/**
 * Returns a stable shuffled copy for a given seed.
 *
 * The seed is supplied by the server for each Home request, so rendering is
 * varied between visits without using Math.random during React rendering.
 */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  let state = hashSeed(seed);
  const shuffled = [...items];

  const next = () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(next() * (index + 1));
    const currentItem = shuffled[index]!;
    shuffled[index] = shuffled[target]!;
    shuffled[target] = currentItem;
  }

  return shuffled;
}

function hashSeed(seed: string): number {
  let hash = 2_166_136_261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return hash >>> 0;
}
