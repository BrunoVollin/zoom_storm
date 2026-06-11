import { MongoDbClient } from '../config/mongodb';

interface ProductDocument {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  stock: number;
  transportHeight: number;
  transportWidth: number;
  transportLength: number;
}

export class ProductRepository {
  private collection: any;

  constructor(private readonly mongoClient: MongoDbClient) {}

  async init(): Promise<void> {
    await this.mongoClient.connect();
    this.collection = this.mongoClient.getCollection<
      ProductDocument & Document
    >('products');
  }

  async save(data: ProductDocument): Promise<void> {
    await this.collection.replaceOne({ id: data.id }, data, { upsert: true });
  }

  async delete(id: string): Promise<void> {
    await this.collection.deleteOne({ id });
  }
}
