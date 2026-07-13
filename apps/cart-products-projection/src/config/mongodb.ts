import { MongoClient, Db, Collection } from 'mongodb';

export class MongoDbClient {
  private client: MongoClient;
  private db: Db | null = null;
  private uri: string;
  private dbName: string;

  constructor(uri: string, dbName: string) {
    this.uri = uri;
    this.dbName = dbName;
    this.client = new MongoClient(this.uri);
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
