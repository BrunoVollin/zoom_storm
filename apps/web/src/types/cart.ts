import type { Product } from "@/types/product";

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

export interface Coupon {
  id: string;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  coupons: Coupon[];
  subtotal: number;
  totalDiscount: number;
  total: number;
}

export interface CartResponse {
  status: "SUCCESS" | "ERROR";
  cart?: Cart;
  message?: string;
}

export interface ShippingResponse {
  status: "SUCCESS" | "ERROR";
  shipping?: number;
  message?: string;
}
