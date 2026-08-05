import { z } from "zod";

export const addCartItemSchema = z.object({
  productId: z.string().min(1, "Selecione um produto"),
  quantity: z.coerce.number().int().min(1, "Quantidade mínima é 1"),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;

export const updateCartItemQuantitySchema = z.object({
  quantity: z.coerce.number().int().min(1, "Quantidade mínima é 1"),
});

export type UpdateCartItemQuantityInput = z.infer<typeof updateCartItemQuantitySchema>;

export const shippingEstimateSchema = z.object({
  cep: z
    .string()
    .min(1, "Informe o CEP")
    .regex(/^\d{5}-?\d{3}$/, "CEP inválido — use o formato 00000-000"),
});

export type ShippingEstimateInput = z.infer<typeof shippingEstimateSchema>;

export const applyCouponSchema = z.object({
  couponId: z.string().min(1, "Informe o código do cupom"),
});

export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
