import { z } from 'zod';
import { Status } from '@application/contracts/UseCase';
import type { Context } from 'hono';

const ProductInputSchema = z.object({
  id: z.string().min(1),
  quantity: z.int().min(1),
});

export const CreateCartSchema = z.object({
  userId: z.string().min(1),
  products: z.array(ProductInputSchema).optional().default([]),
  coupons: z.array(z.string().min(1)).optional().default([]),
});

export const AddItemsSchema = z.object({
  products: z.array(ProductInputSchema).min(1),
});

export const UpdateQuantitySchema = z.object({
  quantity: z.int().min(1),
});

export const ApplyCouponSchema = z.object({
  couponId: z.string().min(1),
});

export const CheckoutSchema = z.object({
  shipping: z.int().min(0),
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
