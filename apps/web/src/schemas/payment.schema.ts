import { z } from "zod";
import { isFutureExpiryDate, isValidCardNumber } from "@/utils/credit-card";

export const paymentFormSchema = z.object({
  cardNumber: z
    .string()
    .min(1, "Informe o número do cartão")
    .refine((value) => isValidCardNumber(value), "Número de cartão inválido"),
  cardName: z.string().min(1, "Informe o nome impresso no cartão"),
  expiry: z
    .string()
    .min(1, "Informe a validade")
    .refine((value) => isFutureExpiryDate(value), "Cartão vencido ou data inválida (use MM/AA)"),
  cvv: z
    .string()
    .min(3, "CVV inválido")
    .max(4, "CVV inválido")
    .regex(/^\d+$/, "CVV deve conter apenas números"),
  installments: z.coerce.number().int().min(1).max(12),
});

export type PaymentFormInput = z.infer<typeof paymentFormSchema>;

/** Paying with a card already saved on the profile: number/name/expiry were
 * captured (and validated) when the card was first saved, so only the CVV —
 * never persisted — is asked again here. */
export const savedCardPaymentFormSchema = z.object({
  cvv: z
    .string()
    .min(3, "CVV inválido")
    .max(4, "CVV inválido")
    .regex(/^\d+$/, "CVV deve conter apenas números"),
  installments: z.coerce.number().int().min(1).max(12),
});

export type SavedCardPaymentFormInput = z.infer<typeof savedCardPaymentFormSchema>;
