import { z } from 'zod';
import { OutputUseCase, Status } from '@application/contracts/UseCase';
import { CouponType } from '@domain/entities/coupon/Coupon';
import type { Context } from 'hono';

const ProductInputSchema = z.object({
  id: z.string().min(1),
  quantity: z.int().min(1),
});

export const CreateCartSchema = z.object({
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
  cep: z.string().min(1).optional(),
});

const couponAmountFields = {
  name: z.string().min(1),
  type: z.enum(CouponType),
  start: z.coerce.date(),
  end: z.coerce.date(),
  percent: z.number().min(0).max(1).optional(),
  amount: z.int().min(1).optional(),
};

export const CreateCouponSchema = z.object(couponAmountFields).refine(
  (data) =>
    data.type === CouponType.PERCENT
      ? data.percent !== undefined
      : data.amount !== undefined,
  {
    message:
      'percent is required for PERCENT coupons and amount is required for FIXED coupons',
  },
);

export const UpdateCouponSchema = CreateCouponSchema;

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

export function httpStatus(
  result: OutputUseCase,
  successStatus: 200 | 201 = 200,
): 200 | 201 | 409 | 422 {
  if (result.status === Status.SUCCESS) return successStatus;

  return result.code === 'CONCURRENCY_CONFLICT' ? 409 : 422;
}
