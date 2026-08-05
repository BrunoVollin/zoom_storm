import { z } from 'zod';

export const AddToWishlistSchema = z.object({
  productId: z.string().min(1),
});
