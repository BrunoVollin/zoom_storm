import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'my-consumer-app',
  brokers: ['localhost:9092'],
});

const consumer: Consumer = kafka.consumer({ groupId: 'my-consumer-group' });

const startConsumer = async (): Promise<void> => {
  try {
    await consumer.connect();
    console.log('🚀 Consumer successfully connected to Kafka!');

    await consumer.subscribe({ topic: 'my-topic', fromBeginning: true });

    await consumer.run({
      eachMessage: async ({
        topic,
        partition,
        message,
      }: EachMessagePayload) => {
        const messageValue = message.value ? message.value.toString() : null;

        console.log(`📥 Message received:`);
        console.log(`- Topic: ${topic}`);
        console.log(`- Partition: ${partition}`);
        console.log(`- Offset: ${message.offset}`);
        console.log(`- Value: ${messageValue}`);
      },
    });
  } catch (error) {
    console.error('❌ Error in consumer:', error);
  }
};

const handleShutdown = async (): Promise<void> => {
  console.log('\n🛑 Disconnecting consumer...');
  await consumer.disconnect();
  process.exit(0);
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

startConsumer();
