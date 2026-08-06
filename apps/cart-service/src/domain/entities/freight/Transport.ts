// Dimensions (height, width, length) are stored in centimeters (cm), as
// populated from the product catalog (see products-service seed, which
// mirrors dummyjson's `item.dimensions`, given in cm).
const CM3_PER_M3 = 1_000_000;

export class Transport {
  constructor(
    public height: number,
    public width: number,
    public length: number,
  ) {}

  /**
   * Returns the volume in cubic meters (m3), converting from the
   * centimeter-based dimensions used by the product catalog.
   */
  getVolume(): number {
    const volumeInCm3 = this.height * this.length * this.width;
    return volumeInCm3 / CM3_PER_M3;
  }
}
