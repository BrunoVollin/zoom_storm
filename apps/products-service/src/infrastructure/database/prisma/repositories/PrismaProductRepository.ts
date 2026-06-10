import { Product } from '../../../../domain/entities/Product';
import { ProductRepository } from '../../../../domain/repositories/ProductRepository';
import { IdType } from '../../../../domain/shared/IdType';
import { prisma } from '../prisma-connection';

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
        transportHeight: product.transportHeight,
        transportWidth: product.transportWidth,
        transportLength: product.transportLength,
      },
      update: {
        name: product.name,
        price: product.price,
        description: product.description,
        category: product.category,
        stock: product.stock,
        transportHeight: product.transportHeight,
        transportWidth: product.transportWidth,
        transportLength: product.transportLength,
      },
    });
  }

  async findById(id: IdType): Promise<Product | null> {
    const p = await this.prisma.product.findUnique({
      where: { id: id.toString() },
    });
    if (!p) return null;

    return new Product(
      IdType.create(p.id),
      p.name,
      p.price,
      p.description,
      p.category,
      p.stock,
      p.transportHeight,
      p.transportWidth,
      p.transportLength,
    );
  }

  async delete(id: IdType): Promise<void> {
    await this.prisma.product.delete({ where: { id: id.toString() } });
  }
}
