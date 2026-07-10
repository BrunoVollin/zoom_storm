import { MongoDbClient } from '../config/mongodb';

export class ProductRepository {
  private collection: any;

  constructor(private mongoClient: MongoDbClient) {}

  async init() {
    await this.mongoClient.connect();
    this.collection = this.mongoClient.getCollection('products');
  }

  async save(
    productData: { id: string } & Record<string, unknown>,
  ): Promise<void> {
    await this.collection.replaceOne({ id: productData.id }, productData, {
      upsert: true,
    });
  }

  async delete(id: string): Promise<void> {
    await this.collection.deleteOne({ id });
  }
}
