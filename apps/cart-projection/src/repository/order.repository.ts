import { MongoDbClient } from 'apps/cart-projection/src/config/mongodb';

export class OrderRepository {
  private collection: any;

  constructor(private mongoClient: MongoDbClient) {}

  async init() {
    await this.mongoClient.connect();
    this.collection = this.mongoClient.getCollection('orders');
  }

  async save(
    orderData: { cartId: string; occurredAt: string } & Record<
      string,
      unknown
    >,
  ): Promise<void> {
    await this.collection.replaceOne(
      { cartId: orderData.cartId, occurredAt: orderData.occurredAt },
      orderData,
      { upsert: true },
    );
  }
}
