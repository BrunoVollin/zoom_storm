import { LoyaltyAccount } from '../entities/loyalty/LoyaltyAccount';
import { Order } from '../entities/order/Order';
import { PaymentAttempt } from '../entities/payment/PaymentAttempt';
import { SavedCard } from '../entities/payment/SavedCard';
import { DomainEvent } from '../events/DomainEvent';
import { IdType } from '../shared/IdType';

export interface CompletePaymentInput {
  attempt: PaymentAttempt;
  order: Order;
  event: DomainEvent;
  loyalty?: {
    account: LoyaltyAccount;
    points: number;
  };
  savedCard?: SavedCard;
}

export interface PaymentAttemptRepository {
  findByIdempotencyKey(userId: IdType, key: string): Promise<PaymentAttempt | null>;
  save(attempt: PaymentAttempt): Promise<void>;
  /** Atomically persists the successful attempt, paid order/event and loyalty award. */
  complete(input: CompletePaymentInput): Promise<void>;
}
