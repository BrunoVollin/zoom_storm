import {
  DomainEvent,
  DomainEventName,
  EventPublisher,
} from '../../domain/events/DomainEvent';
import { KafkaProducerClient } from './KafkaProducerClient';

export class KafkaEventPublisher implements EventPublisher {
  constructor(private kafkaProducer: KafkaProducerClient) {}

  async publish(event: DomainEvent): Promise<void> {
    const topic = this.getTopic(event.name);

    await this.kafkaProducer.send({
      topic,
      messages: [
        {
          value: JSON.stringify({
            name: event.name,
            occurredAt: event.occurredAt,
            payload: event.payload,
          }),
        },
      ],
    });
  }

  private getTopic(eventName: DomainEventName): string {
    const map: Record<DomainEventName, string> = {
      [DomainEventName.PRODUCT_CREATED]: 'product-events',
      [DomainEventName.PRODUCT_UPDATED]: 'product-events',
      [DomainEventName.PRODUCT_DELETED]: 'product-events',
    };
    return map[eventName];
  }
}
