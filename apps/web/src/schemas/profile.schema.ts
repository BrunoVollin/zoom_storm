import { z } from "zod";

/** Only the digit count is checked (11 = CPF, 14 = CNPJ), no checksum —
 * mirrors UserProfile's document validation in cart-service. */
function hasValidDocumentDigitCount(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length === 11 || digits.length === 14;
}

export const profileFormSchema = z.object({
  fullName: z.string().min(1, "Informe seu nome completo"),
  document: z
    .string()
    .min(1, "Informe seu CPF ou CNPJ")
    .refine(hasValidDocumentDigitCount, "Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos"),
  street: z.string().min(1, "Informe a rua"),
  number: z.string().min(1, "Informe o número"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Informe o bairro"),
  city: z.string().min(1, "Informe a cidade"),
  state: z.string().min(1, "Informe o estado"),
  zip: z
    .string()
    .min(1, "Informe o CEP")
    .refine((value) => value.replace(/\D/g, "").length === 8, "CEP deve ter 8 dígitos"),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
