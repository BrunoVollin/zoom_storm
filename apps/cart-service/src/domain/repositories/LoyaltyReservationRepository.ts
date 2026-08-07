import { LoyaltyAccount } from '../entities/loyalty/LoyaltyAccount';
import { LoyaltyReservation } from '../entities/loyalty/LoyaltyReservation';
import { IdType } from '../shared/IdType';

export type ReserveLoyaltyResult =
  | { outcome: 'RESERVED'; reservation: LoyaltyReservation }
  | { outcome: 'INSUFFICIENT_BALANCE' }
  | { outcome: 'IDEMPOTENCY_CONFLICT' };

export interface LoyaltyReservationRepository {
  findByOrderId(orderId: IdType): Promise<LoyaltyReservation | null>;

  /**
   * Atomically reserves points after subtracting all ACTIVE reservations for
   * the user. Reusing an orderId with the same user/points is idempotent;
   * changing that payload returns IDEMPOTENCY_CONFLICT.
   */
  reserve(
    reservation: LoyaltyReservation,
    currentBalance: number,
  ): Promise<ReserveLoyaltyResult>;

  save(reservation: LoyaltyReservation): Promise<void>;

  /** Atomically persists CONSUMED and debits the account once per orderId. */
  consume(
    reservation: LoyaltyReservation,
    account: LoyaltyAccount,
  ): Promise<void>;

  findActiveExpired(referenceDate: Date): Promise<LoyaltyReservation[]>;
}
