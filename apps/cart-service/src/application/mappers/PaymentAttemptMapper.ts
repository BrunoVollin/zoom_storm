import { PaymentAttempt } from '@src/domain/entities/payment/PaymentAttempt';

export class PaymentAttemptMapper {
  static toPrimitives(attempt: PaymentAttempt) {
    return {
      id: attempt.id.toString(),
      orderId: attempt.orderId.toString(),
      method: attempt.method,
      installments: attempt.installments,
      status: attempt.getStatus(),
      failureReason: attempt.getFailureReason(),
      createdAt: attempt.createdAt.toISOString(),
      updatedAt: attempt.getUpdatedAt().toISOString(),
    };
  }
}

export type PaymentAttemptPrimitives = ReturnType<typeof PaymentAttemptMapper.toPrimitives>;
