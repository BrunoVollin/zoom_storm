import { MongoDbClient } from 'apps/cart-projection/src/config/mongodb';

export class CartRepository {
  private collection: any;

  constructor(private mongoClient: MongoDbClient) {}

  async init() {
    await this.mongoClient.connect();
    this.collection = this.mongoClient.getCollection('cart');
  }

  async save(cartData: object): Promise<void> {
    await this.collection.insertOne(cartData);
  }
}
