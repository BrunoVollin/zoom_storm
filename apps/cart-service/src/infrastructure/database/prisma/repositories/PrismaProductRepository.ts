import { Product } from '../../../../domain/entities/product/Product';
import { Transport } from '../../../../domain/entities/freight/Transport';
import { IdType } from '../../../../domain/shared/IdType';
import { ProductRepository } from '../../../../domain/repositories/ProductRepository';
import { prisma } from '../prisma-connection';

interface ProductRow {
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

function toDomainProduct(p: ProductRow): Product {
  return new Product(
    IdType.create(p.id),
    p.name,
    p.price,
    p.description,
    p.category,
    p.stock,
    new Transport(p.transportHeight, p.transportWidth, p.transportLength),
  );
}

export class PrismaProductRepository implements ProductRepository {
  private prisma;

  constructor() {
    this.prisma = prisma;
  }

  async save(product: Product): Promise<void> {
    await this.prisma.product.upsert({
      where: { id: product.getId().toString() },
      create: {
        id: product.getId().toString(),
        name: product.name,
        price: product.price,
        description: product.description,
        category: product.category,
        stock: product.stock,
        transportHeight: product.transport.height,
        transportWidth: product.transport.width,
        transportLength: product.transport.length,
      },
      update: {
        name: product.name,
        price: product.price,
        description: product.description,
        category: product.category,
        stock: product.stock,
        transportHeight: product.transport.height,
        transportWidth: product.transport.width,
        transportLength: product.transport.length,
      },
    });
  }

  async findById(id: IdType): Promise<Product | null> {
    const p = await this.prisma.product.findUnique({
      where: { id: id.toString() },
    });
    if (!p) return null;

    return toDomainProduct(p as ProductRow);
  }

  async findByIds(ids: Array<IdType>): Promise<Array<Product>> {
    const idsStr = ids.map((i) => i.toString());
    const rows = await this.prisma.product.findMany({
      where: { id: { in: idsStr } },
    });

    return rows.map((r: ProductRow) => toDomainProduct(r));
  }
}
