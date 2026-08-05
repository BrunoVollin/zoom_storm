import { z } from 'zod';

export const UpdateUserProfileSchema = z.object({
  fullName: z.string().min(1),
  document: z.string().min(1),
  address: z.object({
    street: z.string().min(1),
    number: z.string().min(1),
    complement: z.string().min(1).optional().nullable(),
    neighborhood: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(1),
  }),
});
