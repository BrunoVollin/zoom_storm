export interface CartItemProductSnapshot {
  id: string;
  name: string;
  description: string;
  category: string;
  weight: number;
  transportHeight: number;
  transportWidth: number;
  transportLength: number;
}

export interface CartItemVariantSnapshot {
  id: string;
  sku: string;
  name: string | null;
  price: number;
  stock: number;
}

export interface CartItem {
  id: string;
  product: CartItemProductSnapshot;
  variant: CartItemVariantSnapshot;
  quantity: number;
  subtotal: number;
}

export interface Coupon {
  id: string;
  name: string;
  discount: number;
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

export interface CheckoutResponse {
  status: "SUCCESS" | "ERROR";
  cart?: Cart;
  order?: import("./order").Order;
  message?: string;
}

export interface ShippingEstimate {
  shipping: number;
  estimatedDays: number;
  city: string;
  state: string;
}

export interface ShippingResponse {
  status: "SUCCESS" | "ERROR";
  shipping?: number;
  estimatedDays?: number;
  city?: string;
  state?: string;
  message?: string;
}
