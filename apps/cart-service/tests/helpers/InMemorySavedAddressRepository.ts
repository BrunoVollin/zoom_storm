import { SavedAddress } from '../../src/domain/entities/profile/SavedAddress';
import { SavedAddressRepository } from '../../src/domain/repositories/SavedAddressRepository';
import { IdType } from '../../src/domain/shared/IdType';

export class InMemorySavedAddressRepository implements SavedAddressRepository {
  readonly addresses = new Map<string, SavedAddress>();

  async save(address: SavedAddress): Promise<void> {
    if (address.isDefault()) {
      for (const current of this.addresses.values()) {
        if (current.belongsTo(address.userId) && !current.id.equals(address.id)) {
          current.clearDefault();
        }
      }
    }
    this.addresses.set(address.id.toString(), address);
  }

  async findById(id: IdType): Promise<SavedAddress | null> {
    return this.addresses.get(id.toString()) ?? null;
  }

  async findByUserId(userId: IdType): Promise<Array<SavedAddress>> {
    return [...this.addresses.values()].filter((address) => address.belongsTo(userId));
  }

  async delete(id: IdType): Promise<void> {
    this.addresses.delete(id.toString());
  }
}
