import {
  ProductDTO,
  ProductQueryRepository,
} from '../../../../domain/repositories/ProductQueryRepository';
import { mongoClient } from '../mongodb-connection';

export class MongoProductQueryRepository implements ProductQueryRepository {
  async findAll(): Promise<ProductDTO[]> {
    const collection = mongoClient.getCollection('products');
    const docs = await collection.find({}).toArray();

    return docs.map(({ _id, ...productData }) => productData);
  }

  async findById(id: string): Promise<ProductDTO | null> {
    const collection = mongoClient.getCollection('products');
    const doc = await collection.findOne({ id });

    if (!doc) return null;

    const { _id, ...productData } = doc;

    return productData;
  }
}
