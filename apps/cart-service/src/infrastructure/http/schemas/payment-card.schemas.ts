import { z } from 'zod';

// Only last-4/brand/holder/expiry are ever sent to the server — the full
// card number and CVV stay client-side, same policy as PayOrderSchema.
export const AddSavedCardSchema = z.object({
  brand: z.string().min(1),
  lastFour: z.string().regex(/^\d{4}$/),
  holderName: z.string().min(1),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/),
});
