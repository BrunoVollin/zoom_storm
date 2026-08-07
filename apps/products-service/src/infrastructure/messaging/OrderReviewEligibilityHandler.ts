import type { EachMessagePayload } from 'kafkajs';
import { Status } from '../../application/contracts/UseCase';
import { RegisterDeliveredOrderReviewEligibilitiesUseCase } from '../../application/usecases/RegisterDeliveredOrderReviewEligibilitiesUseCase';

type JsonObject = Record<string, unknown>;

export class OrderReviewEligibilityHandler {
  constructor(
    private readonly registerEligibilities: RegisterDeliveredOrderReviewEligibilitiesUseCase,
  ) {}

  handle = async ({ message }: EachMessagePayload): Promise<void> => {
    const raw = message.value?.toString('utf8');
    if (!raw) return;

    const envelope = this.parseObject(raw);
    const eventName = envelope.name ?? envelope.eventName ?? envelope.type;
    if (eventName !== 'order.status_changed') return;

    const payload = this.asObject(envelope.payload ?? envelope.data);
    if (payload.status !== 'DELIVERED') return;

    const orderId = this.nonEmptyString(payload.id ?? payload.orderId);
    const userId = this.nonEmptyString(payload.userId);
    const items = Array.isArray(payload.items)
      ? payload.items
          .map((item) => this.asObject(item, false))
          .map((item) => ({ productId: this.nonEmptyString(item.productId) }))
      : [];
    const deliveredAt = this.validDate(
      payload.deliveredAt ?? envelope.occurredAt ?? envelope.time,
    );

    if (!orderId || !userId || items.some((item) => !item.productId)) {
      throw new Error('Delivered order event has an invalid payload');
    }

    const result = await this.registerEligibilities.execute({
      orderId,
      userId,
      status: 'DELIVERED',
      items: items as Array<{ productId: string }>,
      deliveredAt,
    });

    if (result.status === Status.ERROR) {
      throw new Error(
        `Review eligibility processing failed: ${result.message}`,
      );
    }
  };

  private parseObject(raw: string): JsonObject {
    return this.asObject(JSON.parse(raw));
  }

  private asObject(value: unknown, required = true): JsonObject {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as JsonObject;
    }
    if (required) throw new Error('Order event must be a JSON object');
    return {};
  }

  private nonEmptyString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value : undefined;
  }

  private validDate(value: unknown): Date {
    const date =
      typeof value === 'string' || value instanceof Date
        ? new Date(value)
        : new Date(Number.NaN);
    if (Number.isNaN(date.getTime())) {
      throw new Error('Delivered order event has no valid delivery timestamp');
    }
    return date;
  }
}
