import { z } from 'zod';

export const CreateFlashOfferSchema = z.object({
  productId: z.string().min(1),
  title: z.string().min(1),
  discountPct: z.number().min(0).max(100),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
});

export const UpdateFlashOfferSchema = z.object({
  title: z.string().min(1),
  discountPct: z.number().min(0).max(100),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
});
