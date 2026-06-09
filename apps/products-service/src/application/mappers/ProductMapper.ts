import { Product } from '../../domain/entities/Product';

export class ProductMapper {
  static toPrimitives(product: Product) {
    return {
      id: product.id.toString(),
      name: product.name,
      price: product.price,
      description: product.description,
      category: product.category,
      stock: product.stock,
      transportHeight: product.transportHeight,
      transportWidth: product.transportWidth,
      transportLength: product.transportLength,
    };
  }
}

export type ProductPrimitives = ReturnType<typeof ProductMapper.toPrimitives>;
