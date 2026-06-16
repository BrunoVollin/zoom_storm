import { Product } from '../../../../domain/entities/Product';
import { ProductRepository } from '../../../../domain/repositories/ProductRepository';
import { IdType } from '../../../../domain/shared/IdType';
import { DomainEvent } from '../../../../domain/events/DomainEvent';
import { prisma } from '../prisma-connection';
import { Prisma } from '../../../../generated/prisma/client';

export class PrismaProductRepository implements ProductRepository {
  private prisma;

  constructor() {
    this.prisma = prisma;
  }

  async save(product: Product, event?: DomainEvent): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.product.upsert({
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
          weight: product.weight,
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
          weight: product.weight,
        },
      });

      if (event) {
        await tx.outboxEvent.create({
          data: {
            eventType: event.name,
            payload: event.payload as Prisma.InputJsonValue,
            occurredAt: event.occurredAt,
          },
        });
      }
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
      p.weight,
    );
  }

  async delete(id: IdType, event?: DomainEvent): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.product.delete({ where: { id: id.toString() } });

      if (event) {
        await tx.outboxEvent.create({
          data: {
            eventType: event.name,
            payload: event.payload as Prisma.InputJsonValue,
            occurredAt: event.occurredAt,
          },
        });
      }
    });
  }
}
