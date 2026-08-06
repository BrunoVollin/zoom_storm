import { z } from "zod";

export const addCartItemSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  quantity: z.coerce.number().int().min(1, "Minimum quantity is 1"),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;

export const updateCartItemQuantitySchema = z.object({
  quantity: z.coerce.number().int().min(1, "Minimum quantity is 1"),
});

export type UpdateCartItemQuantityInput = z.infer<typeof updateCartItemQuantitySchema>;

export const shippingEstimateSchema = z.object({
  cep: z
    .string()
    .min(1, "Enter the zip code")
    .regex(/^\d{5}-?\d{3}$/, "Invalid zip code — use the format 00000-000"),
});

export type ShippingEstimateInput = z.infer<typeof shippingEstimateSchema>;

export const applyCouponSchema = z.object({
  couponId: z.string().min(1, "Enter the coupon code"),
});

export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
