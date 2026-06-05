import { EachMessagePayload } from 'kafkajs';
import { CartRepository } from '../repository/cart.repository';

export class CartSavedHandler {
  constructor(private cartRepository: CartRepository) {}

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
      await this.cartRepository.save(data.payload);

      console.log(`[CartSavedHandler] Cart processed successfully.`);
    } catch (error) {
      console.error('[CartSavedHandler] Error processing message:', error);
    }
  };
}
