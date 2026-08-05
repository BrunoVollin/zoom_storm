export class Address {
  constructor(
    readonly street: string,
    readonly number: string,
    readonly neighborhood: string,
    readonly city: string,
    readonly state: string,
    readonly zip: string,
    readonly complement: string | null = null,
  ) {
    this.validate();
  }

  private validate() {
    if (!this.street.trim()) throw new Error('Address street is required');
    if (!this.number.trim()) throw new Error('Address number is required');
    if (!this.neighborhood.trim()) throw new Error('Address neighborhood is required');
    if (!this.city.trim()) throw new Error('Address city is required');
    if (!this.state.trim()) throw new Error('Address state is required');

    const zipDigits = this.zip.replace(/\D/g, '');
    if (zipDigits.length !== 8) {
      throw new Error('Address zip must have 8 digits');
    }
  }
}
