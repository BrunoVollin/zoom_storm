export class IdType {
  private constructor(
    readonly value: string | number
  ) {}

  static create(value?: string) {
    return new IdType(value ?? crypto.randomUUID());
  }

  equals(other: IdType): boolean {
    return this.value === other.value;
  }

  toString() {
    return String(this.value);
  }
}