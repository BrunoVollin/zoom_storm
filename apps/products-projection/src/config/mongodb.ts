import { MongoClient, Db, Collection, Document } from 'mongodb';

export class MongoDbClient {
  private client: MongoClient;
  private db: Db | null = null;
  private uri: string;
  private dbName: string;

  constructor(uri: string, dbName: string) {
    this.uri = uri;
    this.dbName = dbName;
    this.client = new MongoClient(this.uri, {
      // Without explicit timeouts a stalled/half-open handshake can hang
      // indefinitely. Since this repository is called from inside
      // consumer.run()'s eachMessage, an unbounded hang here blocks the
      // Kafka heartbeat (only sent between processed messages), which gets
      // the consumer kicked from the group and triggers a rebalance storm.
      connectTimeoutMS: 10_000,
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 20_000,
    });
  }

  public async connect(): Promise<void> {
    try {
      if (!this.db) {
        await this.client.connect();
        this.db = this.client.db(this.dbName);
        console.log('Successfully connected to MongoDB!');
      }
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      throw error;
    }
  }

  public getCollection<T extends Document>(
    collectionName: string,
  ): Collection<T> {
    if (!this.db) {
      throw new Error('Database not initialized. Call connect() first.');
    }

    return this.db.collection<T>(collectionName);
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.close();
      this.db = null;
      console.log('MongoDB connection closed.');
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
    }
  }
}
