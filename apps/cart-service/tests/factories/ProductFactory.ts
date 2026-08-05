import { Transport } from '../../src/domain/entities/freight/Transport';
import { ProductVariant } from '../../src/domain/entities/product/ProductVariant';
import { IdType } from '../../src/domain/shared/IdType';
import { createIdFromString } from './IdFactory';

export function createTransport(
  width: number = 10,
  height: number = 10,
  length: number = 10,
): Transport {
  return new Transport(width, height, length);
}

export function createProduct(
  overrides?: Partial<{
    id: IdType;
    productId: IdType;
    name: string;
    price: number;
    description: string;
    category: string;
    sku: string;
    stock: number;
    transport: Transport;
    weight: number;
  }>,
): ProductVariant {
  const defaults = {
    id: createIdFromString('variant-1'),
    productId: createIdFromString('product-1'),
    name: 'Bluza',
    price: 1000,
    description: 'Product description',
    category: 'Clothing',
    sku: 'SKU-1',
    stock: 10,
    transport: createTransport(),
    weight: 1,
  };

  return new ProductVariant(
    overrides?.id ?? defaults.id,
    overrides?.productId ?? defaults.productId,
    overrides?.name ?? defaults.name,
    overrides?.description ?? defaults.description,
    overrides?.category ?? defaults.category,
    overrides?.sku ?? defaults.sku,
    null,
    overrides?.price ?? defaults.price,
    overrides?.stock ?? defaults.stock,
    overrides?.transport ?? defaults.transport,
    overrides?.weight ?? defaults.weight,
  );
}
