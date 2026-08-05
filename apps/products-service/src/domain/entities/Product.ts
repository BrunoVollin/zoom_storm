import { IdType } from '../shared/IdType';
import { ProductVariant } from './ProductVariant';
import { ProductReview } from './ProductReview';

export interface ProductProps {
  id: IdType;
  name: string;
  description: string;
  category: string;
  transportHeight: number;
  transportWidth: number;
  transportLength: number;
  weight: number;
  brand?: string | null;
  tags?: string[];
  images?: string[];
  thumbnail?: string | null;
  discountPercentage?: number | null;
  rating?: number | null;
  width?: number | null;
  height?: number | null;
  depth?: number | null;
  warrantyInformation?: string | null;
  shippingInformation?: string | null;
  availabilityStatus?: string | null;
  returnPolicy?: string | null;
  minimumOrderQuantity?: number;
  barcode?: string | null;
  qrCode?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  variants: ProductVariant[];
  reviews?: ProductReview[];
}

export class Product {
  readonly id: IdType;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly transportHeight: number;
  readonly transportWidth: number;
  readonly transportLength: number;
  readonly weight: number;
  readonly brand: string | null;
  readonly tags: string[];
  readonly images: string[];
  readonly thumbnail: string | null;
  readonly discountPercentage: number | null;
  readonly rating: number | null;
  readonly width: number | null;
  readonly height: number | null;
  readonly depth: number | null;
  readonly warrantyInformation: string | null;
  readonly shippingInformation: string | null;
  readonly availabilityStatus: string | null;
  readonly returnPolicy: string | null;
  readonly minimumOrderQuantity: number;
  readonly barcode: string | null;
  readonly qrCode: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly variants: ProductVariant[];
  readonly reviews: ProductReview[];

  constructor(props: ProductProps) {
    if (!props.variants || props.variants.length === 0) {
      throw new Error('Product must have at least one variant');
    }

    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.category = props.category;
    this.transportHeight = props.transportHeight;
    this.transportWidth = props.transportWidth;
    this.transportLength = props.transportLength;
    this.weight = props.weight;
    this.brand = props.brand ?? null;
    this.tags = props.tags ?? [];
    this.images = props.images ?? [];
    this.thumbnail = props.thumbnail ?? null;
    this.discountPercentage = props.discountPercentage ?? null;
    this.rating = props.rating ?? null;
    this.width = props.width ?? null;
    this.height = props.height ?? null;
    this.depth = props.depth ?? null;
    this.warrantyInformation = props.warrantyInformation ?? null;
    this.shippingInformation = props.shippingInformation ?? null;
    this.availabilityStatus = props.availabilityStatus ?? null;
    this.returnPolicy = props.returnPolicy ?? null;
    this.minimumOrderQuantity = props.minimumOrderQuantity ?? 1;
    this.barcode = props.barcode ?? null;
    this.qrCode = props.qrCode ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
    this.variants = props.variants;
    this.reviews = props.reviews ?? [];
  }

  getId(): IdType {
    return this.id;
  }

  getDefaultVariant(): ProductVariant {
    return this.variants.find((v) => v.isDefault) ?? this.variants[0];
  }
}
