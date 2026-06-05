export class Transport {
  constructor(
    public height: number,
    public width: number,
    public length: number,
  ) {}

  getVolume(): number {
    return this.height * this.length * this.width;
  }
}
