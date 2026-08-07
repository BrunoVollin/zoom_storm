import { IdType } from '../../shared/IdType';
import { PaymentMethod, PaymentMethodRequest, PaymentMethodType } from './PaymentMethod';

export enum PaymentAttemptStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
}

export class PaymentAttempt {
  constructor(
    readonly id: IdType,
    readonly orderId: IdType,
    readonly userId: IdType,
    readonly idempotencyKey: string,
    readonly method: PaymentMethod,
    readonly installments: number,
    private status: PaymentAttemptStatus = PaymentAttemptStatus.PENDING,
    readonly createdAt: Date = new Date(),
    private updatedAt: Date = createdAt,
    private failureReason: string | null = null,
  ) {
    if (!idempotencyKey.trim()) throw new Error('Idempotency key is required');
    if (!Number.isInteger(installments) || installments < 1 || installments > 12) {
      throw new Error('Installments must be between 1 and 12');
    }
    this.validateMethod(method);
  }

  private validateMethod(method: PaymentMethod): void {
    if (!method.brand.trim()) throw new Error('Card brand is required');
    if (!/^\d{4}$/.test(method.lastFour)) {
      throw new Error('Card lastFour must have exactly 4 digits');
    }
    if (!method.holderName.trim()) throw new Error('Card holder name is required');
    if (!/^\d{2}\/\d{2}$/.test(method.expiry)) {
      throw new Error('Card expiry must be in MM/YY format');
    }
    if (method.type === PaymentMethodType.SAVED_CARD && !method.savedCardId.trim()) {
      throw new Error('Saved card id is required');
    }
  }

  matchesRequest(
    orderId: IdType,
    installments: number,
    method: PaymentMethodRequest,
  ): boolean {
    if (!this.orderId.equals(orderId) || this.installments !== installments) {
      return false;
    }
    if (method.type === PaymentMethodType.SAVED_CARD) {
      return (
        this.method.type === PaymentMethodType.SAVED_CARD &&
        this.method.savedCardId === method.savedCardId
      );
    }

    return (
      this.method.type === PaymentMethodType.NEW_CARD &&
      this.method.brand === method.brand &&
      this.method.lastFour === method.lastFour &&
      this.method.holderName === method.holderName &&
      this.method.expiry === method.expiry &&
      this.method.saveCard === method.saveCard
    );
  }

  succeed(): void {
    if (this.status === PaymentAttemptStatus.SUCCEEDED) return;
    if (this.status !== PaymentAttemptStatus.PENDING) {
      throw new Error(`Cannot succeed payment attempt from status ${this.status}`);
    }
    this.status = PaymentAttemptStatus.SUCCEEDED;
    this.updatedAt = new Date();
  }

  fail(reason: string): void {
    if (this.status !== PaymentAttemptStatus.PENDING) {
      throw new Error(`Cannot fail payment attempt from status ${this.status}`);
    }
    if (!reason.trim()) throw new Error('Payment failure reason is required');
    this.status = PaymentAttemptStatus.FAILED;
    this.failureReason = reason;
    this.updatedAt = new Date();
  }

  getStatus(): PaymentAttemptStatus {
    return this.status;
  }

  getFailureReason(): string | null {
    return this.failureReason;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
