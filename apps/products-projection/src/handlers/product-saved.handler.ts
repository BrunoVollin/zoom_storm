import { EachMessagePayload } from 'kafkajs';
import { ProductRepository } from '../repository/product.repository';

export class ProductSavedHandler {
  constructor(private productRepository: ProductRepository) {}

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
      console.warn('[Kafka] Message payload is empty, skipping.');

      return;
    }

    try {
      const event = JSON.parse(rawMessage);
      const { name, payload } = event;

      if (!payload?.id) {
        console.warn(
          '[ProductSavedHandler] Event payload has no id, skipping.',
        );

        return;
      }

      if (name === 'product.created' || name === 'product.updated') {
        await this.productRepository.save(payload);
        console.log(
          `[ProductSavedHandler] Product upserted (${name}): ${payload.id}`,
        );
      } else if (name === 'product.deleted') {
        await this.productRepository.delete(payload.id);
        console.log(`[ProductSavedHandler] Product deleted: ${payload.id}`);
      } else {
        console.warn(
          `[ProductSavedHandler] Unknown event name: ${name}, skipping.`,
        );
      }
    } catch (error) {
      console.error('[ProductSavedHandler] Error processing message:', error);
      throw error;
    }
  };
}
