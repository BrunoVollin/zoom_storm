import { UserProfile } from '../entities/profile/UserProfile';
import { IdType } from '../shared/IdType';

export interface UserProfileRepository {
  findByUserId(userId: IdType): Promise<UserProfile | null>;
  save(profile: UserProfile): Promise<void>;
}
