import { z } from 'zod';
import { Status } from '../../../application/contracts/UseCase';
import type { Context } from 'hono';

export const CreateProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().min(0),
  description: z.string().min(1),
  category: z.string().min(1),
  stock: z.int().min(0),
  transportHeight: z.int().min(0),
  transportWidth: z.int().min(0),
  transportLength: z.int().min(0),
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
