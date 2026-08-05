import { z } from 'zod';

export const RedeemLoyaltyPointsSchema = z.object({
  points: z.int().min(1),
});
