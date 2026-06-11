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
  distance: z.coerce.number().int().min(1, "Informe uma distância válida em km"),
});

export type ShippingEstimateInput = z.infer<typeof shippingEstimateSchema>;
