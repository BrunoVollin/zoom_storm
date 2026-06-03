import { EventPublisher } from '../../domain/events/EventPublisher';
import { KafkaProducerClient } from './KafkaProducerClient';
import { DomainEvent } from '../../domain/events/DomainEvent';

export class KafkaEventPublisher implements EventPublisher {
  constructor(private kafkaProducer: KafkaProducerClient) {}

  async publish(event: DomainEvent): Promise<void> {
    const topic = event.name;

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
}
