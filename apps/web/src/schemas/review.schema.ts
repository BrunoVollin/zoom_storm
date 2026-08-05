import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Escolha uma nota").max(5),
  comment: z.string().min(1, "Escreva um comentário"),
  reviewerName: z.string().min(1, "Informe seu nome"),
  reviewerEmail: z.string().min(1, "Informe seu e-mail").email("E-mail inválido"),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
