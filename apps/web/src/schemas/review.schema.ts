import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Choose a rating").max(5),
  comment: z.string().min(1, "Write a comment"),
  reviewerName: z.string().min(1, "Enter your name"),
  reviewerEmail: z.string().min(1, "Enter your email").email("Invalid email"),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
