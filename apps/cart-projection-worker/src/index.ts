import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { MongoDbClient } from '@cart-projection/database/mongodb';

const kafka = new Kafka({
  clientId: 'zoom-app',
  brokers: [process.env.KAFKA_BROKERS ?? 'localhost:9022'],
});

const uri =
  process.env.MONGO_URI ??
  'mongodb://root:root@localhost:27017/zoom-mongo?authSource=admin';
const dbName = process.env.MONGO_DB_NAME ?? 'zoom-mongo';

const consumer: Consumer = kafka.consumer({ groupId: 'my-consumer-group' });

export async function startConsumer() {
  const mongoClient = new MongoDbClient(uri, dbName);
  try {
    await consumer.connect();
    await mongoClient.connect();
    console.log('Consumer successfully connected to Kafka!');
    const cartCollection = mongoClient.getCollection('cart');
    await consumer.subscribe({ topic: 'cart.saved', fromBeginning: true });

    await consumer.run({
      eachMessage: async ({
        topic,
        partition,
        message,
      }: EachMessagePayload) => {
        const rawMessage = message.value?.toString('utf8') ?? null;

        console.log(`Message received:`);
        console.log(`- Topic: ${topic}`);
        console.log(`- Partition: ${partition}`);
        console.log(`- Offset: ${message.offset}`);
        console.log(`- Value: ${rawMessage}`);

        if (!rawMessage) {
          console.warn('Message payload is empty, skipping insert.');

          return;
        }

        const payload = JSON.parse(rawMessage);

        await cartCollection.insertOne(payload);
      },
    });
  } catch (error) {
    console.error('Error in consumer:', error);
  }
}

const handleShutdown = async (): Promise<void> => {
  console.log('\nDisconnecting consumer...');
  await consumer.disconnect();
  process.exit(0);
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
