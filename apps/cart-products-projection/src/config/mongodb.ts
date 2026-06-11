import { MongoClient, Db, Collection } from 'mongodb';

export class MongoDbClient {
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
      console.log('[Database] MongoDB connected.');
    }
  }

  getCollection<T extends Document>(name: string): Collection<T> {
    if (!this.db)
      throw new Error('Database not initialized. Call connect() first.');
    return this.db.collection<T>(name);
  }

  async disconnect(): Promise<void> {
    await this.client.close();
    this.db = null;
  }
}
