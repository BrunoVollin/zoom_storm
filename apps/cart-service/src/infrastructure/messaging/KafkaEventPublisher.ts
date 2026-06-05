import { EventPublisher } from '../../domain/events/EventPublisher';
import { KafkaProducerClient } from './KafkaProducerClient';
import { DomainEvent, DomainEventName } from '../../domain/events/DomainEvent';

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
    const map = {
      [DomainEventName.CART_CREATED]: 'cart-events',
      [DomainEventName.CART_ITEM_ADDED]: 'cart-events',
      [DomainEventName.CART_ITEM_REMOVED]: 'cart-events',
      [DomainEventName.CART_UPDATED]: 'cart-events',
      [DomainEventName.CART_ABANDONED]: 'cart-events',
      [DomainEventName.CART_CHECKED_OUT]: 'checkout-events',
    };

    return map[eventName];
  }
}
