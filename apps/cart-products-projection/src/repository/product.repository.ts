import { Collection } from 'mongodb';
import { MongoDbClient } from '../config/mongodb';

interface VariantInput {
  id: string;
  sku: string;
  name: string | null;
  price: number;
  stock: number;
  isDefault: boolean;
}

interface ProductEventPayload {
  id: string;
  name: string;
  description: string;
  category: string;
  transportHeight: number;
  transportWidth: number;
  transportLength: number;
  weight: number;
  variants: VariantInput[];
}

// Each Mongo document here represents a variant, denormalized with its
// parent product's display/freight data — cart-service's own
// MongoProductRepository resolves cart items by variantId, so this is the
// document shape it reads.
interface ProductDocument {
  id: string; // = variantId
  productId: string;
  productName: string;
  productDescription: string;
  productCategory: string;
  sku: string;
  name: string | null;
  price: number;
  stock: number;
  isDefault: boolean;
  transportHeight: number;
  transportWidth: number;
  transportLength: number;
  weight: number;
}

export class ProductRepository {
  private collection!: Collection<ProductDocument>;

  constructor(private readonly mongoClient: MongoDbClient) {}

  async init(): Promise<void> {
    await this.mongoClient.connect();
    this.collection =
      this.mongoClient.getCollection<ProductDocument>('products');
  }

  async save(data: ProductEventPayload): Promise<void> {
    const variants = data.variants ?? [];

    for (const variant of variants) {
      const document: ProductDocument = {
        id: variant.id,
        productId: data.id,
        productName: data.name,
        productDescription: data.description,
        productCategory: data.category,
        sku: variant.sku,
        name: variant.name,
        price: variant.price,
        stock: variant.stock,
        isDefault: variant.isDefault,
        transportHeight: data.transportHeight,
        transportWidth: data.transportWidth,
        transportLength: data.transportLength,
        weight: data.weight ?? 0,
      };

      await this.collection.replaceOne({ id: document.id }, document, {
        upsert: true,
      });
    }

    // Prune variants that were removed from the product since the last event.
    const currentVariantIds = variants.map((v) => v.id);
    await this.collection.deleteMany({
      productId: data.id,
      id: { $nin: currentVariantIds },
    });
  }

  async delete(productId: string): Promise<void> {
    await this.collection.deleteMany({ productId });
  }
}
