import { Kafka, Producer as KafkaJSProducer } from 'kafkajs';
import { env } from '../../config/env';

export class KafkaProducerClient {
  private kafka: Kafka;
  private producer: KafkaJSProducer;
  private isConnected: boolean = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: env.kafka.clientId,
      brokers: env.kafka.brokers,
    });

    this.producer = this.kafka.producer();
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.producer.connect();
      this.isConnected = true;
    }
  }

  async send(payload: {
    topic: string;
    messages: Array<{ value: string }>;
  }): Promise<void> {
    await this.connect();

    await this.producer.send({
      topic: payload.topic,
      messages: payload.messages,
    });
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.producer.disconnect();
      this.isConnected = false;
    }
  }
}
