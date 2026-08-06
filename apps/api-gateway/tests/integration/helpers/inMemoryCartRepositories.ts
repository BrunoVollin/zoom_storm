import { Cart } from '@domain/entities/cart/Cart';
import { ProductVariant as CartProductVariant } from '@domain/entities/product/ProductVariant';
import { Transport } from '@domain/entities/freight/Transport';
import { IdType } from '@domain/shared/IdType';
import { CartRepository } from '@domain/repositories/CartRepository';
import {
  CartDTO,
  CartQueryRepository,
} from '@domain/repositories/CartQueryRepository';
import { ProductRepository as CartProductRepository } from '@domain/repositories/ProductRepository';
import { CartMapper } from '@application/mappers/CartMapper';
import { Product as ProductsServiceProduct } from '../../../../products-service/src/domain/entities/Product';
import { InMemoryProductStore } from './inMemoryProductStore';

/**
 * In-memory replacement for PrismaCartRepository (the write/source-of-truth
 * side of the cart). Cart entities are kept by reference, mirroring the
 * persist/reload cycle of a real repository.
 */
export class InMemoryCartRepository implements CartRepository {
  private readonly carts = new Map<string, Cart>();

  async save(cart: Cart): Promise<void> {
    this.carts.set(cart.getId().toString(), cart);
  }

  async findById(id: IdType): Promise<Cart | null> {
    return this.carts.get(id.toString()) ?? null;
  }
}

/**
 * In-memory replacement for MongoCartQueryRepository (the read model
 * normally populated asynchronously by the cart-projection service).
 * Derives the read model directly from the write-side repository so the
 * data is always consistent without waiting on Kafka.
 */
export class InMemoryCartQueryRepository implements CartQueryRepository {
  constructor(private readonly cartRepository: InMemoryCartRepository) {}

  async findById(id: IdType): Promise<CartDTO | null> {
    const cart = await this.cartRepository.findById(id);

    return cart ? CartMapper.toPrimitives(cart) : null;
  }
}

/**
 * In-memory replacement for cart-service's MongoProductRepository (the
 * read-only product-variant catalog snapshot normally populated
 * asynchronously by the cart-products-projection service — one document per
 * variant, denormalized with its parent product's display/freight data).
 * Backed by the same product store used by the products-service test
 * instance.
 */
export class InMemoryCartProductRepository implements CartProductRepository {
  constructor(private readonly store: InMemoryProductStore) {}

  async findById(id: IdType): Promise<CartProductVariant | null> {
    const product = this.store.getByVariantId(id.toString());

    return product ? toCartVariant(product, id.toString()) : null;
  }

  async findByIds(ids: IdType[]): Promise<CartProductVariant[]> {
    const variants: CartProductVariant[] = [];

    for (const id of ids) {
      const variant = await this.findById(id);
      if (variant) variants.push(variant);
    }

    return variants;
  }

  async findByProductId(productId: IdType): Promise<CartProductVariant | null> {
    const product = this.store.get(productId.toString());
    if (!product) return null;

    const [firstVariant] = product.variants;
    if (!firstVariant) return null;

    return toCartVariant(product, firstVariant.id.toString());
  }
}

function toCartVariant(
  product: ProductsServiceProduct,
  variantId: string,
): CartProductVariant | null {
  const variant = product.variants.find((v) => v.id.toString() === variantId);
  if (!variant) return null;

  return new CartProductVariant(
    IdType.create(variant.id.toString()),
    IdType.create(product.getId().toString()),
    product.name,
    product.description,
    product.category,
    variant.sku,
    variant.name,
    variant.price,
    variant.stock,
    new Transport(
      product.transportHeight,
      product.transportWidth,
      product.transportLength,
    ),
    product.weight,
  );
}
