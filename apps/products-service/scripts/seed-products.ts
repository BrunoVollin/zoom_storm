import '../src/config/env';
import { readFileSync } from 'fs';
import { join } from 'path';
import { prisma } from '../src/infrastructure/database/prisma/prisma-connection';
import { closeDatabaseConnections } from '../src/infrastructure/database/prisma/prisma-connection';
import { PrismaProductRepository } from '../src/infrastructure/database/prisma/repositories/PrismaProductRepository';
import { CreateProductUseCase } from '../src/application/usecases/CreateProductUseCase';
import { Status } from '../src/application/contracts/UseCase';
import { DomainEvent, DomainEventName } from '../src/domain/events/DomainEvent';
import { ProductMapper } from '../src/application/mappers/ProductMapper';
import { IdType } from '../src/domain/shared/IdType';

interface DummyJsonReview {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
  reviewerEmail: string;
}

interface DummyJsonProduct {
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand?: string;
  sku: string;
  weight: number;
  dimensions: { width: number; height: number; depth: number };
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  reviews: DummyJsonReview[];
  returnPolicy: string;
  minimumOrderQuantity: number;
  meta: { barcode: string; qrCode: string };
  images: string[];
  thumbnail: string;
}

// The file has a stray trailing character after the closing brace — trim
// back to the last "}" before parsing instead of failing outright.
function readDummyJsonProducts(): DummyJsonProduct[] {
  const raw = readFileSync(join(__dirname, '../../../products.json'), 'utf-8');
  const lastBrace = raw.lastIndexOf('}');
  const parsed = JSON.parse(raw.slice(0, lastBrace + 1));

  return parsed.products;
}

async function main() {
  const existing = await prisma.product.count();

  if (existing > 0) {
    console.log(
      `[seed] ${existing} produto(s) já cadastrado(s), pulando seed.`,
    );

    return;
  }

  const productRepository = new PrismaProductRepository();
  const createProduct = new CreateProductUseCase(productRepository);
  const items = readDummyJsonProducts();

  for (const item of items) {
    const result = await createProduct.execute({
      name: item.title,
      description: item.description,
      category: item.category,
      // DummyJSON has no shipping-package dimensions — approximate with the
      // product's own display dimensions, rounded up to whole centimeters.
      transportHeight: Math.ceil(item.dimensions.height),
      transportWidth: Math.ceil(item.dimensions.width),
      transportLength: Math.ceil(item.dimensions.depth),
      weight: item.weight,
      brand: item.brand,
      tags: item.tags,
      images: item.images,
      thumbnail: item.thumbnail,
      discountPercentage: item.discountPercentage,
      width: item.dimensions.width,
      height: item.dimensions.height,
      depth: item.dimensions.depth,
      warrantyInformation: item.warrantyInformation,
      shippingInformation: item.shippingInformation,
      availabilityStatus: item.availabilityStatus,
      returnPolicy: item.returnPolicy,
      minimumOrderQuantity: item.minimumOrderQuantity,
      barcode: item.meta?.barcode,
      qrCode: item.meta?.qrCode,
      // Prices flow through the rest of the system as integer cents (see
      // apps/web's ProductForm, which multiplies reais by 100 before
      // sending) — DummyJSON gives decimal dollars, so convert here.
      variants: [
        {
          sku: item.sku,
          price: Math.round(item.price * 100),
          stock: item.stock,
          isDefault: true,
        },
      ],
    });

    if (result.status === Status.ERROR) {
      console.error(`[seed] falha ao criar "${item.title}": ${result.message}`);
      continue;
    }

    if (item.reviews?.length) {
      await prisma.productReview.createMany({
        data: item.reviews.map((review) => ({
          id: IdType.create().toString(),
          productId: result.product.id,
          rating: review.rating,
          comment: review.comment,
          reviewerName: review.reviewerName,
          reviewerEmail: review.reviewerEmail,
          createdAt: new Date(review.date),
        })),
      });

      // Re-emit product.updated with the reviews attached so the read-model
      // projections (products-projection, cart-products-projection) pick
      // them up — CreateProductUseCase's own event predates the reviews
      // insert above.
      const withReviews = await productRepository.findById(
        IdType.create(result.product.id),
      );
      if (withReviews) {
        const event = new DomainEvent(
          DomainEventName.PRODUCT_UPDATED,
          ProductMapper.toPrimitives(withReviews),
          new Date(),
        );
        await productRepository.save(withReviews, event);
      }
    }

    console.log(`[seed] produto criado: ${item.title}`);
  }

  console.log(`[seed] ${items.length} produto(s) importado(s) de products.json.`);
}

main()
  .catch((error) => {
    console.error('[seed] erro ao popular produtos:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabaseConnections();
  });
