import { z } from "zod";

/** Only the digit count is checked (11 = CPF, 14 = CNPJ), no checksum —
 * mirrors UserProfile's document validation in cart-service. */
function hasValidDocumentDigitCount(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length === 11 || digits.length === 14;
}

export const profileFormSchema = z.object({
  fullName: z.string().min(1, "Enter your full name"),
  document: z
    .string()
    .min(1, "Enter your tax ID (CPF or CNPJ)")
    .refine(hasValidDocumentDigitCount, "Document must have 11 (CPF) or 14 (CNPJ) digits"),
  street: z.string().min(1, "Enter the street"),
  number: z.string().min(1, "Enter the number"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Enter the neighborhood"),
  city: z.string().min(1, "Enter the city"),
  state: z.string().min(1, "Enter the state"),
  zip: z
    .string()
    .min(1, "Enter the zip code")
    .refine((value) => value.replace(/\D/g, "").length === 8, "Zip code must have 8 digits"),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
