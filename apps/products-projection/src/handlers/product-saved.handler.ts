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
      const data = JSON.parse(rawMessage);
      console.log(data.payload);
      await this.productRepository.save(data.payload);

      console.log(`[ProductSavedHandler] Product processed successfully.`);
    } catch (error) {
      console.error('[ProductSavedHandler] Error processing message:', error);
    }
  };
}
