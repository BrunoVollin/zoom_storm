import { ProductVariant } from '../../../../domain/entities/product/ProductVariant';
import { Transport } from '../../../../domain/entities/freight/Transport';
import { IdType } from '../../../../domain/shared/IdType';
import { ProductRepository } from '../../../../domain/repositories/ProductRepository';
import { mongoClient } from '../mongodb-connection';

// One document per variant — see cart-products-projection's ProductRepository,
// which denormalizes the parent product's display/freight data onto every
// variant document.
interface VariantDocument {
  id: string;
  productId: string;
  productName: string;
  productDescription: string;
  productCategory: string;
  sku: string;
  name: string | null;
  price: number;
  stock: number;
  weight: number;
  transportHeight: number;
  transportWidth: number;
  transportLength: number;
}

function toDomain(doc: VariantDocument): ProductVariant {
  return new ProductVariant(
    IdType.create(doc.id),
    IdType.create(doc.productId),
    doc.productName,
    doc.productDescription,
    doc.productCategory,
    doc.sku,
    doc.name,
    doc.price,
    doc.stock,
    new Transport(doc.transportHeight, doc.transportWidth, doc.transportLength),
    doc.weight ?? 0,
  );
}

export class MongoProductRepository implements ProductRepository {
  private get collection() {
    return mongoClient.getCollection<VariantDocument & Document>('products');
  }

  async findById(id: IdType): Promise<ProductVariant | null> {
    const doc = await this.collection.findOne({ id: id.toString() });
    if (!doc) return null;

    return toDomain(doc as unknown as VariantDocument);
  }

  async findByIds(ids: Array<IdType>): Promise<Array<ProductVariant>> {
    const idStrings = ids.map((id) => id.toString());
    const docs = await this.collection
      .find({ id: { $in: idStrings } })
      .toArray();

    return docs.map((doc) => toDomain(doc as unknown as VariantDocument));
  }
}
