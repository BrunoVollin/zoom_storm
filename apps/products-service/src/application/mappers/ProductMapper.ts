import { Product } from '../../domain/entities/Product';
import { ProductVariant } from '../../domain/entities/ProductVariant';
import { ProductReview } from '../../domain/entities/ProductReview';

export class ProductMapper {
  static variantToPrimitives(variant: ProductVariant) {
    return {
      id: variant.id.toString(),
      sku: variant.sku,
      name: variant.name,
      price: variant.price,
      stock: variant.stock,
      isDefault: variant.isDefault,
    };
  }

  static reviewToPrimitives(review: ProductReview) {
    return {
      id: review.id.toString(),
      rating: review.rating,
      comment: review.comment,
      reviewerName: review.reviewerName,
      reviewerEmail: review.reviewerEmail,
      date: review.createdAt,
    };
  }

  static toPrimitives(product: Product) {
    return {
      id: product.id.toString(),
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
      dimensions: {
        width: product.width,
        height: product.height,
        depth: product.depth,
      },
      warrantyInformation: product.warrantyInformation,
      shippingInformation: product.shippingInformation,
      availabilityStatus: product.availabilityStatus,
      returnPolicy: product.returnPolicy,
      minimumOrderQuantity: product.minimumOrderQuantity,
      meta: {
        barcode: product.barcode,
        qrCode: product.qrCode,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
      variants: product.variants.map(ProductMapper.variantToPrimitives),
      reviews: product.reviews.map(ProductMapper.reviewToPrimitives),
    };
  }
}

export type ProductPrimitives = ReturnType<typeof ProductMapper.toPrimitives>;
