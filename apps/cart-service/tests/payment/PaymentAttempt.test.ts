import {
  PaymentAttempt,
  PaymentAttemptStatus,
} from '../../src/domain/entities/payment/PaymentAttempt';
import { PaymentMethodType } from '../../src/domain/entities/payment/PaymentMethod';
import { IdType } from '../../src/domain/shared/IdType';

const method = {
  type: PaymentMethodType.NEW_CARD,
  brand: 'Visa',
  lastFour: '4242',
  holderName: 'Bruno',
  expiry: '12/30',
  saveCard: false,
};

describe('PaymentAttempt', () => {
  it('requires a non-empty idempotency key and valid installments', () => {
    expect(
      () => new PaymentAttempt(IdType.create(), IdType.create(), IdType.create(), '', method, 1),
    ).toThrow('Idempotency key is required');
    expect(
      () => new PaymentAttempt(IdType.create(), IdType.create(), IdType.create(), 'key', method, 13),
    ).toThrow('Installments must be between 1 and 12');
  });

  it('contains no PAN, CVC or payment token in its persistent snapshot', () => {
    const attempt = new PaymentAttempt(
      IdType.create('attempt-1'), IdType.create('order-1'), IdType.create('user-1'), 'key', method, 1,
    );

    expect(JSON.stringify(attempt)).not.toMatch(/cvc|token|pan/i);
  });

  it('succeeds idempotently but cannot fail after success', () => {
    const attempt = new PaymentAttempt(
      IdType.create('attempt-1'), IdType.create('order-1'), IdType.create('user-1'), 'key', method, 1,
    );

    attempt.succeed();
    attempt.succeed();

    expect(attempt.getStatus()).toBe(PaymentAttemptStatus.SUCCEEDED);
    expect(() => attempt.fail('declined')).toThrow(
      'Cannot fail payment attempt from status SUCCEEDED',
    );
  });

  it('detects when a key is reused with different request data', () => {
    const orderId = IdType.create('order-1');
    const attempt = new PaymentAttempt(
      IdType.create('attempt-1'), orderId, IdType.create('user-1'), 'key', method, 1,
    );

    expect(attempt.matchesRequest(orderId, 1, method)).toBe(true);
    expect(attempt.matchesRequest(orderId, 2, method)).toBe(false);
  });
});
