import { Product } from '../../../../domain/entities/product/Product';
import { Transport } from '../../../../domain/entities/freight/Transport';
import { IdType } from '../../../../domain/shared/IdType';
import { ProductRepository } from '../../../../domain/repositories/ProductRepository';
import { mongoClient } from '../mongodb-connection';

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

function toDomain(doc: ProductDocument): Product {
  return new Product(
    IdType.create(doc.id),
    doc.name,
    doc.price,
    doc.description,
    doc.category,
    doc.stock,
    new Transport(doc.transportHeight, doc.transportWidth, doc.transportLength),
  );
}

export class MongoProductRepository implements ProductRepository {
  private get collection() {
    return mongoClient.getCollection<ProductDocument & Document>('products');
  }

  async findById(id: IdType): Promise<Product | null> {
    const doc = await this.collection.findOne({ id: id.toString() });
    if (!doc) return null;

    return toDomain(doc as unknown as ProductDocument);
  }

  async findByIds(ids: Array<IdType>): Promise<Array<Product>> {
    const idStrings = ids.map((id) => id.toString());
    const docs = await this.collection
      .find({ id: { $in: idStrings } })
      .toArray();

    return docs.map((doc) => toDomain(doc as unknown as ProductDocument));
  }

  async save(_product: Product): Promise<void> {}
}
