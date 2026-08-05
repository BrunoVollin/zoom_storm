import { z } from "zod";

export const FlashOfferFormSchema = z.object({
  productId: z.string().min(1, "Produto é obrigatório"),
  title: z.string().min(1, "Título é obrigatório"),
  discountPct: z.coerce.number().min(0).max(100),
  startsAt: z.string().min(1, "Data de início é obrigatória"),
  endsAt: z.string().min(1, "Data de término é obrigatória"),
});

export type FlashOfferFormValues = z.infer<typeof FlashOfferFormSchema>;
