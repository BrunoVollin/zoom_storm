import { Product } from '../../../../products-service/src/domain/entities/Product';
import { IdType } from '../../../../products-service/src/domain/shared/IdType';
import { ProductRepository } from '../../../../products-service/src/domain/repositories/ProductRepository';
import {
  ProductDTO,
  ProductQueryRepository,
} from '../../../../products-service/src/domain/repositories/ProductQueryRepository';
import { ProductMapper } from '../../../../products-service/src/application/mappers/ProductMapper';
import { ReviewEligibility } from '../../../../products-service/src/domain/entities/ReviewEligibility';
import { ReviewEligibilityRepository } from '../../../../products-service/src/domain/repositories/ReviewEligibilityRepository';

/**
 * Shared backing store for the products-service write repository
 * (PrismaProductRepository in production) and the read/query repository
 * (MongoProductQueryRepository in production, populated asynchronously via
 * Kafka + the products-projection service).
 *
 * Tests share a single instance between both repositories so the read model
 * reflects writes synchronously, without depending on Kafka/projections.
 */
export class InMemoryProductStore {
  private readonly products = new Map<string, Product>();

  set(product: Product): void {
    this.products.set(product.getId().toString(), product);
  }

  get(id: string): Product | null {
    return this.products.get(id) ?? null;
  }

  /** Finds the product owning the given variant id, mirroring how
   * cart-products-projection denormalizes one Mongo document per variant. */
  getByVariantId(variantId: string): Product | null {
    return (
      this.getAll().find(
        (product) =>
          !product.isDeleted &&
          product.variants.some(
            (variant) => variant.id.toString() === variantId,
          ),
      ) ?? null
    );
  }

  delete(id: string): void {
    this.products.delete(id);
  }

  getAll(): Product[] {
    return Array.from(this.products.values());
  }

  clear(): void {
    this.products.clear();
  }
}

export class InMemoryProductRepository implements ProductRepository {
  constructor(private readonly store: InMemoryProductStore) {}

  async save(product: Product): Promise<void> {
    this.store.set(product);
  }

  async findById(id: IdType): Promise<Product | null> {
    const product = this.store.get(id.toString());
    return product?.isDeleted ? null : product;
  }

  async delete(id: IdType): Promise<void> {
    this.store.delete(id.toString());
  }
}

export class InMemoryProductQueryRepository implements ProductQueryRepository {
  constructor(private readonly store: InMemoryProductStore) {}

  async findAll(): Promise<ProductDTO[]> {
    return this.store
      .getAll()
      .filter((product) => !product.isDeleted)
      .map((product) => ProductMapper.toPrimitives(product));
  }

  async findById(id: string): Promise<ProductDTO | null> {
    const product = this.store.get(id);

    return product && !product.isDeleted
      ? ProductMapper.toPrimitives(product)
      : null;
  }

  async findDistinctCategories(): Promise<string[]> {
    return [
      ...new Set(
        this.store
          .getAll()
          .filter((product) => !product.isDeleted)
          .map((product) => product.category),
      ),
    ];
  }
}

export class InMemoryReviewEligibilityRepository implements ReviewEligibilityRepository {
  private readonly eligibilities = new Map<string, ReviewEligibility>();

  async saveIfAbsent(eligibility: ReviewEligibility): Promise<boolean> {
    if (this.eligibilities.has(eligibility.naturalKey)) return false;
    this.eligibilities.set(eligibility.naturalKey, eligibility);
    return true;
  }

  async findByUserOrderProduct(
    userId: IdType,
    orderId: IdType,
    productId: IdType,
  ): Promise<ReviewEligibility | null> {
    return (
      this.eligibilities.get(
        `${userId.toString()}:${orderId.toString()}:${productId.toString()}`,
      ) ?? null
    );
  }
}
