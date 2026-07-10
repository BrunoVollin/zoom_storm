import { EachMessagePayload } from 'kafkajs';
import { CartRepository } from '../repository/cart.repository';
import { OrderRepository } from '../repository/order.repository';

export class CartSavedHandler {
  constructor(
    private cartRepository: CartRepository,
    private orderRepository: OrderRepository,
  ) {}

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
      const { name, occurredAt, payload } = data;

      if (!payload?.id) {
        console.warn('[CartSavedHandler] Event payload has no id, skipping.');

        return;
      }

      if (name === 'cart.checked_out') {
        const { id, ...orderData } = payload;
        await this.orderRepository.save({
          ...orderData,
          cartId: id,
          occurredAt,
        });

        console.log(`[CartSavedHandler] Order recorded for cart ${id}.`);

        return;
      }

      await this.cartRepository.save(payload);

      console.log(`[CartSavedHandler] Cart processed successfully.`);
    } catch (error) {
      console.error('[CartSavedHandler] Error processing message:', error);
      throw error;
    }
  };
}
