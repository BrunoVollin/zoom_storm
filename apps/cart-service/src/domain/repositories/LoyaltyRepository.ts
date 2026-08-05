import { LoyaltyAccount } from '../entities/loyalty/LoyaltyAccount';
import { IdType } from '../shared/IdType';

export type LoyaltyTransactionType = 'EARN' | 'REDEEM';

export interface LoyaltyRepository {
  findByUserId(userId: IdType): Promise<LoyaltyAccount | null>;
  save(
    account: LoyaltyAccount,
    transaction: { type: LoyaltyTransactionType; points: number; orderId?: string },
  ): Promise<void>;
}
