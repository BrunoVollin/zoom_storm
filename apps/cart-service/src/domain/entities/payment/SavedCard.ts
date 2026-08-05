import { IdType } from '../../shared/IdType';

export class SavedCard {
  constructor(
    readonly id: IdType,
    readonly userId: IdType,
    readonly brand: string,
    readonly lastFour: string,
    readonly holderName: string,
    readonly expiry: string,
    readonly createdAt: Date = new Date(),
  ) {
    this.validate();
  }

  private validate() {
    if (!this.brand.trim()) throw new Error('Card brand is required');
    if (!/^\d{4}$/.test(this.lastFour)) {
      throw new Error('Card lastFour must have exactly 4 digits');
    }
    if (!this.holderName.trim()) throw new Error('Card holder name is required');
    if (!/^\d{2}\/\d{2}$/.test(this.expiry)) {
      throw new Error('Card expiry must be in MM/YY format');
    }
  }

  belongsTo(userId: IdType): boolean {
    return this.userId.equals(userId);
  }
}
