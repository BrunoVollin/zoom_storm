import { z } from "zod";
import { isFutureExpiryDate, isValidCardNumber } from "@/utils/credit-card";

export const paymentFormSchema = z.object({
  cardNumber: z
    .string()
    .min(1, "Enter the card number")
    .refine((value) => isValidCardNumber(value), "Invalid card number"),
  cardName: z.string().min(1, "Enter the name printed on the card"),
  expiry: z
    .string()
    .min(1, "Enter the expiry date")
    .refine((value) => isFutureExpiryDate(value), "Card expired or invalid date (use MM/YY)"),
  cvv: z
    .string()
    .min(3, "Invalid CVV")
    .max(4, "Invalid CVV")
    .regex(/^\d+$/, "CVV must contain only numbers"),
  installments: z.coerce.number().int().min(1).max(12),
});

export type PaymentFormInput = z.infer<typeof paymentFormSchema>;

/** Paying with a card already saved on the profile: number/name/expiry were
 * captured (and validated) when the card was first saved, so only the CVV —
 * never persisted — is asked again here. */
export const savedCardPaymentFormSchema = z.object({
  cvv: z
    .string()
    .min(3, "Invalid CVV")
    .max(4, "Invalid CVV")
    .regex(/^\d+$/, "CVV must contain only numbers"),
  installments: z.coerce.number().int().min(1).max(12),
});

export type SavedCardPaymentFormInput = z.infer<typeof savedCardPaymentFormSchema>;

/** Adding a card to the profile outside of a payment flow (e.g. from the
 * account settings page) — no CVV/installments involved, just the data
 * that ends up persisted as a saved card. */
export const addCardFormSchema = z.object({
  cardNumber: z
    .string()
    .min(1, "Enter the card number")
    .refine((value) => isValidCardNumber(value), "Invalid card number"),
  cardName: z.string().min(1, "Enter the name printed on the card"),
  expiry: z
    .string()
    .min(1, "Enter the expiry date")
    .refine((value) => isFutureExpiryDate(value), "Card expired or invalid date (use MM/YY)"),
});

export type AddCardFormInput = z.infer<typeof addCardFormSchema>;
