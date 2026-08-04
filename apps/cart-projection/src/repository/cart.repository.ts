import { Collection, Document } from 'mongodb';
import { MongoDbClient } from 'apps/cart-projection/src/config/mongodb';

export class CartRepository {
  private collection!: Collection<Document>;

  constructor(private mongoClient: MongoDbClient) {}

  async init() {
    await this.mongoClient.connect();
    this.collection = this.mongoClient.getCollection<Document>('cart');
  }

  async save(
    cartData: { id: string } & Record<string, unknown>,
  ): Promise<void> {
    await this.collection.replaceOne({ id: cartData.id }, cartData, {
      upsert: true,
    });
  }
}
