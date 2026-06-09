import { MongoClient, Db, Collection } from 'mongodb';
import { env } from '../../../config/env';

class MongoDbClient {
  private client: MongoClient;
  private db: Db | null = null;

  constructor(
    private readonly uri: string,
    private readonly dbName: string,
  ) {
    this.client = new MongoClient(this.uri);
  }

  async connect(): Promise<void> {
    if (!this.db) {
      await this.client.connect();
      this.db = this.client.db(this.dbName);
    }
  }

  getCollection<T extends Document>(name: string): Collection<T> {
    if (!this.db)
      throw new Error('MongoDB not connected. Call connect() first.');

    return this.db.collection<T>(name);
  }

  async disconnect(): Promise<void> {
    await this.client.close();
    this.db = null;
  }
}

const MONGO_URI = env.mongo.uri;
const MONGO_DB = env.mongo.dbName;

export const mongoClient = new MongoDbClient(MONGO_URI, MONGO_DB);

export async function closeMongoConnection(): Promise<void> {
  await mongoClient.disconnect();
}
