export interface ProductVariant {
  id: string;
  sku: string;
  name: string | null;
  price: number;
  stock: number;
  isDefault: boolean;
}

export interface ProductReview {
  id: string;
  rating: number;
  comment: string;
  reviewerName: string;
  reviewerEmail: string;
  date: string;
}

export interface Product {
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
  dimensions: {
    width: number | null;
    height: number | null;
    depth: number | null;
  };
  warrantyInformation: string | null;
  shippingInformation: string | null;
  availabilityStatus: string | null;
  returnPolicy: string | null;
  minimumOrderQuantity: number;
  meta: {
    barcode: string | null;
    qrCode: string | null;
    createdAt: string;
    updatedAt: string;
  };
  variants: ProductVariant[];
  reviews: ProductReview[];
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: "price" | "name";
  sortOrder?: "asc" | "desc";
}

/** Returns the variant flagged as default, falling back to the first one —
 * every product has at least one variant. */
export function getDefaultVariant(product: Product): ProductVariant {
  const variant = product.variants.find((v) => v.isDefault) ?? product.variants[0];

  if (!variant) {
    throw new Error(`Product ${product.id} has no variants`);
  }

  return variant;
}

/** Payload shape expected by products-service's admin write endpoints
 * (POST/PUT /products) — price is in cents, entered by the admin form in
 * reais and converted by the caller before submitting. */
export interface ProductWriteInput {
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
  variants: Array<{
    sku: string;
    name?: string;
    price: number;
    stock: number;
    isDefault?: boolean;
  }>;
}
