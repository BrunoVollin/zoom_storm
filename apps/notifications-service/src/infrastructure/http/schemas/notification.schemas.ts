import { z } from 'zod';
import { Status } from '../../../application/contracts/UseCase';
import type { Context } from 'hono';

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
