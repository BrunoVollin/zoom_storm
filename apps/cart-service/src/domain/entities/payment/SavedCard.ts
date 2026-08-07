import { IdType } from '../../shared/IdType';

export class SavedCard {
  constructor(
    readonly id: IdType,
    readonly userId: IdType,
    private _brand: string,
    private _lastFour: string,
    private _holderName: string,
    private _expiry: string,
    readonly createdAt: Date = new Date(),
    private defaultCard = false,
    private updatedAt: Date = createdAt,
  ) {
    this.validateDetails(_brand, _lastFour, _holderName, _expiry);
  }

  private validateDetails(
    brand: string,
    lastFour: string,
    holderName: string,
    expiry: string,
  ): void {
    if (!brand.trim()) throw new Error('Card brand is required');
    if (!/^\d{4}$/.test(lastFour)) {
      throw new Error('Card lastFour must have exactly 4 digits');
    }
    if (!holderName.trim()) throw new Error('Card holder name is required');
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      throw new Error('Card expiry must be in MM/YY format');
    }

    const month = Number(expiry.slice(0, 2));
    if (month < 1 || month > 12) {
      throw new Error('Card expiry month must be between 01 and 12');
    }
  }

  belongsTo(userId: IdType): boolean {
    return this.userId.equals(userId);
  }

  update(brand: string, holderName: string, expiry: string): void {
    this.validateDetails(brand, this._lastFour, holderName, expiry);
    this._brand = brand;
    this._holderName = holderName;
    this._expiry = expiry;
    this.updatedAt = new Date();
  }

  makeDefault(): void {
    this.defaultCard = true;
    this.updatedAt = new Date();
  }

  clearDefault(): void {
    this.defaultCard = false;
    this.updatedAt = new Date();
  }

  isDefault(): boolean {
    return this.defaultCard;
  }

  isExpired(referenceDate: Date = new Date()): boolean {
    const month = Number(this._expiry.slice(0, 2));
    const year = 2000 + Number(this._expiry.slice(3, 5));
    const firstDayAfterExpiry = new Date(Date.UTC(year, month, 1));
    return referenceDate.getTime() >= firstDayAfterExpiry.getTime();
  }

  getBrand(): string {
    return this._brand;
  }

  getLastFour(): string {
    return this._lastFour;
  }

  getHolderName(): string {
    return this._holderName;
  }

  getExpiry(): string {
    return this._expiry;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  get brand(): string {
    return this._brand;
  }

  get lastFour(): string {
    return this._lastFour;
  }

  get holderName(): string {
    return this._holderName;
  }

  get expiry(): string {
    return this._expiry;
  }
}
