import { SavedAddress } from '../entities/profile/SavedAddress';
import { IdType } from '../shared/IdType';

export interface SavedAddressRepository {
  /** Upserts the address and atomically clears the previous default when needed. */
  save(address: SavedAddress): Promise<void>;
  findById(id: IdType): Promise<SavedAddress | null>;
  findByUserId(userId: IdType): Promise<Array<SavedAddress>>;
  delete(id: IdType): Promise<void>;
}
