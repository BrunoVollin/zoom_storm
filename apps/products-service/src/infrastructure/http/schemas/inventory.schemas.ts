import type { Context } from 'hono';
import { z } from 'zod';
import { Status } from '../../../application/contracts/UseCase';

export const ReserveInventorySchema = z.object({
  orderId: z.string().trim().min(1),
  lines: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        quantity: z.int().positive(),
        expectedUnitPrice: z.number().nonnegative(),
      }),
    )
    .min(1),
});

export function validateInventoryInput<T>(
  schema: z.ZodType<T>,
  data: unknown,
): { data: T } | { error: string } {
  const result = schema.safeParse(data);
  if (result.success) return { data: result.data };

  return {
    error: result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; '),
  };
}

export function inventoryValidationError(c: Context, message: string) {
  return c.json({ status: Status.ERROR, message }, 400);
}
