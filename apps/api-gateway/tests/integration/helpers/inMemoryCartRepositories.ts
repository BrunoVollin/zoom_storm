import { Cart } from '@domain/entities/cart/Cart';
import { Product as CartProduct } from '@domain/entities/product/Product';
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
 * read-only product catalog snapshot normally populated asynchronously by
 * the cart-products-projection service). Backed by the same product store
 * used by the products-service test instance.
 */
export class InMemoryCartProductRepository implements CartProductRepository {
  constructor(private readonly store: InMemoryProductStore) {}

  async findById(id: IdType): Promise<CartProduct | null> {
    const record = this.store.get(id.toString());

    return record ? toCartProduct(record, id) : null;
  }

  async findByIds(ids: IdType[]): Promise<CartProduct[]> {
    const products: CartProduct[] = [];

    for (const id of ids) {
      const product = await this.findById(id);
      if (product) products.push(product);
    }

    return products;
  }
}

function toCartProduct(
  record: ProductsServiceProduct,
  id: IdType,
): CartProduct {
  return new CartProduct(
    IdType.create(id.toString()),
    record.name,
    record.price,
    record.description,
    record.category,
    record.stock,
    new Transport(
      record.transportHeight,
      record.transportWidth,
      record.transportLength,
    ),
    record.weight,
  );
}
