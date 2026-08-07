import { z } from "zod";

export const savedAddressFormSchema = z.object({
  label: z.string().trim().min(1, "Enter a label"),
  recipient: z.string().trim().min(1, "Enter the recipient name"),
  street: z.string().trim().min(1, "Enter the street"),
  number: z.string().trim().min(1, "Enter the number"),
  complement: z.string().trim().optional(),
  neighborhood: z.string().trim().min(1, "Enter the neighborhood"),
  city: z.string().trim().min(1, "Enter the city"),
  state: z.string().trim().length(2, "Use the two-letter state code"),
  zip: z
    .string()
    .trim()
    .refine((value) => value.replace(/\D/g, "").length === 8, "Zip code must have 8 digits"),
  isDefault: z.boolean().default(false),
});

export type SavedAddressFormInput = z.infer<typeof savedAddressFormSchema>;
