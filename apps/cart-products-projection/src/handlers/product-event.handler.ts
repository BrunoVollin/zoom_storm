import { EachMessagePayload } from 'kafkajs';
import { ProductRepository } from '../repository/product.repository';

export class ProductEventHandler {
  constructor(private readonly productRepository: ProductRepository) {}

  public handle = async ({
    topic,
    partition,
    message,
  }: EachMessagePayload): Promise<void> => {
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

      if (name === 'product.created' || name === 'product.updated') {
        await this.productRepository.save(payload);
        console.log(
          `[ProductEventHandler] Product upserted (${name}): ${payload.id}`,
        );
      } else if (name === 'product.deleted') {
        await this.productRepository.delete(payload.id);
        console.log(`[ProductEventHandler] Product deleted: ${payload.id}`);
      } else {
        console.warn(
          `[ProductEventHandler] Unknown event name: ${name}, skipping.`,
        );
      }
    } catch (error) {
      console.error('[ProductEventHandler] Error processing message:', error);
    }
  };
}
