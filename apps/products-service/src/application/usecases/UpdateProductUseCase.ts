import { Product } from '../../domain/entities/Product';
import { IdType } from '../../domain/shared/IdType';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { DomainEvent, DomainEventName } from '../../domain/events/DomainEvent';
import { UseCase, Status } from '../contracts/UseCase';
import { ProductMapper, ProductPrimitives } from '../mappers/ProductMapper';

interface Input {
  id: string;
  name: string;
  description: string;
  category: string;
  transportHeight: number;
  transportWidth: number;
  transportLength: number;
  weight: number;
  brand?: string;
  tags?: string[];
  images?: string[];
  thumbnail?: string;
  discountPercentage?: number;
  width?: number;
  height?: number;
  depth?: number;
  warrantyInformation?: string;
  shippingInformation?: string;
  availabilityStatus?: string;
  returnPolicy?: string;
  minimumOrderQuantity?: number;
  barcode?: string;
  qrCode?: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  product: ProductPrimitives;
}

interface ErrorOutput {
  status: Status.ERROR;
  message: string;
}

type Output = SuccessOutput | ErrorOutput;

export class UpdateProductUseCase implements UseCase<Input, Output> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: Input): Promise<Output> {
    const existing = await this.productRepository.findById(
      IdType.create(input.id),
    );
    if (!existing) {
      return { status: Status.ERROR, message: 'Product not found' };
    }

    const updated = new Product({
      id: existing.getId(),
      name: input.name,
      description: input.description,
      category: input.category,
      transportHeight: input.transportHeight,
      transportWidth: input.transportWidth,
      transportLength: input.transportLength,
      weight: input.weight,
      brand: input.brand,
      tags: input.tags,
      images: input.images,
      thumbnail: input.thumbnail,
      discountPercentage: input.discountPercentage,
      rating: existing.rating,
      width: input.width,
      height: input.height,
      depth: input.depth,
      warrantyInformation: input.warrantyInformation,
      shippingInformation: input.shippingInformation,
      availabilityStatus: input.availabilityStatus,
      returnPolicy: input.returnPolicy,
      minimumOrderQuantity: input.minimumOrderQuantity,
      barcode: input.barcode,
      qrCode: input.qrCode,
      createdAt: existing.createdAt,
      variants: existing.variants,
      reviews: existing.reviews,
    });

    const event = new DomainEvent(
      DomainEventName.PRODUCT_UPDATED,
      ProductMapper.toPrimitives(updated),
      new Date(),
    );

    await this.productRepository.save(updated, event);

    return {
      status: Status.SUCCESS,
      product: ProductMapper.toPrimitives(updated),
    };
  }
}
