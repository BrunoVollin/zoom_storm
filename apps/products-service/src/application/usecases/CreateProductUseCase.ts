import { Product } from '../../domain/entities/Product';
import { ProductVariant } from '../../domain/entities/ProductVariant';
import { IdType } from '../../domain/shared/IdType';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { DomainEvent, DomainEventName } from '../../domain/events/DomainEvent';
import { UseCase, Status } from '../contracts/UseCase';
import { ProductMapper, ProductPrimitives } from '../mappers/ProductMapper';

interface VariantInput {
  sku: string;
  name?: string;
  price: number;
  stock: number;
  isDefault?: boolean;
}

interface Input {
  name: string;
  description: string;
  category: string;
  transportHeight: number;
  transportWidth: number;
  transportLength: number;
  weight: number;
  variants: VariantInput[];
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

export class CreateProductUseCase implements UseCase<Input, Output> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: Input): Promise<Output> {
    if (!input.variants || input.variants.length === 0) {
      return { status: Status.ERROR, message: 'Product must have at least one variant' };
    }

    const productId = IdType.create();

    const variants = input.variants.map(
      (variant, index) =>
        new ProductVariant(
          IdType.create(),
          productId,
          variant.sku,
          variant.price,
          variant.stock,
          variant.name ?? null,
          variant.isDefault ?? index === 0,
        ),
    );

    const product = new Product({
      id: productId,
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
      variants,
    });

    const event = new DomainEvent(
      DomainEventName.PRODUCT_CREATED,
      ProductMapper.toPrimitives(product),
      new Date(),
    );

    await this.productRepository.save(product, event);

    return {
      status: Status.SUCCESS,
      product: ProductMapper.toPrimitives(product),
    };
  }
}
