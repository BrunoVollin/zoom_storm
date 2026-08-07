import { IdType } from '../../shared/IdType';
import { Address } from './Address';

export class SavedAddress {
  constructor(
    readonly id: IdType,
    readonly userId: IdType,
    private label: string,
    private recipient: string,
    private address: Address,
    private defaultAddress = false,
    readonly createdAt: Date = new Date(),
    private updatedAt: Date = createdAt,
  ) {
    this.validateDetails(label, recipient);
  }

  private validateDetails(label: string, recipient: string): void {
    if (!label.trim()) throw new Error('Address label is required');
    if (!recipient.trim()) throw new Error('Address recipient is required');
  }

  belongsTo(userId: IdType): boolean {
    return this.userId.equals(userId);
  }

  update(label: string, recipient: string, address: Address): void {
    this.validateDetails(label, recipient);
    this.label = label;
    this.recipient = recipient;
    this.address = address;
    this.updatedAt = new Date();
  }

  makeDefault(): void {
    this.defaultAddress = true;
    this.updatedAt = new Date();
  }

  clearDefault(): void {
    this.defaultAddress = false;
    this.updatedAt = new Date();
  }

  getLabel(): string {
    return this.label;
  }

  getRecipient(): string {
    return this.recipient;
  }

  getAddress(): Address {
    return this.address;
  }

  isDefault(): boolean {
    return this.defaultAddress;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
