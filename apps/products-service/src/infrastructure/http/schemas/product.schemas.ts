import { z } from 'zod';
import { Status } from '../../../application/contracts/UseCase';
import type { Context } from 'hono';

const VariantSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1).optional(),
  price: z.number().min(0),
  stock: z.int().min(0),
  isDefault: z.boolean().optional(),
});

const catalogFields = {
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  transportHeight: z.int().min(0),
  transportWidth: z.int().min(0),
  transportLength: z.int().min(0),
  weight: z.number().min(0),
  brand: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).optional(),
  images: z.array(z.string().min(1)).optional(),
  thumbnail: z.string().min(1).optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  depth: z.number().min(0).optional(),
  warrantyInformation: z.string().min(1).optional(),
  shippingInformation: z.string().min(1).optional(),
  availabilityStatus: z.string().min(1).optional(),
  returnPolicy: z.string().min(1).optional(),
  minimumOrderQuantity: z.int().min(1).optional(),
  barcode: z.string().min(1).optional(),
  qrCode: z.string().min(1).optional(),
};

export const CreateProductSchema = z.object({
  ...catalogFields,
  variants: z.array(VariantSchema).min(1),
});

export const ListProductsQuerySchema = z.object({
  category: z.string().min(1).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  search: z.string().min(1).optional(),
  sortBy: z.enum(['price', 'name']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const UpdateProductSchema = z.object(catalogFields);

export const CreateReviewSchema = z.object({
  rating: z.int().min(1).max(5),
  comment: z.string().min(1),
  reviewerName: z.string().min(1),
  reviewerEmail: z.string().email(),
});

export const CreateProductVariantSchema = VariantSchema;

export const UpdateProductVariantSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().min(0),
  stock: z.int().min(0),
  isDefault: z.boolean().optional(),
});

export function validate<T>(
  schema: z.ZodType<T>,
  data: unknown,
): { data: T } | { error: string } {
  const result = schema.safeParse(data);

  if (!result.success) {
    const message = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');

    return { error: message };
  }

  return { data: result.data };
}

export function validationError(c: Context, message: string) {
  return c.json({ status: Status.ERROR, message }, 400);
}
