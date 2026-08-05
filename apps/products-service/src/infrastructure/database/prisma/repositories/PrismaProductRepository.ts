import { Product } from '../../../../domain/entities/Product';
import { ProductVariant } from '../../../../domain/entities/ProductVariant';
import { ProductReview } from '../../../../domain/entities/ProductReview';
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
      const data = {
        name: product.name,
        description: product.description,
        category: product.category,
        transportHeight: product.transportHeight,
        transportWidth: product.transportWidth,
        transportLength: product.transportLength,
        weight: product.weight,
        brand: product.brand,
        tags: product.tags,
        images: product.images,
        thumbnail: product.thumbnail,
        discountPercentage: product.discountPercentage,
        rating: product.rating,
        width: product.width,
        height: product.height,
        depth: product.depth,
        warrantyInformation: product.warrantyInformation,
        shippingInformation: product.shippingInformation,
        availabilityStatus: product.availabilityStatus,
        returnPolicy: product.returnPolicy,
        minimumOrderQuantity: product.minimumOrderQuantity,
        barcode: product.barcode,
        qrCode: product.qrCode,
      };

      await tx.product.upsert({
        where: { id: product.getId().toString() },
        create: { id: product.getId().toString(), ...data },
        update: data,
      });

      for (const variant of product.variants) {
        await tx.productVariant.upsert({
          where: { id: variant.id.toString() },
          create: {
            id: variant.id.toString(),
            productId: product.getId().toString(),
            sku: variant.sku,
            name: variant.name,
            price: variant.price,
            stock: variant.stock,
            isDefault: variant.isDefault,
          },
          update: {
            sku: variant.sku,
            name: variant.name,
            price: variant.price,
            stock: variant.stock,
            isDefault: variant.isDefault,
          },
        });
      }

      const currentVariantIds = product.variants.map((v) => v.id.toString());
      await tx.productVariant.deleteMany({
        where: {
          productId: product.getId().toString(),
          id: { notIn: currentVariantIds },
        },
      });

      for (const review of product.reviews) {
        await tx.productReview.upsert({
          where: { id: review.id.toString() },
          create: {
            id: review.id.toString(),
            productId: product.getId().toString(),
            rating: review.rating,
            comment: review.comment,
            reviewerName: review.reviewerName,
            reviewerEmail: review.reviewerEmail,
          },
          update: {
            rating: review.rating,
            comment: review.comment,
          },
        });
      }

      const currentReviewIds = product.reviews.map((r) => r.id.toString());
      await tx.productReview.deleteMany({
        where: {
          productId: product.getId().toString(),
          id: { notIn: currentReviewIds },
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
      include: { variants: true, reviews: true },
    });
    if (!p) return null;

    return PrismaProductRepository.toDomain(p);
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

  static toDomain(p: {
    id: string;
    name: string;
    description: string;
    category: string;
    transportHeight: number;
    transportWidth: number;
    transportLength: number;
    weight: number;
    brand: string | null;
    tags: string[];
    images: string[];
    thumbnail: string | null;
    discountPercentage: number | null;
    rating: number | null;
    width: number | null;
    height: number | null;
    depth: number | null;
    warrantyInformation: string | null;
    shippingInformation: string | null;
    availabilityStatus: string | null;
    returnPolicy: string | null;
    minimumOrderQuantity: number;
    barcode: string | null;
    qrCode: string | null;
    createdAt: Date;
    updatedAt: Date;
    variants: Array<{
      id: string;
      productId: string;
      sku: string;
      name: string | null;
      price: number;
      stock: number;
      isDefault: boolean;
    }>;
    reviews: Array<{
      id: string;
      productId: string;
      rating: number;
      comment: string;
      reviewerName: string;
      reviewerEmail: string;
      createdAt: Date;
    }>;
  }): Product {
    return new Product({
      id: IdType.create(p.id),
      name: p.name,
      description: p.description,
      category: p.category,
      transportHeight: p.transportHeight,
      transportWidth: p.transportWidth,
      transportLength: p.transportLength,
      weight: p.weight,
      brand: p.brand,
      tags: p.tags,
      images: p.images,
      thumbnail: p.thumbnail,
      discountPercentage: p.discountPercentage,
      rating: p.rating,
      width: p.width,
      height: p.height,
      depth: p.depth,
      warrantyInformation: p.warrantyInformation,
      shippingInformation: p.shippingInformation,
      availabilityStatus: p.availabilityStatus,
      returnPolicy: p.returnPolicy,
      minimumOrderQuantity: p.minimumOrderQuantity,
      barcode: p.barcode,
      qrCode: p.qrCode,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      variants: p.variants.map(
        (v) =>
          new ProductVariant(
            IdType.create(v.id),
            IdType.create(v.productId),
            v.sku,
            v.price,
            v.stock,
            v.name,
            v.isDefault,
          ),
      ),
      reviews: p.reviews.map(
        (r) =>
          new ProductReview(
            IdType.create(r.id),
            IdType.create(r.productId),
            r.rating,
            r.comment,
            r.reviewerName,
            r.reviewerEmail,
            r.createdAt,
          ),
      ),
    });
  }
}
