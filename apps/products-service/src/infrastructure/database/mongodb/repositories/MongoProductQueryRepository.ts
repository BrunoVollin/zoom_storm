import {
  ProductDTO,
  ProductQueryRepository,
} from '../../../../domain/repositories/ProductQueryRepository';
import { mongoClient } from '../mongodb-connection';

export class MongoProductQueryRepository implements ProductQueryRepository {
  async findAll(): Promise<ProductDTO[]> {
    const collection = mongoClient.getCollection('products');
    const docs = await collection.find({}).toArray();

    return docs.map(({ _id, ...productData }: any) => productData);
  }

  async findById(id: string): Promise<ProductDTO | null> {
    const collection = mongoClient.getCollection('products');
    const doc = await collection.findOne({ id } as any);

    if (!doc) return null;

    const { _id, ...productData } = doc as any;

    return productData;
  }
}
