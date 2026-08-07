import { MongoClient, Db, Collection, Document } from 'mongodb';
import { env } from '../../../config/env';

class MongoDbClient {
  private client: MongoClient;
  private db: Db | null = null;

  constructor(
    private readonly uri: string,
    private readonly dbName: string,
  ) {
    this.client = new MongoClient(this.uri, {
      // Without explicit timeouts the driver can hang indefinitely on a
      // stalled/half-open handshake, leaving connect() unresolved forever
      // and, in turn, blocking the whole process silently (no log, no
      // port bind). Bound every network wait so a failure always surfaces.
      connectTimeoutMS: 10_000,
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 20_000,
    });
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
