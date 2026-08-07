import { Consumer, Kafka } from 'kafkajs';
import { env } from '../../config/env';
import { OrderReviewEligibilityHandler } from './OrderReviewEligibilityHandler';

type ConsumerClient = Pick<
  Consumer,
  'connect' | 'subscribe' | 'run' | 'disconnect'
>;

export class OrderReviewEligibilityConsumer {
  private readonly consumer: ConsumerClient;
  private started = false;

  constructor(
    private readonly handler: OrderReviewEligibilityHandler,
    consumer?: ConsumerClient,
  ) {
    this.consumer =
      consumer ??
      new Kafka({
        clientId: `${env.kafka.clientId}-review-eligibility`,
        brokers: env.kafka.brokers,
      }).consumer({ groupId: env.kafka.reviewEligibilityGroupId });
  }

  async start(): Promise<void> {
    if (this.started) return;
    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: env.kafka.orderEventsTopic,
      fromBeginning: true,
    });
    await this.consumer.run({ eachMessage: this.handler.handle });
    this.started = true;
  }

  async stop(): Promise<void> {
    if (!this.started) return;
    await this.consumer.disconnect();
    this.started = false;
  }
}
