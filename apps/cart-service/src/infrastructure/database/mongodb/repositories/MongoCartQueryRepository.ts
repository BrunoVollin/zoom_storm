import { CartDTO, CartQueryRepository } from '../../../../domain/repositories/CartQueryRepository';
import { IdType } from '../../../../domain/shared/IdType';
import { mongoClient } from '../mongodb-connection';

export class MongoCartQueryRepository implements CartQueryRepository {
  async findById(id: IdType): Promise<CartDTO | null> {
    const collection = mongoClient.getCollection('cart');
    const doc = await collection.findOne({ id: id.toString() } as any);

    if (!doc) return null;

    const { _id, ...cartData } = doc as any;

    return cartData;
  }
}
