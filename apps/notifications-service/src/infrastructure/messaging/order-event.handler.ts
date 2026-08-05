import { EachMessagePayload } from 'kafkajs';
import { CreateNotificationFromOrderEventUseCase } from '../../application/usecases/CreateNotificationFromOrderEventUseCase';

export class OrderEventHandler {
  constructor(
    private readonly createNotificationFromOrderEventUseCase: CreateNotificationFromOrderEventUseCase,
  ) {}

  public handle = async ({ topic, partition, message }: EachMessagePayload): Promise<void> => {
    const rawMessage = message.value?.toString('utf8');

    console.log(
      `[Kafka] Message received - Topic: ${topic} | Partition: ${partition} | Offset: ${message.offset}`,
    );

    if (!rawMessage) {
      console.warn('[Kafka] Empty message payload, skipping.');

      return;
    }

    try {
      const event = JSON.parse(rawMessage);
      const { name, payload } = event;

      if (!payload?.id || !payload?.userId) {
        console.warn('[OrderEventHandler] Event payload missing id/userId, skipping.');

        return;
      }

      if (name !== 'order.created' && name !== 'order.status_changed') {
        console.warn(`[OrderEventHandler] Unknown event name: ${name}, skipping.`);

        return;
      }

      const result = await this.createNotificationFromOrderEventUseCase.execute({
        eventName: name,
        payload,
      });

      if (result.status === 'SUCCESS' && result.notification) {
        console.log(
          `[OrderEventHandler] Notification created for user ${payload.userId} (order ${payload.id}).`,
        );
      }
    } catch (error) {
      console.error('[OrderEventHandler] Error processing message:', error);
      throw error;
    }
  };
}
