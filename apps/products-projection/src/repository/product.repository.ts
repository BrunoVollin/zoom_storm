import { MongoDbClient } from '../config/mongodb';

export class ProductRepository {
  private collection: any;

  constructor(private mongoClient: MongoDbClient) {}

  async init() {
    await this.mongoClient.connect();
    this.collection = this.mongoClient.getCollection('products');
  }

  async save(
    productData: { id?: string } & Record<string, unknown>,
  ): Promise<void> {
    const filter = productData.id
      ? { id: productData.id }
      : { 'id.value': productData.id };

    await this.collection.replaceOne(filter, productData, { upsert: true });
  }
}
