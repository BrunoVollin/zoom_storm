import { Product } from '../../src/domain/entities/Product';
import { ProductVariant } from '../../src/domain/entities/ProductVariant';
import { IdType } from '../../src/domain/shared/IdType';

export function makeProduct(options?: {
  productId?: string;
  variantId?: string;
  stock?: number;
  reservedStock?: number;
  deletedAt?: Date | null;
}): Product {
  const productId = IdType.create(options?.productId ?? 'product-1');
  return new Product({
    id: productId,
    name: 'Game',
    description: 'Game description',
    category: 'Games',
    transportHeight: 1,
    transportWidth: 1,
    transportLength: 1,
    weight: 1,
    deletedAt: options?.deletedAt,
    variants: [
      new ProductVariant(
        IdType.create(options?.variantId ?? 'variant-1'),
        productId,
        'SKU-1',
        100,
        options?.stock ?? 10,
        null,
        true,
        options?.reservedStock ?? 0,
      ),
    ],
  });
}
