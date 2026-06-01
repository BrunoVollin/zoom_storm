import { Transport } from '../../src/domain/entities/freight/Transport';
import { Product } from '../../src/domain/entities/product/Product';
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
    name: string;
    price: number;
    description: string;
    category: string;
    stock: number;
    transport: Transport;
  }>,
): Product {
  const defaults = {
    id: createIdFromString('product-1'),
    name: 'Bluza',
    price: 1000,
    description: 'Product description',
    category: 'Clothing',
    stock: 10,
    transport: createTransport(),
  };

  return new Product(
    overrides?.id ?? defaults.id,
    overrides?.name ?? defaults.name,
    overrides?.price ?? defaults.price,
    overrides?.description ?? defaults.description,
    overrides?.category ?? defaults.category,
    overrides?.stock ?? defaults.stock,
    overrides?.transport ?? defaults.transport,
  );
}